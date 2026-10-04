// Resets ONLY bookings: deletes all orders + tickets, then re-adds the demo orders.
// Users (accounts), events, venues and seats are NOT touched.
// Usage: npm run db:reset-bookings
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const sampleSql = fs.readFileSync(path.resolve(here, '../../database/sample_orders.sql'), 'utf8');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN'); // all-or-nothing: a failure leaves the data as it was
  const before = await client.query(
    'SELECT (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM tickets) AS tickets, (SELECT COUNT(*) FROM users) AS users'
  );
  // TRUNCATE empties both tables; RESTART IDENTITY makes ids start from 1 again.
  await client.query('TRUNCATE tickets, orders RESTART IDENTITY');
  await client.query(sampleSql);
  const after = await client.query(
    'SELECT (SELECT COUNT(*) FROM orders) AS orders, (SELECT COUNT(*) FROM tickets) AS tickets, (SELECT COUNT(*) FROM users) AS users'
  );
  await client.query('COMMIT');
  console.log('Before:', before.rows[0]);
  console.log('After :', after.rows[0]);
  console.log('Bookings reset. Users were kept.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Reset failed, nothing changed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
