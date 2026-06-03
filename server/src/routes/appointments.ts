import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { sendSMS, sendEmail } from '../services/notification';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
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

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes } = req.body;
    const result = await query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, end_time, status || 'Scheduled', reason, notes || '']
    );

    const contact = await query(
      `SELECT p.phone, p.email, p.first_name || ' ' || p.last_name as patient_name,
        d.first_name || ' ' || d.last_name as doctor_name
       FROM patients p
       CROSS JOIN doctors d ON d.id = $2
       WHERE p.id = $1`,
      [patient_id, doctor_id]
    );

    if (contact.rows.length > 0) {
      const { phone, email, patient_name, doctor_name } = contact.rows[0];
      const dateStr = new Date(appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const smsMsg = `Reminder: You have an appointment at Alyssa Wellness Clinic on ${dateStr} at ${appointment_time?.slice(0, 5)} with Dr. ${doctor_name}. Please arrive on time.`;
      const emailMsg = `Dear ${patient_name},\n\nThis is a confirmation of your appointment at Alyssa Wellness Clinic.\n\nDate: ${dateStr}\nTime: ${appointment_time?.slice(0, 5)} - ${end_time?.slice(0, 5)}\nDoctor: Dr. ${doctor_name}\nReason: ${reason || 'N/A'}\n\nThank you for choosing us.\n\nBest regards,\nAlyssa Wellness Clinic`;

      if (phone) sendSMS(phone, smsMsg);
      if (email) sendEmail(email, 'Appointment Confirmation - Alyssa Wellness Clinic', emailMsg);
    }

    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes } = req.body;
    const result = await query(
      `UPDATE appointments SET patient_id=$1, doctor_id=$2, appointment_date=$3, appointment_time=$4, end_time=$5, status=$6, reason=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [patient_id, doctor_id, appointment_date, appointment_time, end_time, status, reason, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await query('DELETE FROM appointments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
