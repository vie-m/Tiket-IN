// The booking transaction. This is the heart of the project.
import pool from '../db/pool.js';

// Small helper error carrying an HTTP status, so the route can reply correctly.
export class BookingError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export async function createBooking(userId, eventId, seatIds) {
  // ---- validation (before touching the DB) ----
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw new BookingError(400, 'eventId must be a positive integer');
  }
  if (!Array.isArray(seatIds) || seatIds.length < 1 || seatIds.length > 6) {
    throw new BookingError(400, 'Choose between 1 and 6 seats');
  }
  if (!seatIds.every((id) => Number.isInteger(id) && id > 0)) {
    throw new BookingError(400, 'seatIds must be positive integers');
  }
  if (new Set(seatIds).size !== seatIds.length) {
    throw new BookingError(400, 'Duplicate seats are not allowed');
  }

  // One client = one connection. A transaction must stay on ONE connection.
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // everything below succeeds together or not at all

    // STEP 1: event must exist and not have started yet
    const ev = await client.query('SELECT id, venue_id, starts_at FROM events WHERE id = $1', [eventId]);
    if (ev.rows.length === 0) throw new BookingError(404, 'Event not found');
    if (new Date(ev.rows[0].starts_at) <= new Date()) {
      throw new BookingError(400, 'This event has already started');
    }
    const venueId = ev.rows[0].venue_id;

    // STEP 2: lock the seat rows. FOR UPDATE makes other transactions that try to
    // lock the same rows WAIT until we COMMIT/ROLLBACK. ORDER BY id = every
    // transaction locks in the same order, which prevents deadlocks.
    const seats = await client.query(
      'SELECT id, venue_id, section, row_label, seat_number FROM seats WHERE id = ANY($1) ORDER BY id FOR UPDATE',
      [seatIds]
    );
    if (seats.rows.length !== seatIds.length) {
      throw new BookingError(400, 'One or more seats do not exist');
    }

    // STEP 3: all seats must belong to this event's venue
    if (seats.rows.some((s) => s.venue_id !== venueId)) {
      throw new BookingError(400, 'Some seats do not belong to this event\'s venue');
    }

    // STEP 4: any of them already sold for this event? (we hold the lock, so this check is reliable)
    const taken = await client.query(
      'SELECT seat_id FROM tickets WHERE event_id = $1 AND seat_id = ANY($2)',
      [eventId, seatIds]
    );
    if (taken.rows.length > 0) {
      const takenIds = new Set(taken.rows.map((t) => t.seat_id));
      const takenSeats = seats.rows
        .filter((s) => takenIds.has(s.id))
        .map((s) => ({ id: s.id, label: `${s.row_label}${s.seat_number}` }));
      throw new BookingError(409, 'Some seats are already taken', { takenSeats });
    }

    // STEP 5: price of each seat comes from the DB (never trust prices from the browser)
    const prices = await client.query(
      'SELECT section, price FROM event_prices WHERE event_id = $1',
      [eventId]
    );
    const priceBySection = Object.fromEntries(prices.rows.map((p) => [p.section, Number(p.price)]));
    const lines = seats.rows.map((s) => ({ seat: s, price: priceBySection[s.section] }));
    if (lines.some((l) => l.price === undefined)) {
      throw new BookingError(400, 'No price defined for a seat section');
    }
    const total = lines.reduce((sum, l) => sum + l.price, 0);

    // STEP 6: create the order for the logged-in user, then one ticket per seat
    const order = await client.query(
      `INSERT INTO orders (user_id, event_id, total_amount)
       VALUES ($1, $2, $3) RETURNING id, user_id, event_id, total_amount, status, created_at`,
      [userId, eventId, total]
    );
    const orderId = order.rows[0].id;

    const tickets = [];
    for (const l of lines) {
      const t = await client.query(
        `INSERT INTO tickets (order_id, event_id, seat_id, price)
         VALUES ($1, $2, $3, $4) RETURNING id, seat_id, price`,
        [orderId, eventId, l.seat.id, l.price]
      );
      tickets.push({
        id: t.rows[0].id,
        seatId: l.seat.id,
        seat: `${l.seat.row_label}${l.seat.seat_number}`,
        section: l.seat.section,
        price: Number(t.rows[0].price),
      });
    }

    // STEP 7: make it permanent
    await client.query('COMMIT');

    const o = order.rows[0];
    return {
      id: o.id,
      eventId: o.event_id,
      totalAmount: Number(o.total_amount),
      status: o.status,
      createdAt: o.created_at,
      tickets,
    };
  } catch (err) {
    await client.query('ROLLBACK'); // undo everything (also releases the locks)

    // SAFETY NET: UNIQUE (event_id, seat_id) on tickets rejected a duplicate sale.
    if (err.code === '23505') {
      throw new BookingError(409, 'Some seats are already taken', { takenSeats: [] });
    }
    throw err;
  } finally {
    client.release(); // always give the connection back to the pool
  }
}
