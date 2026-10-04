// Express app: middleware + routes + error handling.
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import orderRoutes from './routes/orders.js';
import reportRoutes from './routes/reports.js';

const app = express();

// CLIENT_URL = allowed website origin(s), comma separated. Not set = allow any (local dev).
const allowed = (process.env.CLIENT_URL || '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors(allowed.length ? { origin: allowed } : undefined));
app.use(express.json());   // parse JSON request bodies

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

// Unknown route -> consistent JSON error
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Basic error handler: any thrown error ends up here. Never leak details to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
