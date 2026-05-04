require('dotenv').config();
const express         = require('express');
const session         = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const path            = require('path');
const fs              = require('fs');
const { pool }        = require('./db');

const app       = express();
const PgSession = connectPgSimple(session);

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'dev_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 },
}));

app.use('/',        require('./routes/index'));
app.use('/booking', require('./routes/booking'));
app.use('/admin',   require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('error', { code: 404, message: 'Side ikke funnet' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).render('error', {
    code: err.status || 500,
    message: 'Noe gikk galt. Prøv igjen.',
  });
});

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => {
    console.log(`Solskinn Frisør kjører på http://localhost:${PORT}`);
  }))
  .catch(err => {
    console.error('Database init failed:', err);
    process.exit(1);
  });
