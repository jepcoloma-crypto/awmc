import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres.cwaztykcwvrkltgysvhl:CYNaIA2fYrddxg55@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';

export const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
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
