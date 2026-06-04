import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { sendSMS, sendEmail } from '../services/notification';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM reminders ORDER BY created_at DESC');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patient_id, type, message } = req.body;
    const result = await query(
      'INSERT INTO reminders (patient_id, type, message, status, sent_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
      [patient_id, type, message, 'Sent']
    );

    const patient = await query('SELECT phone, email, first_name, last_name FROM patients WHERE id = $1', [patient_id]);

    if (type === 'SMS' && patient.rows[0]?.phone) {
      sendSMS(patient.rows[0].phone, message);
    } else if (type === 'Email' && patient.rows[0]?.email) {
      sendEmail(patient.rows[0].email, 'Reminder - Alyssa Wellness Clinic', message);
    }

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/today-scheduled', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let sql = `
      SELECT a.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date = $1
        AND a.status IN ('Scheduled', 'Confirmed')
      ORDER BY a.appointment_time`;
    const params: any[] = [today];
    let idx = 2;

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` AND a.doctor_id = $${idx}`;
        params.push(userRes.rows[0].doctor_id);
      }
    }

    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/outstanding-patients', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let sql = `
      SELECT DISTINCT p.id, p.first_name, p.last_name, p.phone, i.balance
      FROM patients p
      JOIN invoices i ON i.patient_id = p.id
      WHERE i.balance > 0
      ORDER BY i.balance DESC`;
    const params: any[] = [];
    let idx = 1;

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql = `
          SELECT DISTINCT p.id, p.first_name, p.last_name, p.phone, i.balance
          FROM patients p
          JOIN invoices i ON i.patient_id = p.id
          WHERE i.balance > 0
            AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = p.id AND pd.doctor_id = $${idx})
          ORDER BY i.balance DESC`;
        params.push(userRes.rows[0].doctor_id);
      }
    }

    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
