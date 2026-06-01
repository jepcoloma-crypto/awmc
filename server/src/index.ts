import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { query, pool } from './db';
import { authMiddleware, generateToken, AuthRequest, requireRole } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json());

// Helper to get tomorrow's date
function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

// ==================== AUTH ====================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await query('SELECT * FROM users WHERE username = $1 AND status = $2', [username, 'Active']);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid username or password' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' });

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT id, username, first_name, last_name, email, role, doctor_id, status, created_at, last_login FROM users WHERE id = $1', [req.user!.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DASHBOARD ====================

app.get('/api/dashboard/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const userId = req.user!.id;
    const role = req.user!.role;
    const isDoctor = role === 'Medical Practitioner';

    // For doctors, filter by their linked doctor_id
    let doctorFilter = '';
    let doctorParams: any[] = [];
    if (isDoctor) {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [userId]);
      if (userRes.rows[0]?.doctor_id) {
        doctorFilter = 'AND doctor_id = $1';
        doctorParams = [userRes.rows[0].doctor_id];
      }
    }

    const todayApps = await query(
      `SELECT a.*, 
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.appointment_date = $1 ${isDoctor ? doctorFilter.replace('$1', '$2') : ''}
       ORDER BY a.appointment_time`,
      isDoctor ? [today, doctorParams[0]] : [today]
    );

    const activePatients = await query('SELECT COUNT(*) FROM patients WHERE status = $1', ['Active']);

    const invoices = await query('SELECT COALESCE(SUM(total),0) as total_invoiced, COALESCE(SUM(paid_amount),0) as total_collected, COALESCE(SUM(balance),0) as total_outstanding FROM invoices');

    // Monthly revenue (last 6 months)
    const monthlyRevenue = await query(`
      SELECT TO_CHAR(date_trunc('month', payment_date), 'Mon') as month,
             COALESCE(SUM(amount),0) as revenue
      FROM payments
      WHERE payment_date >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', payment_date)
      ORDER BY date_trunc('month', payment_date)
    `);

    // Patient registrations (last 6 months)
    const registrations = await query(`
      SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') as month,
             COUNT(*) as count
      FROM patients
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    `);

    // Appointment status breakdown
    const statusBreakdown = await query(`
      SELECT status, COUNT(*) as count
      FROM appointments
      GROUP BY status
    `);

    // Outstanding balances
    const outstanding = await query(`
      SELECT i.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.status IN ('Unpaid', 'Partial', 'Overdue')
      ${isDoctor ? 'AND i.doctor_id = $1' : ''}
      ORDER BY i.balance DESC
      LIMIT 10
    `, isDoctor ? doctorParams : []);

    const todayCompleted = todayApps.rows.filter((a: any) => a.status === 'Completed').length;
    const todayCancelled = todayApps.rows.filter((a: any) => a.status === 'Cancelled').length;

    res.json({
      total_appointments_today: todayApps.rows.length,
      completed_appointments: todayCompleted,
      cancelled_appointments: todayCancelled,
      total_patients: parseInt(activePatients.rows[0].count),
      total_collected_today: 0, // Simplified for now
      total_outstanding: parseFloat(invoices.rows[0].total_outstanding) || 0,
      total_invoiced: parseFloat(invoices.rows[0].total_invoiced) || 0,
      monthly_revenue: monthlyRevenue.rows.map((r: any) => ({ month: r.month, revenue: parseFloat(r.revenue) })),
      patient_registrations: registrations.rows.map((r: any) => ({ month: r.month, count: parseInt(r.count) })),
      appointment_status_breakdown: statusBreakdown.rows.map((r: any) => ({ status: r.status, count: parseInt(r.count) })),
      today_schedule: todayApps.rows,
      outstanding_balances: outstanding.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PATIENTS ====================

app.get('/api/patients', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { search, doctor_id } = req.query;
    let sql = 'SELECT * FROM patients WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (search) {
      sql += ` AND (LOWER(first_name) LIKE LOWER($${idx}) OR LOWER(last_name) LIKE LOWER($${idx}) OR LOWER(patient_id) LIKE LOWER($${idx}) OR phone LIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (doctor_id) {
      sql += ` AND doctor_id = $${idx}`;
      params.push(Number(doctor_id));
      idx++;
    }
    // Medical Practitioners see only their patients
    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` AND doctor_id = $${idx}`;
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY created_at DESC';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await query('SELECT * FROM patients WHERE id = $1', [req.params.id]);
    if (patient.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const procedures = await query(
      'SELECT pp.*, pt.name as procedure_name FROM patient_procedures pp LEFT JOIN procedure_types pt ON pp.procedure_type_id = pt.id WHERE pp.patient_id = $1 ORDER BY pp.procedure_date DESC',
      [req.params.id]
    );
    res.json({ ...patient.rows[0], procedures: procedures.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/patients', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, medical_history, allergies, emergency_contact_name, emergency_contact_phone } = req.body;
    const patientId = `PT-${Date.now().toString(36).toUpperCase()}`;
    const result = await query(
      `INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, medical_history, allergies, emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [patientId, first_name, last_name, date_of_birth, gender, phone, email || null, address || null, blood_type || null, medical_history || null, allergies || null, emergency_contact_name || null, emergency_contact_phone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, medical_history, allergies, emergency_contact_name, emergency_contact_phone, status } = req.body;
    const result = await query(
      `UPDATE patients SET first_name=$1, last_name=$2, date_of_birth=$3, gender=$4, phone=$5, email=$6, address=$7, blood_type=$8, medical_history=$9, allergies=$10, emergency_contact_name=$11, emergency_contact_phone=$12, status=$13, updated_at=NOW() WHERE id=$14 RETURNING *`,
      [first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, medical_history, allergies, emergency_contact_name, emergency_contact_phone, status || 'Active', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/patients/:id', authMiddleware, async (req, res) => {
  try {
    await query("UPDATE patients SET status='Inactive', updated_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== APPOINTMENTS ====================

app.get('/api/appointments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { start, end } = req.query;
    let sql = `
      SELECT a.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (start) { sql += ` AND a.appointment_date >= $${idx}`; params.push(start); idx++; }
    if (end) { sql += ` AND a.appointment_date <= $${idx}`; params.push(end); idx++; }

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` AND a.doctor_id = $${idx}`;
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY a.appointment_date, a.appointment_time';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes } = req.body;
    const result = await query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, end_time, status || 'Scheduled', reason, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', authMiddleware, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes } = req.body;
    const result = await query(
      `UPDATE appointments SET patient_id=$1, doctor_id=$2, appointment_date=$3, appointment_time=$4, end_time=$5, status=$6, reason=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== DOCTORS ====================

app.get('/api/doctors', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM doctors ORDER BY first_name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/doctors', authMiddleware, async (req, res) => {
  try {
    const { first_name, last_name, specialization, phone, email } = req.body;
    const result = await query(
      'INSERT INTO doctors (first_name, last_name, specialization, phone, email) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [first_name, last_name, specialization, phone, email || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/doctors/:id', authMiddleware, async (req, res) => {
  try {
    const { status, first_name, last_name, specialization, phone, email } = req.body;
    const result = await query(
      'UPDATE doctors SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name), specialization=COALESCE($3,specialization), phone=COALESCE($4,phone), email=COALESCE($5,email), status=COALESCE($6,status) WHERE id=$7 RETURNING *',
      [first_name, last_name, specialization, phone, email, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== BILLING / INVOICES ====================

app.get('/api/billing', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let sql = `
      SELECT i.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` AND i.doctor_id = $${idx}`;
        params.push(userRes.rows[0].doctor_id);
        idx++;
      }
    }

    sql += ' ORDER BY i.created_at DESC';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billing/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await query(
      'SELECT i.*, CONCAT(p.first_name, \' \', p.last_name) as patient_name FROM invoices i JOIN patients p ON i.patient_id = p.id WHERE i.id = $1',
      [req.params.id]
    );
    if (invoice.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const items = await query('SELECT ii.*, s.name as service_name FROM invoice_items ii LEFT JOIN services s ON ii.service_id = s.id WHERE ii.invoice_id = $1', [req.params.id]);
    const payments = await query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date', [req.params.id]);
    res.json({ ...invoice.rows[0], items: items.rows, payments: payments.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { patient_id, due_date, notes, items, subtotal, tax, total } = req.body;
    const invNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const doctorId = req.user!.role === 'Medical Practitioner'
      ? (await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id])).rows[0]?.doctor_id
      : req.body.doctor_id || null;

    const invoice = await query(
      `INSERT INTO invoices (invoice_number, patient_id, doctor_id, due_date, subtotal, tax, total, paid_amount, balance, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$7,'Unpaid',$8) RETURNING *`,
      [invNumber, patient_id, doctorId, due_date || tomorrow(), subtotal || 0, tax || 0, total || 0, notes || '']
    );

    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          'INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6)',
          [invoice.rows[0].id, item.service_id || null, item.description, item.quantity, item.unit_price, item.total]
        );
      }
    }

    res.status(201).json(invoice.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billing/:id/payment', authMiddleware, async (req, res) => {
  try {
    const { amount, payment_method, reference_number } = req.body;
    const invoice = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (invoice.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const payment = await query(
      'INSERT INTO payments (invoice_id, amount, payment_method, reference_number) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, amount, payment_method, reference_number || '']
    );

    const newPaid = parseFloat(invoice.rows[0].paid_amount) + parseFloat(amount);
    const newBalance = parseFloat(invoice.rows[0].total) - newPaid;
    let newStatus = 'Partial';
    if (newBalance <= 0) newStatus = 'Paid';

    await query('UPDATE invoices SET paid_amount=$1, balance=$2, status=$3 WHERE id=$4',
      [newPaid, Math.max(0, newBalance), newStatus, req.params.id]);

    res.status(201).json(payment.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SERVICES ====================

app.get('/api/services', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM services ORDER BY name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { name, description, price, category, status } = req.body;
    const result = await query(
      'INSERT INTO services (name, description, price, category, status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, description || '', price || 0, category || '', status || 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { name, description, price, category, status } = req.body;
    const result = await query(
      'UPDATE services SET name=$1, description=$2, price=$3, category=$4, status=$5 WHERE id=$6 RETURNING *',
      [name, description || '', price || 0, category || '', status || 'Active', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    await query('DELETE FROM services WHERE id=$1', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PROCEDURE TYPES ====================

app.get('/api/procedure-types', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM procedure_types ORDER BY name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/procedure-types', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const result = await query(
      'INSERT INTO procedure_types (name, description, price) VALUES ($1,$2,$3) RETURNING *',
      [name, description || '', price || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/procedure-types/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const result = await query(
      'UPDATE procedure_types SET name=$1, description=$2, price=$3 WHERE id=$4 RETURNING *',
      [name, description || '', price || 0, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Procedure type not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/procedure-types/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    await query('DELETE FROM procedure_types WHERE id=$1', [req.params.id]);
    res.json({ message: 'Procedure type deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USERS ====================

app.get('/api/users', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const result = await query('SELECT id, username, first_name, last_name, email, role, doctor_id, status, created_at, last_login FROM users ORDER BY created_at DESC');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { username, password_hash, first_name, last_name, email, role, doctor_id } = req.body;
    const pwHash = await bcrypt.hash(password_hash, 10);
    const result = await query(
      `INSERT INTO users (username, password_hash, first_name, last_name, email, role, doctor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, username, first_name, last_name, email, role, doctor_id, status, created_at`,
      [username, pwHash, first_name, last_name, email, role, doctor_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { first_name, last_name, email, role, status, doctor_id } = req.body;
    const result = await query(
      'UPDATE users SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name), email=COALESCE($3,email), role=COALESCE($4,role), status=COALESCE($5,status), doctor_id=$6, updated_at=NOW() WHERE id=$7 RETURNING id, username, first_name, last_name, email, role, doctor_id, status',
      [first_name, last_name, email, role, status, doctor_id ?? null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== REPORTS ====================

app.get('/api/reports/appointments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to } = req.query;
    let sql = `
      SELECT a.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date >= $1 AND a.appointment_date <= $2`;
    const params: any[] = [from, to];

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ' AND a.doctor_id = $3';
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY a.appointment_date, a.appointment_time';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/financial', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to } = req.query;
    let sql = 'SELECT * FROM payments WHERE payment_date >= $1 AND payment_date <= $2';
    const params: any[] = [from, to];

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ' AND invoice_id IN (SELECT id FROM invoices WHERE doctor_id = $3)';
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY payment_date';
    const result = await query(sql, params);
    const totalCollected = result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
    res.json({ data: result.rows, total_collected: totalCollected, total_count: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SETTINGS ====================

app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM settings');
    const map: Record<string, string> = {};
    result.rows.forEach((r: any) => { map[r.key] = r.value; });
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const entries = req.body;
    for (const [key, value] of Object.entries(entries)) {
      await query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
        [key, value]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== REMINDERS ====================

app.get('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const result = await query('SELECT * FROM reminders ORDER BY created_at DESC');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders', authMiddleware, async (req, res) => {
  try {
    const { patient_id, type, message } = req.body;
    const result = await query(
      'INSERT INTO reminders (patient_id, type, message, status, sent_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
      [patient_id, type, message, 'Sent']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== PATIENT PROCEDURES ====================

app.post('/api/patients/:id/procedures', authMiddleware, async (req, res) => {
  try {
    const { procedure_type_id, procedure_date, notes, fee, doctor_id } = req.body;
    const result = await query(
      'INSERT INTO patient_procedures (patient_id, procedure_type_id, doctor_id, procedure_date, notes, fee) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.params.id, procedure_type_id, doctor_id || null, procedure_date, notes || '', fee || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`Alyssa Wellness & Medical Clinic Server running on http://localhost:${PORT}`);
});
