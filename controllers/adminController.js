const { pool } = require('../db');

const DAYS = [
  { num: 1, label: 'Mandag' },
  { num: 2, label: 'Tirsdag' },
  { num: 3, label: 'Onsdag' },
  { num: 4, label: 'Torsdag' },
  { num: 5, label: 'Fredag' },
  { num: 6, label: 'Lørdag' },
  { num: 7, label: 'Søndag' },
];

function fmtDate(d) {
  if (!d) return '—';
  const iso = d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
  return new Intl.DateTimeFormat('nb-NO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso + 'T12:00:00'));
}
function fmtTime(t) {
  return t ? String(t).slice(0, 5) : '—';
}

// ── Login ──────────────────────────────────────────────────────────────────────

exports.getLogin = (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/admin/dashboard');
  res.render('admin/login', { error: null });
};

exports.postLogin = (req, res) => {
  const pw = (req.body.password || '').trim();
  const adminPw = process.env.ADMIN_PASSWORD || 'admin';
  if (pw === adminPw) {
    req.session.adminLoggedIn = true;
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: 'Feil passord. Prøv igjen.' });
};

exports.logout = (req, res) => {
  req.session.adminLoggedIn = false;
  res.redirect('/admin/login');
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

exports.getDashboard = async (req, res, next) => {
  try {
    const [todayRes, weekRes, totalRes, upcomingRes] = await Promise.all([
      pool.query(
        "SELECT COUNT(*) FROM bookings WHERE booking_date = CURRENT_DATE AND status IS DISTINCT FROM 'cancelled'"
      ),
      pool.query(
        "SELECT COUNT(*) FROM bookings WHERE booking_date >= CURRENT_DATE AND booking_date < CURRENT_DATE + 7 AND status IS DISTINCT FROM 'cancelled'"
      ),
      pool.query(
        "SELECT COUNT(*) FROM bookings WHERE status IS DISTINCT FROM 'cancelled'"
      ),
      pool.query(`
        SELECT b.id, b.booking_code, b.booking_date, b.start_time, b.end_time,
               b.customer_name, b.customer_phone, b.status,
               w.name AS worker_name, s.name AS service_name
        FROM bookings b
        JOIN workers w  ON w.id = b.worker_id
        JOIN services s ON s.id = b.service_id
        WHERE b.booking_date >= CURRENT_DATE AND b.status IS DISTINCT FROM 'cancelled'
        ORDER BY b.booking_date ASC, b.start_time ASC
        LIMIT 15
      `),
    ]);

    res.render('admin/dashboard', {
      page: 'dashboard',
      stats: {
        today: todayRes.rows[0].count,
        week:  weekRes.rows[0].count,
        total: totalRes.rows[0].count,
      },
      upcoming: upcomingRes.rows.map(r => ({
        ...r,
        dateDisplay: fmtDate(r.booking_date),
        startTime:   fmtTime(r.start_time),
        endTime:     fmtTime(r.end_time),
      })),
    });
  } catch (err) { next(err); }
};

// ── Bestillinger ──────────────────────────────────────────────────────────────

exports.getBestillinger = async (req, res, next) => {
  try {
    const { dato, arbeider } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (dato)     { params.push(dato);             where += ` AND b.booking_date = $${params.length}`; }
    if (arbeider) { params.push(parseInt(arbeider)); where += ` AND b.worker_id  = $${params.length}`; }

    const [bookingsRes, workersRes] = await Promise.all([
      pool.query(`
        SELECT b.id, b.booking_code, b.booking_date, b.start_time, b.end_time,
               b.customer_name, b.customer_phone, b.customer_email, b.status,
               w.name AS worker_name, s.name AS service_name, s.price
        FROM bookings b
        JOIN workers w  ON w.id = b.worker_id
        JOIN services s ON s.id = b.service_id
        ${where}
        ORDER BY b.booking_date DESC, b.start_time DESC
        LIMIT 200
      `, params),
      pool.query('SELECT id, name FROM workers WHERE is_active = TRUE ORDER BY name'),
    ]);

    res.render('admin/bestillinger', {
      page: 'bestillinger',
      bookings: bookingsRes.rows.map(r => ({
        ...r,
        dateDisplay: fmtDate(r.booking_date),
        startTime:   fmtTime(r.start_time),
        endTime:     fmtTime(r.end_time),
      })),
      workers: workersRes.rows,
      filters: { dato: dato || '', arbeider: arbeider || '' },
    });
  } catch (err) { next(err); }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = $1", [req.params.id]);
    const ref = req.get('Referer') || '/admin/bestillinger';
    res.redirect(ref);
  } catch (err) { next(err); }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM bookings WHERE id = $1', [req.params.id]);
    const ref = req.get('Referer') || '/admin/bestillinger';
    res.redirect(ref);
  } catch (err) { next(err); }
};

// ── Arbeidsplan ───────────────────────────────────────────────────────────────

exports.getArbeidsplan = async (req, res, next) => {
  try {
    const [workersRes, schedRes] = await Promise.all([
      pool.query('SELECT id, name, role, initials, avatar_color FROM workers WHERE is_active = TRUE ORDER BY id'),
      pool.query('SELECT worker_id, day_of_week, start_time, end_time FROM worker_schedules ORDER BY worker_id, day_of_week'),
    ]);

    const scheduleMap = {};
    schedRes.rows.forEach(s => {
      if (!scheduleMap[s.worker_id]) scheduleMap[s.worker_id] = {};
      scheduleMap[s.worker_id][s.day_of_week] = {
        start: fmtTime(s.start_time),
        end:   fmtTime(s.end_time),
      };
    });

    res.render('admin/arbeidsplan', {
      page: 'arbeidsplan',
      workers: workersRes.rows,
      scheduleMap,
      days: DAYS,
      saved: req.query.saved || null,
    });
  } catch (err) { next(err); }
};

exports.postArbeidsplan = async (req, res, next) => {
  const workerId = parseInt(req.params.workerId, 10);
  const raw = req.body.days;
  const checkedDays = raw ? (Array.isArray(raw) ? raw.map(Number) : [Number(raw)]) : [];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM worker_schedules WHERE worker_id = $1', [workerId]);
    for (const day of checkedDays) {
      const start = req.body[`start_${day}`] || '09:00';
      const end   = req.body[`end_${day}`]   || '18:00';
      await client.query(
        'INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time) VALUES ($1,$2,$3,$4)',
        [workerId, day, start, end]
      );
    }
    await client.query('COMMIT');
    res.redirect('/admin/arbeidsplan?saved=' + workerId);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// ── Ansatte ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['amber', 'coral', 'teal', 'gray', 'blue', 'green', 'purple', 'rose'];

exports.getAnsatte = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM workers ORDER BY id');
    res.render('admin/ansatte', {
      page: 'ansatte',
      workers: result.rows,
      colors: AVATAR_COLORS,
      saved: req.query.saved || null,
      error: null,
    });
  } catch (err) { next(err); }
};

exports.postAnsatt = async (req, res, next) => {
  const { name, initials, role, avatar_color } = req.body;
  try {
    await pool.query(
      'INSERT INTO workers (name, initials, role, avatar_color) VALUES ($1,$2,$3,$4)',
      [name.trim(), initials.trim().toUpperCase(), role.trim(), avatar_color]
    );
    res.redirect('/admin/ansatte?saved=1');
  } catch (err) { next(err); }
};

exports.postEditAnsatt = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { name, initials, role, avatar_color, is_active } = req.body;
  try {
    await pool.query(
      'UPDATE workers SET name=$1, initials=$2, role=$3, avatar_color=$4, is_active=$5 WHERE id=$6',
      [name.trim(), initials.trim().toUpperCase(), role.trim(), avatar_color, is_active === 'true', id]
    );
    res.redirect('/admin/ansatte?saved=1');
  } catch (err) { next(err); }
};

exports.deleteAnsatt = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  try {
    await pool.query('UPDATE workers SET is_active = FALSE WHERE id = $1', [id]);
    res.redirect('/admin/ansatte');
  } catch (err) { next(err); }
};

// ── Tjenester ─────────────────────────────────────────────────────────────────

exports.getTjenester = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM services ORDER BY sort_order, id');
    res.render('admin/tjenester', {
      page: 'tjenester',
      services: result.rows,
      saved: req.query.saved || null,
    });
  } catch (err) { next(err); }
};

exports.postTjeneste = async (req, res, next) => {
  const { name, duration_minutes, price, description } = req.body;
  try {
    await pool.query(
      'INSERT INTO services (name, duration_minutes, price, description) VALUES ($1,$2,$3,$4)',
      [name.trim(), parseInt(duration_minutes, 10), parseInt(price, 10), (description || '').trim() || null]
    );
    res.redirect('/admin/tjenester?saved=1');
  } catch (err) { next(err); }
};

exports.postEditTjeneste = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const { name, duration_minutes, price, description, is_active, sort_order } = req.body;
  try {
    await pool.query(
      'UPDATE services SET name=$1, duration_minutes=$2, price=$3, description=$4, is_active=$5, sort_order=$6 WHERE id=$7',
      [name.trim(), parseInt(duration_minutes, 10), parseInt(price, 10), (description || '').trim() || null, is_active === 'true', parseInt(sort_order, 10) || 0, id]
    );
    res.redirect('/admin/tjenester?saved=1');
  } catch (err) { next(err); }
};

exports.deleteTjeneste = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  try {
    await pool.query('UPDATE services SET is_active = FALSE WHERE id = $1', [id]);
    res.redirect('/admin/tjenester');
  } catch (err) { next(err); }
};
