// Connection pool: reuses a few open DB connections instead of opening one per request.
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export default pool;
