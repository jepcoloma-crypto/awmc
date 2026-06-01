import { Client } from 'pg';

const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres.cwaztykcwvrkltgysvhl:CYNaIA2fYrddxg55@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres';

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
  console.log('\n✓ All data cleared. Kept tables: users, services, procedure_types.');
}

clearData().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
