const { pool } = require('../db');

exports.getHome = async (req, res, next) => {
  const services = await pool.query(
    'SELECT * FROM services WHERE is_active = TRUE ORDER BY sort_order'
  );
  const workers = await pool.query(
    `SELECT w.id, w.name, w.initials, w.role, w.avatar_color,
            array_agg(ws.day_of_week ORDER BY ws.day_of_week) AS workdays
     FROM workers w
     LEFT JOIN worker_schedules ws ON ws.worker_id = w.id
     WHERE w.is_active = TRUE
     GROUP BY w.id
     ORDER BY w.id`
  );
  res.render('home', {
    services: services.rows,
    workers: workers.rows.map(w => ({ ...w, daysLabel: buildDaysLabel(w.workdays) })),
    activeNav: 'hjem',
  });
};

function buildDaysLabel(days) {
  if (!days || !days.length) return '';
  const map = { 1: 'Man', 2: 'Tir', 3: 'Ons', 4: 'Tor', 5: 'Fre', 6: 'Lør', 7: 'Søn' };
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 1) return map[sorted[0]];
  return `${map[sorted[0]]} – ${map[sorted[sorted.length - 1]]}`;
}

module.exports.buildDaysLabel = buildDaysLabel;
