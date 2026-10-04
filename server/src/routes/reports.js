import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/reports/sales (admin only) - reads the event_sales_report view
router.get('/sales', requireAdmin, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM event_sales_report ORDER BY starts_at');
    res.json(
      rows.map((r) => ({
        eventId: r.event_id,
        title: r.title,
        startsAt: r.starts_at,
        ordersCount: Number(r.orders_count),
        ticketsSold: Number(r.tickets_sold),
        totalRevenue: Number(r.total_revenue),
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
