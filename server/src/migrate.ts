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
    { username: 'doctor2', first_name: 'Carlos', last_name: 'Lopez', email: 'carlos.lopez@clinic.com', role: 'Medical Practitioner' },
    { username: 'doctor3', first_name: 'Elena', last_name: 'Cruz', email: 'elena.cruz@clinic.com', role: 'Medical Practitioner' },
    { username: 'doctor4', first_name: 'Roberto', last_name: 'Tan', email: 'roberto.tan@clinic.com', role: 'Medical Practitioner' },
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

  // Link medical practitioner users to their doctor records by name
  const doctorUsers = [
    { username: 'doctor1', first_name: 'Maria', last_name: 'Santos' },
    { username: 'doctor2', first_name: 'Carlos', last_name: 'Lopez' },
    { username: 'doctor3', first_name: 'Elena', last_name: 'Cruz' },
    { username: 'doctor4', first_name: 'Roberto', last_name: 'Tan' },
  ];
  for (const du of doctorUsers) {
    try {
      const docRes = await client.query(
        `SELECT id FROM doctors WHERE first_name ILIKE $1 AND last_name ILIKE $2 LIMIT 1`,
        [du.first_name, du.last_name]
      );
      if (docRes.rows.length > 0) {
        const doctorId = docRes.rows[0].id;
        await client.query(
          `UPDATE users SET doctor_id = $1 WHERE username = $2 AND (doctor_id IS NULL OR doctor_id <> $1)`,
          [doctorId, du.username]
        );
        console.log(`✓ Linked user '${du.username}' → doctor id=${doctorId} (${du.first_name} ${du.last_name})`);
      } else {
        console.log(`⚠ No doctor record found for ${du.first_name} ${du.last_name}, skipping link`);
      }
    } catch (err: any) {
      console.error(`✗ Failed to link user '${du.username}': ${err.message}`);
    }
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

  // Make doctor_id nullable in appointments
  try {
    await client.query(`
      ALTER TABLE appointments ALTER COLUMN doctor_id DROP NOT NULL
    `);
    console.log('✓ Made doctor_id nullable in appointments');
  } catch (err: any) {
    if (!err.message.includes('does not exist')) console.error(`✗ ${err.message}`);
  }

  // Ensure medical_certificates table exists (schema is in migrate.sql)
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS medical_certificates (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        diagnosis TEXT NOT NULL,
        rest_from DATE,
        rest_to DATE,
        restrictions TEXT,
        notes TEXT,
        issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✓ Medical certificates table ready');
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
