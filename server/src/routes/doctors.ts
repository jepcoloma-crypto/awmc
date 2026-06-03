import { Router } from 'express';
import { query } from '../db';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM doctors ORDER BY first_name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
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

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, first_name, last_name, specialization, phone, email } = req.body;
    const result = await query(
      'UPDATE doctors SET first_name=COALESCE($1,first_name), last_name=COALESCE($2,last_name), specialization=COALESCE($3,specialization), phone=COALESCE($4,phone), email=COALESCE($5,email), status=COALESCE($6,status) WHERE id=$7 RETURNING *',
      [first_name, last_name, specialization, phone, email, status, req.params.id]
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
    const result = await query('DELETE FROM doctors WHERE id=$1 RETURNING id', [req.params.id]);
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
