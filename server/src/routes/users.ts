import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, requireRole('Administrator'), async (_req, res) => {
  try {
    const result = await query(
      'SELECT id, username, first_name, last_name, email, role, doctor_id, status, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { username, password_hash, first_name, last_name, email, role, doctor_id } = req.body;
    const pwHash = await bcrypt.hash(password_hash, 10);
    const result = await query(
      `INSERT INTO users (username, password_hash, first_name, last_name, email, role, doctor_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING id, username, first_name, last_name, email, role, doctor_id, status, created_at`,
      [username, pwHash, first_name, last_name, email, role, doctor_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { first_name, last_name, email, role, status, doctor_id } = req.body;
    const result = await query(
      `UPDATE users SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name),
       email=COALESCE($3,email), role=COALESCE($4,role), status=COALESCE($5,status),
       doctor_id=$6, updated_at=NOW() WHERE id=$7
       RETURNING id, username, first_name, last_name, email, role, doctor_id, status`,
      [first_name, last_name, email, role, status, doctor_id ?? null, req.params.id]
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

export default router;
