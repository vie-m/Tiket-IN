import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /api/events : upcoming events + venue name + lowest price + seats left
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.title, e.category, e.starts_at, e.image_url,
              v.name AS venue_name, v.city,
              (SELECT MIN(price) FROM event_prices p WHERE p.event_id = e.id) AS lowest_price,
              a.available_seats, a.total_seats
       FROM events e
       JOIN venues v                     ON v.id = e.venue_id
       JOIN event_seat_availability a    ON a.event_id = e.id   -- the view
       WHERE e.starts_at > now()
       ORDER BY e.starts_at`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        startsAt: r.starts_at,
        imageUrl: r.image_url,
        venueName: r.venue_name,
        city: r.city,
        lowestPrice: Number(r.lowest_price),
        availableSeats: Number(r.available_seats),
        totalSeats: Number(r.total_seats),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Helper: id in the URL must be a positive integer
function parseId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// GET /api/events/:id : details + venue + prices
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Event not found' });

    const ev = await pool.query(
      `SELECT e.id, e.title, e.description, e.category, e.starts_at, e.image_url,
              v.id AS venue_id, v.name AS venue_name, v.city, v.address
       FROM events e JOIN venues v ON v.id = e.venue_id
       WHERE e.id = $1`,
      [id]
    );
    if (ev.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const prices = await pool.query(
      'SELECT section, price FROM event_prices WHERE event_id = $1 ORDER BY price DESC',
      [id]
    );
    const e = ev.rows[0];
    res.json({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      startsAt: e.starts_at,
      imageUrl: e.image_url,
      venue: { id: e.venue_id, name: e.venue_name, city: e.city, address: e.address },
      prices: prices.rows.map((p) => ({ section: p.section, price: Number(p.price) })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id/seats : every seat of the venue with price + status
router.get('/:id/seats', async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Event not found' });

    const { rows } = await pool.query(
      `SELECT s.id, s.section, s.row_label, s.seat_number, p.price,
              CASE WHEN t.id IS NULL THEN 'available' ELSE 'sold' END AS status
       FROM events e
       JOIN seats s              ON s.venue_id = e.venue_id
       JOIN event_prices p       ON p.event_id = e.id AND p.section = s.section
       LEFT JOIN tickets t       ON t.event_id = e.id AND t.seat_id = s.id  -- ticket exists = sold
       WHERE e.id = $1
       ORDER BY s.row_label, s.seat_number`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    res.json(
      rows.map((r) => ({
        id: r.id,
        section: r.section,
        rowLabel: r.row_label,
        seatNumber: r.seat_number,
        price: Number(r.price),
        status: r.status,
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
