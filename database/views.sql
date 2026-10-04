-- ============================================================
-- views.sql : saved queries used for availability and reports
-- ============================================================

-- Seat availability per event.
-- total seats = seats in the event's venue; sold = tickets for that event.
-- Subqueries are used so counts do not multiply each other.
CREATE OR REPLACE VIEW event_seat_availability AS
SELECT
  e.id AS event_id,
  (SELECT COUNT(*) FROM seats   s WHERE s.venue_id = e.venue_id) AS total_seats,
  (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id)       AS sold_seats,
  (SELECT COUNT(*) FROM seats   s WHERE s.venue_id = e.venue_id)
  - (SELECT COUNT(*) FROM tickets t WHERE t.event_id = e.id)     AS available_seats
FROM events e;

-- Sales per event: orders, tickets, revenue.
-- LEFT JOIN so events with zero sales still appear (with 0).
-- Cancelled orders are not counted.
CREATE OR REPLACE VIEW event_sales_report AS
SELECT
  e.id    AS event_id,
  e.title AS title,
  e.starts_at,
  COUNT(DISTINCT o.id)             AS orders_count,
  COUNT(t.id)                      AS tickets_sold,
  COALESCE(SUM(t.price), 0)::numeric(12,2) AS total_revenue
FROM events e
LEFT JOIN orders  o ON o.event_id = e.id AND o.status = 'confirmed'
LEFT JOIN tickets t ON t.order_id = o.id
GROUP BY e.id, e.title, e.starts_at;
