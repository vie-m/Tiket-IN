import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body || {};

    // --- validation ---
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Always store emails in lowercase so "A@x.com" and "a@x.com" are the same account.
    const cleanEmail = String(email).trim().toLowerCase();

    // bcrypt adds a random salt and is deliberately slow (cost 10 = 2^10 rounds),
    // which makes stolen hashes hard to brute-force.
    const passwordHash = await bcrypt.hash(String(password), 10);

    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [String(fullName).trim(), cleanEmail, passwordHash]
    );

    // Never return password_hash. User is NOT logged in automatically.
    const u = rows[0];
    res.status(201).json({ id: u.id, fullName: u.full_name, email: u.email });
  } catch (err) {
    // 23505 = unique_violation: the UNIQUE constraint on users.email caught a duplicate.
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email is already registered' });
    }
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();

    const { rows } = await pool.query(
      'SELECT id, full_name, email, password_hash, role FROM users WHERE email = $1',
      [cleanEmail]
    );
    const user = rows[0];

    // Same message whether the email or the password is wrong,
    // so attackers cannot discover which emails are registered.
    const ok = user && (await bcrypt.compare(String(password || ''), user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // JWT = signed token holding the user id + role. Expires in 1 day.
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({
      token,
      user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, full_name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'User no longer exists' });
    const u = rows[0];
    res.json({ id: u.id, fullName: u.full_name, email: u.email, role: u.role });
  } catch (err) {
    next(err);
  }
});

export default router;
