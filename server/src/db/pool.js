// Connection pool: reuses a few open DB connections instead of opening one per request.
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,                    // serverless: each instance keeps only a few connections
  idleTimeoutMillis: 10000,  // close idle connections quickly so Neon is not overloaded
});

export default pool;
