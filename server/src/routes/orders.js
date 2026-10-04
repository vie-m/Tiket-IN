import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { createBooking, BookingError } from '../services/bookingService.js';

const router = Router();
router.use(requireAuth); // every order route needs login

// Loads orders (with event, venue and tickets) for the given WHERE clause.
async function loadOrders(whereSql, params) {
  const { rows } = await pool.query(
    `SELECT o.id, o.total_amount, o.status, o.created_at,
            e.id AS event_id, e.title, e.starts_at,
            v.name AS venue_name, v.city,
            t.id AS ticket_id, t.price AS ticket_price,
            s.id AS seat_id, s.section, s.row_label, s.seat_number
     FROM orders o
     JOIN events e  ON e.id = o.event_id
     JOIN venues v  ON v.id = e.venue_id
     JOIN tickets t ON t.order_id = o.id
     JOIN seats s   ON s.id = t.seat_id
     WHERE ${whereSql}
     ORDER BY o.created_at DESC, o.id DESC, s.row_label, s.seat_number`,
    params
  );
  // Group flat rows into orders with a tickets array
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) {
      map.set(r.id, {
        id: r.id,
        totalAmount: Number(r.total_amount),
        status: r.status,
        createdAt: r.created_at,
        event: { id: r.event_id, title: r.title, startsAt: r.starts_at },
        venue: { name: r.venue_name, city: r.city },
        tickets: [],
      });
    }
    map.get(r.id).tickets.push({
      id: r.ticket_id,
      seatId: r.seat_id,
      seat: `${r.row_label}${r.seat_number}`,
      section: r.section,
      price: Number(r.ticket_price),
    });
  }
  return [...map.values()];
}

// POST /api/orders  body: { eventId, seatIds }
router.post('/', async (req, res, next) => {
  try {
    const { eventId, seatIds } = req.body || {};
    // user id comes from the JWT (req.user), never from the body
    const order = await createBooking(req.user.id, eventId, seatIds);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof BookingError) {
      return res.status(err.status).json({ error: err.message, ...err.extra });
    }
    next(err);
  }
});

// GET /api/orders/mine
router.get('/mine', async (req, res, next) => {
  try {
    res.json(await loadOrders('o.user_id = $1', [req.user.id]));
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id  (only your own; someone else's order looks like "not found")
router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(404).json({ error: 'Order not found' });
    const orders = await loadOrders('o.id = $1 AND o.user_id = $2', [id, req.user.id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(orders[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
