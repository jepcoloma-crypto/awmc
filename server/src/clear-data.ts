import 'dotenv/config';
import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL;

async function clearData() {
  const client = new Client({ connectionString });
  await client.connect();
  console.log('Connected.\n');

  const tables = [
    'invoice_items',
    'payments',
    'invoices',
    'patient_procedures',
    'appointments',
    'reminders',
    'patients',
    'doctors',
    'settings',
    'services',
    'procedure_types',
  ];

  for (const table of tables) {
    try {
      await client.query(`DELETE FROM ${table}`);
      console.log(`✓ Cleared ${table}`);
    } catch (err: any) {
      console.error(`✗ Failed to clear ${table}: ${err.message}`);
    }
  }

  await client.end();
  console.log('\n✓ All demo data cleared. Kept table: users only.');
}

clearData().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
