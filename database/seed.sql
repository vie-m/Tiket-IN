-- ============================================================
-- seed.sql : sample data
-- ============================================================

-- pgcrypto gives us crypt() + gen_salt('bf', 10): bcrypt hashes
-- that bcryptjs can verify.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users ------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role) VALUES
  ('Admin User', 'admin@demo.com', crypt('Admin12345',   gen_salt('bf', 10)), 'admin'),
  ('Budi Santoso', 'budi@demo.com', crypt('Password123', gen_salt('bf', 10)), 'customer'),
  ('Sari Wulandari', 'sari@demo.com', crypt('Password123', gen_salt('bf', 10)), 'customer');

-- Venues -----------------------------------------------------
INSERT INTO venues (name, city, address) VALUES
  ('Teater Kecil',          'Bandung', 'Jl. Braga No. 10'),            -- id 1: 6 rows x 10
  ('Jakarta Convention Hall','Jakarta', 'Jl. Gatot Subroto No. 1');    -- id 2: 10 rows x 12

-- Seats (generated, not hand-written) ------------------------
-- chr(64 + r) turns 1 -> 'A', 2 -> 'B', ...
-- Front rows (first 2 rows) are VIP, the rest Regular.
INSERT INTO seats (venue_id, section, row_label, seat_number)
SELECT 1,
       CASE WHEN r <= 2 THEN 'VIP' ELSE 'Regular' END,
       chr(64 + r),
       n
FROM generate_series(1, 6)  AS r,
     generate_series(1, 10) AS n;

INSERT INTO seats (venue_id, section, row_label, seat_number)
SELECT 2,
       CASE WHEN r <= 3 THEN 'VIP' ELSE 'Regular' END,
       chr(64 + r),
       n
FROM generate_series(1, 10) AS r,
     generate_series(1, 12) AS n;

-- Events (upcoming, relative to now) -------------------------
INSERT INTO events (venue_id, title, description, category, starts_at, image_url) VALUES
  (1, 'Laskar Pelangi The Musical', 'A touching stage adaptation of the famous novel.', 'Theater', now() + interval '10 days', NULL),
  (1, 'Jazz Night Bandung',         'An evening of smooth jazz with local artists.',    'Music',   now() + interval '14 days', NULL),
  (1, 'Stand-Up Comedy Special',    'Top comedians, one stage, lots of laughs.',        'Comedy',  now() + interval '20 days', NULL),
  (2, 'Indie Rock Festival',        'Five indie bands live in Jakarta.',                'Music',   now() + interval '12 days', NULL),
  (2, 'Symphony Under the Lights',  'Orchestra performs film classics.',                'Music',   now() + interval '25 days', NULL),
  (2, 'Tech Conference 2026',       'Talks and workshops about modern software.',       'Conference', now() + interval '30 days', NULL);

-- Prices in IDR: 750000 VIP / 350000 Regular (a bit different for some events)
INSERT INTO event_prices (event_id, section, price)
SELECT e.id, 'VIP',
       CASE WHEN e.id IN (4, 5) THEN 1000000 ELSE 750000 END
FROM events e;
INSERT INTO event_prices (event_id, section, price)
SELECT e.id, 'Regular',
       CASE WHEN e.id IN (4, 5) THEN 500000 ELSE 350000 END
FROM events e;

-- Existing orders + tickets so some seats already show as sold --
-- Budi: event 1, seats A1, A2 (VIP)
INSERT INTO orders (user_id, event_id, total_amount) VALUES
  ((SELECT id FROM users WHERE email = 'budi@demo.com'), 1, 1500000);
INSERT INTO tickets (order_id, event_id, seat_id, price)
SELECT currval('orders_id_seq'), 1, s.id, 750000
FROM seats s
WHERE s.venue_id = 1 AND s.row_label = 'A' AND s.seat_number IN (1, 2);

-- Sari: event 1, seats D5, D6, D7 (Regular)
INSERT INTO orders (user_id, event_id, total_amount) VALUES
  ((SELECT id FROM users WHERE email = 'sari@demo.com'), 1, 1050000);
INSERT INTO tickets (order_id, event_id, seat_id, price)
SELECT currval('orders_id_seq'), 1, s.id, 350000
FROM seats s
WHERE s.venue_id = 1 AND s.row_label = 'D' AND s.seat_number IN (5, 6, 7);

-- Budi: event 4, seats E3, E4 (Regular, 500000)
INSERT INTO orders (user_id, event_id, total_amount) VALUES
  ((SELECT id FROM users WHERE email = 'budi@demo.com'), 4, 1000000);
INSERT INTO tickets (order_id, event_id, seat_id, price)
SELECT currval('orders_id_seq'), 4, s.id, 500000
FROM seats s
WHERE s.venue_id = 2 AND s.row_label = 'E' AND s.seat_number IN (3, 4);
