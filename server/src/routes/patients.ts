import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth';
import { sendSMS, sendEmail } from '../services/notification';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { search, doctor_id } = req.query;
    let sql = `SELECT p.*,
      COALESCE(
        (SELECT json_agg(json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name))
         FROM patient_doctors pd JOIN doctors d ON d.id = pd.doctor_id
         WHERE pd.patient_id = p.id),
        '[]'::json
      ) as doctors
      FROM patients p WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (search) {
      sql += ` AND (LOWER(p.first_name) LIKE LOWER($${idx}) OR LOWER(p.last_name) LIKE LOWER($${idx}) OR LOWER(p.patient_id) LIKE LOWER($${idx}) OR p.phone LIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (doctor_id) {
      sql += ` AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = p.id AND pd.doctor_id = $${idx})`;
      params.push(Number(doctor_id));
      idx++;
    }

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = p.id AND pd.doctor_id = $${idx})`;
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY p.created_at DESC';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const patient = await query(
      `SELECT p.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name))
           FROM patient_doctors pd JOIN doctors d ON d.id = pd.doctor_id
           WHERE pd.patient_id = p.id),
          '[]'::json
        ) as doctors
       FROM patients p WHERE p.id = $1`,
      [req.params.id]
    );
    if (patient.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const procedures = await query(
      `SELECT pp.*, pt.name as procedure_name
       FROM patient_procedures pp
       LEFT JOIN procedure_types pt ON pp.procedure_type_id = pt.id
       WHERE pp.patient_id = $1
       ORDER BY pp.procedure_date DESC`,
      [req.params.id]
    );
    const appointments = await query(
      `SELECT a.*,
        CONCAT(d.first_name, ' ', d.last_name) as doctor_name
       FROM appointments a
       LEFT JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = $1
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [req.params.id]
    );
    res.json({ ...patient.rows[0], procedures: procedures.rows, appointments: appointments.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const {
      first_name, last_name, date_of_birth, gender, phone,
      email, address, blood_type, medical_history, allergies,
      emergency_contact_name, emergency_contact_phone,
    } = req.body;
    const patientId = `PT-${Date.now().toString(36).toUpperCase()}`;

    const result = await query(
      `INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, gender, phone, email, address, blood_type, medical_history, allergies, emergency_contact_name, emergency_contact_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [patientId, first_name, last_name, date_of_birth, gender, phone, email || null, address || null, blood_type || null, medical_history || null, allergies || null, emergency_contact_name || null, emergency_contact_phone || null]
    );
    const patient = result.rows[0];

    const doctorIds: number[] = req.body.doctor_ids || [];
    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      const loggedInDoctorId = userRes.rows[0]?.doctor_id;
      if (loggedInDoctorId && !doctorIds.includes(loggedInDoctorId)) {
        doctorIds.push(loggedInDoctorId);
      }
    }
    for (const did of doctorIds) {
      await query('INSERT INTO patient_doctors (patient_id, doctor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [patient.id, did]);
    }

    const doctors = await query(
      `SELECT json_agg(json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name))
       FROM patient_doctors pd JOIN doctors d ON d.id = pd.doctor_id WHERE pd.patient_id = $1`,
      [patient.id]
    );

    const patientName = `${first_name} ${last_name}`;
    const smsMsg = `Welcome to Alyssa Wellness Clinic, ${patientName}! Your patient ID is ${patientId}. We look forward to serving you.`;
    const emailMsg = `Dear ${patientName},\n\nWelcome to Alyssa Wellness Clinic!\n\nYour patient ID: ${patientId}\nRegistered on: ${new Date().toLocaleDateString()}\n\nThank you for choosing us.\n\nBest regards,\nAlyssa Wellness Clinic`;

    if (phone) sendSMS(phone, smsMsg);
    if (email) sendEmail(email, 'Welcome to Alyssa Wellness Clinic', emailMsg);

    res.status(201).json({ ...patient, doctors: doctors.rows[0]?.json_agg || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const allowed = ['first_name','last_name','date_of_birth','gender','phone','email','address','blood_type','medical_history','allergies','emergency_contact_name','emergency_contact_phone','status'];
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        sets.push(`${key}=$${idx}`);
        vals.push(req.body[key]);
        idx++;
      }
    }
    if (sets.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }
    sets.push(`updated_at=NOW()`);
    vals.push(req.params.id);
    const result = await query(
      `UPDATE patients SET ${sets.join(', ')} WHERE id=$${idx} RETURNING *`,
      vals
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    if (req.body.doctor_ids !== undefined) {
      await query('DELETE FROM patient_doctors WHERE patient_id = $1', [req.params.id]);
      for (const did of req.body.doctor_ids) {
        await query('INSERT INTO patient_doctors (patient_id, doctor_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.params.id, did]);
      }
    }

    const doctors = await query(
      `SELECT json_agg(json_build_object('id', d.id, 'first_name', d.first_name, 'last_name', d.last_name))
       FROM patient_doctors pd JOIN doctors d ON d.id = pd.doctor_id WHERE pd.patient_id = $1`,
      [req.params.id]
    );
    res.json({ ...result.rows[0], doctors: doctors.rows[0]?.json_agg || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await query("UPDATE patients SET status='Inactive', updated_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/procedures', authMiddleware, async (req, res) => {
  try {
    const procedures = await query(
      `SELECT pp.*, pt.name as procedure_name
       FROM patient_procedures pp
       LEFT JOIN procedure_types pt ON pp.procedure_type_id = pt.id
       WHERE pp.patient_id = $1
       ORDER BY pp.procedure_date DESC`,
      [req.params.id]
    );
    res.json({ data: procedures.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/procedures', authMiddleware, async (req, res) => {
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

router.put('/:id/procedures/:procId', authMiddleware, async (req, res) => {
  try {
    const { procedure_type_id, procedure_date, notes, fee } = req.body;
    const result = await query(
      'UPDATE patient_procedures SET procedure_type_id=$1, procedure_date=$2, notes=$3, fee=$4 WHERE id=$5 AND patient_id=$6 RETURNING *',
      [procedure_type_id, procedure_date || '', notes || '', fee || 0, req.params.procId, req.params.id]
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

router.delete('/:id/procedures/:procId', authMiddleware, async (req, res) => {
  try {
    const result = await query('DELETE FROM patient_procedures WHERE id=$1 AND patient_id=$2 RETURNING id', [req.params.procId, req.params.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
