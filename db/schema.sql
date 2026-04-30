-- Workers
CREATE TABLE IF NOT EXISTS workers (
    id           SERIAL       PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    initials     VARCHAR(4)   NOT NULL,
    role         VARCHAR(50)  NOT NULL,
    avatar_color VARCHAR(20)  NOT NULL,
    is_active    BOOLEAN      DEFAULT TRUE,
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Weekly schedule (ISO day: 1=Mon … 6=Sat, 7=Sun)
CREATE TABLE IF NOT EXISTS worker_schedules (
    id          SERIAL   PRIMARY KEY,
    worker_id   INTEGER  REFERENCES workers(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    start_time  TIME     NOT NULL,
    end_time    TIME     NOT NULL,
    UNIQUE (worker_id, day_of_week)
);

-- Exceptions (vacation, sick days, special hours)
CREATE TABLE IF NOT EXISTS worker_exceptions (
    id             SERIAL   PRIMARY KEY,
    worker_id      INTEGER  REFERENCES workers(id) ON DELETE CASCADE,
    exception_date DATE     NOT NULL,
    is_working     BOOLEAN  DEFAULT FALSE,
    start_time     TIME,
    end_time       TIME,
    note           VARCHAR(255),
    UNIQUE (worker_id, exception_date)
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id               SERIAL       PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    duration_minutes INTEGER      NOT NULL,
    price            INTEGER      NOT NULL,
    description      TEXT,
    is_active        BOOLEAN      DEFAULT TRUE,
    sort_order       INTEGER      DEFAULT 0
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
    id             SERIAL       PRIMARY KEY,
    booking_code   VARCHAR(10)  NOT NULL UNIQUE,
    worker_id      INTEGER      REFERENCES workers(id),
    service_id     INTEGER      REFERENCES services(id),
    booking_date   DATE         NOT NULL,
    start_time     TIME         NOT NULL,
    end_time       TIME         NOT NULL,
    customer_name  VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20)  NOT NULL,
    customer_email VARCHAR(255),
    status         VARCHAR(20)  DEFAULT 'confirmed',
    notes          TEXT,
    created_at     TIMESTAMPTZ  DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- connect-pg-simple session store
CREATE TABLE IF NOT EXISTS session (
    sid    VARCHAR      NOT NULL COLLATE "default" PRIMARY KEY,
    sess   JSON         NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);

-- Prevent double-booking of the same worker slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_no_double_booking
    ON bookings(worker_id, booking_date, start_time)
    WHERE status != 'cancelled';

CREATE INDEX IF NOT EXISTS idx_bookings_date_worker ON bookings(booking_date, worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_schedules_worker_day ON worker_schedules(worker_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_exceptions_worker_date ON worker_exceptions(worker_id, exception_date);
