import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let sql = `
      SELECT c.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name,
        CONCAT(u.first_name, ' ', u.last_name) as issued_by_name
      FROM medical_certificates c
      JOIN patients p ON c.patient_id = p.id
      JOIN doctors d ON c.doctor_id = d.id
      LEFT JOIN users u ON c.issued_by = u.id`;
    const params: any[] = [];
    let idx = 1;

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` WHERE c.doctor_id = $${idx}`;
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY c.issued_at DESC';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT c.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        p.gender, p.date_of_birth, p.phone, p.address,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name,
        d.specialization,
        CONCAT(u.first_name, ' ', u.last_name) as issued_by_name
      FROM medical_certificates c
      JOIN patients p ON c.patient_id = p.id
      JOIN doctors d ON c.doctor_id = d.id
      LEFT JOIN users u ON c.issued_by = u.id
      WHERE c.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { patient_id, doctor_id, appointment_id, diagnosis, rest_from, rest_to, restrictions, notes } = req.body;
    const result = await query(
      `INSERT INTO medical_certificates (patient_id, doctor_id, appointment_id, diagnosis, rest_from, rest_to, restrictions, notes, issued_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [patient_id, doctor_id, appointment_id || null, diagnosis, rest_from || null, rest_to || null, restrictions || null, notes || null, req.user!.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await query('DELETE FROM medical_certificates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Certificate deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
