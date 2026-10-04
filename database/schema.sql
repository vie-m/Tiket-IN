-- ============================================================
-- schema.sql : tables, constraints, indexes
-- Normalized to 3NF. snake_case names.
-- Re-runnable: drops everything first (dev only!).
-- ============================================================

DROP TABLE IF EXISTS tickets      CASCADE;
DROP TABLE IF EXISTS orders       CASCADE;
DROP TABLE IF EXISTS event_prices CASCADE;
DROP TABLE IF EXISTS events       CASCADE;
DROP TABLE IF EXISTS seats        CASCADE;
DROP TABLE IF EXISTS venues       CASCADE;
DROP TABLE IF EXISTS users        CASCADE;

-- 1. users: one row per account.
--    Only the bcrypt HASH is stored, never the plain password.
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,            -- UNIQUE = no two accounts with same email
  password_hash TEXT         NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (email = lower(email))                           -- emails must be stored lowercase
);

-- 2. venues: a place that hosts events.
CREATE TABLE venues (
  id      SERIAL PRIMARY KEY,
  name    VARCHAR(100) NOT NULL,
  city    VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL
);

-- 3. seats: physical seats belong to a VENUE (not to an event).
--    Whether a seat is sold is a per-event fact, so it lives in tickets.
CREATE TABLE seats (
  id          SERIAL PRIMARY KEY,
  venue_id    INTEGER     NOT NULL REFERENCES venues(id),
  section     VARCHAR(10) NOT NULL CHECK (section IN ('VIP', 'Regular')),
  row_label   VARCHAR(3)  NOT NULL,                      -- e.g. 'A'
  seat_number INTEGER     NOT NULL CHECK (seat_number > 0),
  UNIQUE (venue_id, row_label, seat_number)              -- no duplicate seat labels in a venue
);

-- 4. events: something that happens at a venue at a certain time.
CREATE TABLE events (
  id          SERIAL PRIMARY KEY,
  venue_id    INTEGER      NOT NULL REFERENCES venues(id),
  title       VARCHAR(150) NOT NULL,
  description TEXT         NOT NULL DEFAULT '',
  category    VARCHAR(50)  NOT NULL,
  starts_at   TIMESTAMPTZ  NOT NULL,
  image_url   TEXT                                       -- nullable
);

-- 5. event_prices: price depends on (event, section). Composite primary key.
--    Kept in its own table so price is not repeated on every seat (3NF).
CREATE TABLE event_prices (
  event_id INTEGER       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  section  VARCHAR(10)   NOT NULL CHECK (section IN ('VIP', 'Regular')),
  price    NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  PRIMARY KEY (event_id, section)
);

-- 6. orders: one purchase by one user for one event.
--    No customer name/email here - get them by JOIN users (3NF).
CREATE TABLE orders (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id),
  event_id     INTEGER       NOT NULL REFERENCES events(id),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status       VARCHAR(10)   NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('confirmed', 'cancelled')),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 7. tickets: one row per sold seat.
--    event_id is stored here (also reachable via orders) ON PURPOSE:
--    it is needed for UNIQUE (event_id, seat_id), the final
--    double-booking guard. The database itself refuses a 2nd sale.
CREATE TABLE tickets (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER       NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_id   INTEGER       NOT NULL REFERENCES events(id),
  seat_id    INTEGER       NOT NULL REFERENCES seats(id),
  price      NUMERIC(10,2) NOT NULL CHECK (price >= 0),   -- price at purchase time
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (event_id, seat_id)                              -- a seat can be sold once per event
);

-- ------------------------------------------------------------
-- Indexes (PostgreSQL does NOT auto-index foreign keys)
-- ------------------------------------------------------------
-- Find all seats of a venue (seat map, seat counts).
CREATE INDEX idx_seats_venue_id    ON seats(venue_id);
-- Find events at a venue (JOIN events -> venues).
CREATE INDEX idx_events_venue_id   ON events(venue_id);
-- "My orders" page: WHERE user_id = ...
CREATE INDEX idx_orders_user_id    ON orders(user_id);
-- Sales report: group orders by event.
CREATE INDEX idx_orders_event_id   ON orders(event_id);
-- Load the tickets of an order.
CREATE INDEX idx_tickets_order_id  ON tickets(order_id);
-- Count/lookup sold seats for an event (availability view).
CREATE INDEX idx_tickets_event_id  ON tickets(event_id);
-- Event list is filtered/sorted by date: "upcoming events".
CREATE INDEX idx_events_starts_at  ON events(starts_at);
