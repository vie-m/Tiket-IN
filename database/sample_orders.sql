-- ============================================================
-- sample_orders.sql : demo orders + tickets so some seats show as sold
-- Needs users, events and seats from seed.sql. Run after seed.sql.
-- ============================================================

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
