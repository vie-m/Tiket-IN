// Creates the database (if missing) and runs schema.sql, views.sql, seed.sql in order.
// Usage: npm run db:setup
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = path.dirname(fileURLToPath(import.meta.url));
const sqlDir = path.resolve(here, '../../database');

const url = new URL(process.env.DATABASE_URL);
const dbName = url.pathname.slice(1);

// Hosted databases (Neon etc.) already exist and cannot be created this way.
const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);

// 1) Local only: connect to the default "postgres" database and create ours if needed
if (isLocal) {
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${dbName}"`); // identifiers cannot be parameterized
    console.log(`Created database ${dbName}`);
  }
  await admin.end();
}

// 2) Run the three SQL files
console.log(`Connecting to ${url.hostname} / ${dbName} ...`);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
for (const file of ['schema.sql', 'views.sql', 'seed.sql']) {
  const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
  await client.query(sql);
  console.log(`Ran ${file}`);
}
await client.end();
console.log('Database ready.');
