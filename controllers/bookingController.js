const { pool } = require('../db');
const { buildDaysLabel } = require('./homeController');
const crypto = require('crypto');

const BOOKING_SECRET = process.env.BOOKING_SECRET || process.env.SESSION_SECRET || 'fallback-change-me';

function signCode(code) {
  return crypto.createHmac('sha256', BOOKING_SECRET).update(code).digest('hex').slice(0, 16);
}

function verifyCode(code, sig) {
  return sig === signCode(code);
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('nb-NO', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  }).format(d);
}

async function computeSlots(workerId, serviceDuration, dateStr) {
  const d       = new Date(dateStr + 'T12:00:00');
  const isoDay  = d.getDay() === 0 ? 7 : d.getDay();

  const schedRow = await pool.query(
    'SELECT start_time, end_time FROM worker_schedules WHERE worker_id = $1 AND day_of_week = $2',
    [workerId, isoDay]
  );
  if (!schedRow.rows.length) return { workerAvailable: false, slots: [] };

  let startM = toMinutes(schedRow.rows[0].start_time);
  let endM   = toMinutes(schedRow.rows[0].end_time);

  const excRow = await pool.query(
    'SELECT is_working, start_time, end_time FROM worker_exceptions WHERE worker_id = $1 AND exception_date = $2',
    [workerId, dateStr]
  );
  if (excRow.rows.length) {
    const exc = excRow.rows[0];
    if (!exc.is_working) return { workerAvailable: false, slots: [] };
    startM = toMinutes(exc.start_time);
    endM   = toMinutes(exc.end_time);
  }

  // Existing bookings that overlap this day
  const booked = await pool.query(
    `SELECT start_time, end_time FROM bookings
     WHERE worker_id = $1 AND booking_date = $2 AND status != 'cancelled'`,
    [workerId, dateStr]
  );
  const bookedRanges = booked.rows.map(r => ({
    s: toMinutes(r.start_time),
    e: toMinutes(r.end_time),
  }));

  // Past-time cutoff for today
  const today      = new Date().toISOString().slice(0, 10);
  const nowCutoff  = dateStr === today
    ? new Date().getHours() * 60 + new Date().getMinutes() + 30
    : -1;

  const slots = [];
  const INTERVAL = 15;
  for (let cur = startM; cur + serviceDuration <= endM; cur += INTERVAL) {
    const slotEnd = cur + serviceDuration;
    const isPast  = nowCutoff !== -1 && cur <= nowCutoff;
    const isBooked = bookedRanges.some(r => r.s < slotEnd && r.e > cur);
    slots.push({ time: fromMinutes(cur), available: !isPast && !isBooked });
  }

  return { workerAvailable: true, slots };
}

async function generateBookingCode() {
  while (true) {
    const num  = Math.floor(1000 + Math.random() * 9000);
    const code = `SOL-${num}`;
    const { rowCount } = await pool.query(
      'SELECT id FROM bookings WHERE booking_code = $1', [code]
    );
    if (rowCount === 0) return code;
  }
}

// Build 21-day forward date strip filtered to worker's working days
async function buildDateStrip(workerId) {
  const schedRows = await pool.query(
    'SELECT day_of_week FROM worker_schedules WHERE worker_id = $1', [workerId]
  );
  const workDays = new Set(schedRows.rows.map(r => r.day_of_week));

  const excRows = await pool.query(
    `SELECT exception_date::text, is_working FROM worker_exceptions
     WHERE worker_id = $1 AND exception_date >= CURRENT_DATE`,
    [workerId]
  );
  const exceptions = {};
  excRows.rows.forEach(r => { exceptions[r.exception_date] = r.is_working; });

  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 21; i++) {
    const d      = new Date(today);
    d.setDate(today.getDate() + i);
    const iso    = d.toISOString().slice(0, 10);
    const isoDay = d.getDay() === 0 ? 7 : d.getDay();

    let available = workDays.has(isoDay);
    if (exceptions[iso] !== undefined) available = exceptions[iso];
    if (!available) continue;

    dates.push({
      iso,
      display: new Intl.DateTimeFormat('nb-NO', { weekday: 'short', day: 'numeric', month: 'short' }).format(d),
      dayShort: new Intl.DateTimeFormat('nb-NO', { weekday: 'short' }).format(d),
      dayNum:   d.getDate(),
    });
  }
  return dates;
}

// ─── step 1 ───────────────────────────────────────────────────────────────────

exports.getStep1 = async (req, res) => {
  const services = await pool.query(
    'SELECT * FROM services WHERE is_active = TRUE ORDER BY sort_order'
  );
  res.render('booking/step1-service', {
    services: services.rows,
    selected: req.session.booking?.serviceId || null,
    activeNav: 'book',
    currentStep: 1,
  });
};

exports.postStep1 = async (req, res) => {
  const serviceId = parseInt(req.body.serviceId, 10);
  if (!serviceId) return res.redirect('/booking/step1');

  const row = await pool.query('SELECT * FROM services WHERE id = $1 AND is_active = TRUE', [serviceId]);
  if (!row.rows.length) return res.redirect('/booking/step1');

  const s = row.rows[0];
  req.session.booking = {
    ...(req.session.booking || {}),
    step: 1,
    serviceId: s.id,
    serviceName: s.name,
    serviceDuration: s.duration_minutes,
    servicePrice: s.price,
  };
  res.redirect('/booking/step2');
};

// ─── step 2 ───────────────────────────────────────────────────────────────────

exports.getStep2 = async (req, res) => {
  const rows = await pool.query(
    `SELECT w.id, w.name, w.initials, w.role, w.avatar_color,
            array_agg(ws.day_of_week ORDER BY ws.day_of_week) AS workdays
     FROM workers w
     LEFT JOIN worker_schedules ws ON ws.worker_id = w.id
     WHERE w.is_active = TRUE
     GROUP BY w.id ORDER BY w.id`
  );
  const workers = rows.rows.map(w => ({ ...w, daysLabel: buildDaysLabel(w.workdays) }));

  res.render('booking/step2-worker', {
    workers,
    booking: req.session.booking,
    activeNav: 'book',
    currentStep: 2,
  });
};

exports.postStep2 = async (req, res) => {
  const workerId = parseInt(req.body.workerId, 10);
  if (!workerId) return res.redirect('/booking/step2');

  const row = await pool.query('SELECT * FROM workers WHERE id = $1 AND is_active = TRUE', [workerId]);
  if (!row.rows.length) return res.redirect('/booking/step2');

  const w = row.rows[0];
  req.session.booking = {
    ...req.session.booking,
    step: 2,
    workerId: w.id,
    workerName: w.name,
    workerInitials: w.initials,
  };
  res.redirect('/booking/step3');
};

// ─── step 3 ───────────────────────────────────────────────────────────────────

exports.getStep3 = async (req, res) => {
  const b     = req.session.booking;
  const dates = await buildDateStrip(b.workerId);
  const first = dates[0];
  let initialSlots = [];
  if (first) {
    const result = await computeSlots(b.workerId, b.serviceDuration, first.iso);
    initialSlots = result.slots;
  }

  res.render('booking/step3-datetime', {
    booking: b,
    dates,
    initialDate: first ? first.iso : null,
    initialSlots,
    activeNav: 'book',
    currentStep: 3,
  });
};

exports.getSlots = async (req, res) => {
  const { date, workerId, serviceId } = req.query;
  if (!date || !workerId || !serviceId) return res.json({ workerAvailable: false, slots: [] });

  const svcRow = await pool.query('SELECT duration_minutes FROM services WHERE id = $1', [serviceId]);
  if (!svcRow.rows.length) return res.json({ workerAvailable: false, slots: [] });

  const result = await computeSlots(parseInt(workerId, 10), svcRow.rows[0].duration_minutes, date);
  res.json(result);
};

exports.postStep3 = async (req, res) => {
  const b    = req.session.booking;
  const date = req.body.date;
  const time = req.body.time;
  if (!date || !time) return res.redirect('/booking/step3');

  const result = await computeSlots(b.workerId, b.serviceDuration, date);
  const slot   = result.slots.find(s => s.time === time && s.available);
  if (!slot) return res.redirect('/booking/step3');

  const endMins = toMinutes(time) + b.serviceDuration;

  req.session.booking = {
    ...b,
    step: 3,
    date,
    dateDisplay: formatDateDisplay(date),
    time,
    endTime: fromMinutes(endMins),
  };
  res.redirect('/booking/step4');
};

// ─── step 4 ───────────────────────────────────────────────────────────────────

exports.getStep4 = (req, res) => {
  res.render('booking/step4-contact', {
    booking: req.session.booking,
    error: null,
    activeNav: 'book',
    currentStep: 4,
  });
};

exports.postStep4 = async (req, res) => {
  const b             = req.session.booking;
  const customerName  = (req.body.customerName || '').trim();
  const customerPhone = (req.body.customerPhone || '').trim();
  const customerEmail = (req.body.customerEmail || '').trim();

  if (!customerName || !customerPhone) {
    return res.render('booking/step4-contact', {
      booking: b,
      error: 'Navn og telefonnummer er påkrevd.',
      activeNav: 'book',
      currentStep: 4,
    });
  }
  if (!/^\d{8}$/.test(customerPhone.replace(/\s/g, ''))) {
    return res.render('booking/step4-contact', {
      booking: b,
      error: 'Telefonnummer må være 8 siffer.',
      activeNav: 'book',
      currentStep: 4,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Re-check availability inside transaction (overlap, not just exact start_time)
    const conflict = await client.query(
      `SELECT id FROM bookings
       WHERE worker_id = $1 AND booking_date = $2
         AND start_time < $4 AND end_time > $3
         AND status != 'cancelled'`,
      [b.workerId, b.date, b.time, b.endTime]
    );
    if (conflict.rows.length) {
      await client.query('ROLLBACK');
      return res.render('booking/step4-contact', {
        booking: b,
        error: 'Denne timen er dessverre opptatt. Gå tilbake og velg en annen tid.',
        activeNav: 'book',
        currentStep: 4,
      });
    }

    const code = await generateBookingCode();
    await client.query(
      `INSERT INTO bookings
       (booking_code, worker_id, service_id, booking_date, start_time, end_time,
        customer_name, customer_phone, customer_email)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [code, b.workerId, b.serviceId, b.date, b.time, b.endTime,
       customerName, customerPhone, customerEmail || null]
    );

    await client.query('COMMIT');
    delete req.session.booking;
    res.redirect(`/booking/confirmation/${code}?v=${signCode(code)}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ─── confirmation ─────────────────────────────────────────────────────────────

exports.getConfirmation = async (req, res) => {
  const code = req.params.code;
  const sig  = req.query.v;

  if (!sig || !verifyCode(code, sig)) {
    return res.status(403).render('error', { code: 403, message: 'Ugyldig bekreftelseslenke' });
  }

  const row = await pool.query(
    `SELECT b.*, w.name AS worker_name, s.name AS service_name,
            s.duration_minutes, s.price
     FROM bookings b
     JOIN workers w  ON w.id = b.worker_id
     JOIN services s ON s.id = b.service_id
     WHERE b.booking_code = $1`,
    [req.params.code]
  );
  if (!row.rows.length) return res.status(404).render('error', { code: 404, message: 'Bestilling ikke funnet' });

  const bk = row.rows[0];
  res.render('booking/confirmation', {
    bk,
    dateDisplay: formatDateDisplay(bk.booking_date.toISOString().slice(0, 10)),
    activeNav: 'profil',
    currentStep: null,
  });
};
