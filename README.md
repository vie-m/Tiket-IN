# Tiket-IN - Event Ticketing with Seat Booking and User Accounts

Full-stack web app: create an account, log in, browse events, pick seats on a seat map and book tickets.
The key feature: **two people can never book the same seat for the same event**, even if they click "Book" at the same moment.

> Screenshot: _add a screenshot here_

## Features
- Register / login with hashed passwords and JWT sessions
- Browse upcoming events (seats left, starting price)
- Interactive seat map (VIP / Regular, max 6 seats, auto-refresh every 15 s)
- Safe booking transaction (no double booking)
- My Tickets, confirmation page
- Admin-only sales report (from a SQL view)

## Tech stack
React 18 + Vite + Tailwind CSS + react-router-dom | Node.js + Express | PostgreSQL via `pg` (raw parameterized SQL, no ORM) | bcryptjs + jsonwebtoken

## Database design (ERD)

```mermaid
erDiagram
  users ||--o{ orders : places
  events ||--o{ orders : "is booked in"
  orders ||--|{ tickets : contains
  events ||--o{ tickets : "sells"
  seats ||--o{ tickets : "is sold as"
  venues ||--o{ seats : has
  venues ||--o{ events : hosts
  events ||--|{ event_prices : "has prices"

  users { int id PK
          string full_name
          string email UK
          string password_hash
          string role }
  venues { int id PK
           string name
           string city
           string address }
  seats { int id PK
          int venue_id FK
          string section
          string row_label
          int seat_number }
  events { int id PK
           int venue_id FK
           string title
           timestamptz starts_at }
  event_prices { int event_id PK,FK
                 string section PK
                 numeric price }
  orders { int id PK
           int user_id FK
           int event_id FK
           numeric total_amount
           string status }
  tickets { int id PK
            int order_id FK
            int event_id FK
            int seat_id FK
            numeric price }
```

**Normalization (3NF).** Every table stores facts about one thing only. Seats belong to a *venue* (a physical fact), while "is this seat sold?" is an *event* fact, so it lives in `tickets`. Prices depend on (event, section), so they have their own table `event_prices` instead of being repeated on every seat. Orders store only `user_id`; name and email are fetched with a JOIN to `users`, so there is no duplicated data to get out of sync. One deliberate exception: `tickets.event_id` is also reachable through `orders`, but it is stored so that `UNIQUE (event_id, seat_id)` can exist (see below).

## How double booking is prevented
Three layers, all in `server/src/services/bookingService.js` and `database/schema.sql`:
1. **Transaction** (`BEGIN ... COMMIT`, `ROLLBACK` on error): the order and all its tickets are saved together or not at all.
2. **Row locking** with `SELECT ... FROM seats WHERE id = ANY($1) ORDER BY id FOR UPDATE`. If two requests want the same seat, the second one *waits* until the first commits, then sees the ticket and gets HTTP 409. `ORDER BY id` makes every transaction lock seats in the same order, which prevents deadlocks.
3. **`UNIQUE (event_id, seat_id)` on `tickets`**: even if the code had a bug, PostgreSQL refuses to store a second ticket for the same seat. The code catches error `23505` and returns 409 instead of 500.

## How authentication works
- **Register:** the password is hashed with bcrypt (cost 10, random salt added automatically). Only the hash is stored. A duplicate email hits the UNIQUE constraint (error `23505`) -> 409.
- **Login:** bcrypt compares the typed password with the stored hash. Wrong email and wrong password return the *same* message so attackers can't find out which emails exist. On success the server signs a **JWT** (user id + role, expires in 1 day) with `JWT_SECRET`.
- **Protected routes:** the browser sends `Authorization: Bearer <token>`. `requireAuth` verifies the signature and expiry and sets `req.user`. `requireAdmin` additionally checks `role === 'admin'` (403 otherwise). The user id for bookings always comes from the token, never from the request body.
- On the frontend, `ProtectedRoute` redirects to login and back; any 401 logs the user out.

> Note: the token is kept in `localStorage` for simplicity. In production, `httpOnly` cookies are more secure because JavaScript (and so XSS attacks) cannot read them.

## Concurrency test
`npm run test:concurrency` (in `server/`, with the API running) sends 10 simultaneous bookings for one seat.

```
Target: event 2, seat A1 (id 1)
Requests sent : 10
Succeeded (201): 1
Conflicts (409): 9
PASS
```

## EXPLAIN ANALYZE example
```sql
EXPLAIN ANALYZE SELECT * FROM tickets WHERE event_id = 1;
```
```
Bitmap Heap Scan on tickets  (cost=4.20..13.67 rows=6 width=40) (actual time=0.019..0.020 rows=5 loops=1)
  Recheck Cond: (event_id = 1)
  ->  Bitmap Index Scan on idx_tickets_event_id  (cost=0.00..4.20 rows=6 width=0) (actual time=0.008..0.008 rows=5 loops=1)
        Index Cond: (event_id = 1)
Execution Time: 0.076 ms
```
The index `idx_tickets_event_id` is used. (The table is tiny, so PostgreSQL normally prefers a plain scan; this plan was captured with `SET enable_seqscan = off` to show the index. With many thousands of tickets it picks the index by itself.)

## Setup
**1. Start PostgreSQL**
- Docker: `docker compose up -d`
- Or a local PostgreSQL: install it, create a user/password, and put the right `DATABASE_URL` in `server/.env` (e.g. `postgresql://postgres:yourpassword@localhost:5432/ticketing`).

**2. Create tables, views and sample data**
```
cd server
cp .env.example .env      # then edit JWT_SECRET
npm install
npm run db:setup          # creates DB "ticketing" and runs schema.sql, views.sql, seed.sql
```
(or run the three files yourself with `psql -d ticketing -f database/schema.sql` etc., in that order)

**3. Run the API** - `npm start` (http://localhost:4000)

**4. Run the client**
```
cd client
npm install
npm run dev               # http://localhost:5173
```
`npm run build` makes a production build. Vite proxies `/api` to the server.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@demo.com | Admin12345 |
| Customer | budi@demo.com | Password123 |
| Customer | sari@demo.com | Password123 |

## API endpoints
| Method | Path | Access |
|---|---|---|
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| GET | /api/auth/me | login |
| GET | /api/events | public |
| GET | /api/events/:id | public |
| GET | /api/events/:id/seats | public |
| POST | /api/orders | login |
| GET | /api/orders/mine | login |
| GET | /api/orders/:id | login (own orders only) |
| GET | /api/reports/sales | admin |

Errors always look like `{ "error": "message" }`.

## What I learned
- _fill in_
- _fill in_
- _fill in_
