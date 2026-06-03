import { Pool, types } from 'pg';

// Return DATE (oid 1082) as plain YYYY-MM-DD strings, avoiding JS Date UTC conversion
types.setTypeParser(1082, (s: string) => s);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err);
});

pool.on('connect', (client) => {
  client.query("SET TIMEZONE TO 'Asia/Manila'").catch((err) => {
    console.error('Failed to set timezone:', err);
  });
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}
