import 'dotenv/config';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;

async function migrate() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected.\n');

  // Execute schema SQL as batch — works from both src/ (tsx) and dist/ (production)
  let sqlPath = path.join(__dirname, 'migrate.sql');
  if (!fs.existsSync(sqlPath)) sqlPath = path.join(__dirname, '..', 'src', 'migrate.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  try {
    await client.query(sql);
    console.log('✓ Schema and seed data applied');
  } catch (err: any) {
    // Many "already exists" errors are expected on re-runs
    console.log(`Note: ${err.message}`);
    console.log('(Continuing with seed data...)');
  }

  // Create users with proper bcrypt hashes
  const passwordHash = await bcrypt.hash('admin123', 10);
  const users = [
    { username: 'admin', first_name: 'System', last_name: 'Admin', email: 'admin@clinic.com', role: 'Administrator' },
    { username: 'doctor1', first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@clinic.com', role: 'Medical Practitioner' },
    { username: 'receptionist', first_name: 'Juan', last_name: 'Dela Cruz', email: 'juan.delacruz@clinic.com', role: 'Front Desk Staff' },
    { username: 'cashier', first_name: 'Ana', last_name: 'Reyes', email: 'ana.reyes@clinic.com', role: 'Cashier' },
  ];
  for (const u of users) {
    try {
      await client.query(
        `INSERT INTO users (username, password_hash, first_name, last_name, email, role)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (username) DO NOTHING`,
        [u.username, passwordHash, u.first_name, u.last_name, u.email, u.role]
      );
      console.log(`✓ User '${u.username}' created`);
    } catch (err: any) {
      console.error(`✗ Failed to create user '${u.username}': ${err.message}`);
    }
  }

  // Link doctor1 user to doctor record
  try {
    const res = await client.query(`UPDATE users SET doctor_id = 1 WHERE username = 'doctor1'`);
    if (res.rowCount && res.rowCount > 0) console.log('✓ Linked doctor1 user to doctor record');
  } catch (err: any) {
    console.error(`✗ ${err.message}`);
  }

  // Migrate existing doctor_id from patients to patient_doctors
  try {
    await client.query(`
      INSERT INTO patient_doctors (patient_id, doctor_id)
      SELECT id, doctor_id FROM patients WHERE doctor_id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Migrated existing doctor assignments to patient_doctors');
  } catch (err: any) {
    console.error(`✗ ${err.message}`);
  }

  // Add created_by column to payments if not exists
  try {
    await client.query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('✓ Added created_by column to payments');
  } catch (err: any) {
    console.error(`✗ ${err.message}`);
  }

  await client.end();
  console.log('\n✓ Migration complete!');
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
