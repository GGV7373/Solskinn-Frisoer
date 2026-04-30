-- Workers
INSERT INTO workers (name, initials, role, avatar_color) VALUES
    ('Lise Haugen',       'LH', 'Eier',   'amber'),
    ('Maria Kristiansen', 'MK', 'Frisør', 'coral'),
    ('Jonas Eriksen',     'JE', 'Frisør', 'teal'),
    ('Anna Larsen',       'AL', 'Deltid', 'gray')
ON CONFLICT DO NOTHING;

-- Lise: Mon–Sat
INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time) VALUES
    (1, 1, '09:00', '18:00'),
    (1, 2, '09:00', '18:00'),
    (1, 3, '09:00', '18:00'),
    (1, 4, '09:00', '18:00'),
    (1, 5, '09:00', '18:00'),
    (1, 6, '09:00', '15:00')
ON CONFLICT DO NOTHING;

-- Maria: Mon–Fri
INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time) VALUES
    (2, 1, '09:00', '18:00'),
    (2, 2, '09:00', '18:00'),
    (2, 3, '09:00', '18:00'),
    (2, 4, '09:00', '18:00'),
    (2, 5, '09:00', '18:00')
ON CONFLICT DO NOTHING;

-- Jonas: Tue–Sat
INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time) VALUES
    (3, 2, '09:00', '18:00'),
    (3, 3, '09:00', '18:00'),
    (3, 4, '09:00', '18:00'),
    (3, 5, '09:00', '18:00'),
    (3, 6, '09:00', '15:00')
ON CONFLICT DO NOTHING;

-- Anna: Wed–Fri (part-time)
INSERT INTO worker_schedules (worker_id, day_of_week, start_time, end_time) VALUES
    (4, 3, '10:00', '16:00'),
    (4, 4, '10:00', '16:00'),
    (4, 5, '10:00', '16:00')
ON CONFLICT DO NOTHING;

-- Services
INSERT INTO services (name, duration_minutes, price, sort_order) VALUES
    ('Herreklipp',      30, 350, 1),
    ('Dameklipp',       45, 450, 2),
    ('Farging + klipp', 90, 800, 3)
ON CONFLICT DO NOTHING;
