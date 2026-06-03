import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM procedure_types ORDER BY name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('Administrator'), async (req, res) => {
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

router.put('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const result = await query(
      'UPDATE procedure_types SET name=$1, description=$2, price=$3 WHERE id=$4 RETURNING *',
      [name, description || '', price || 0, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Procedure type not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    await query('DELETE FROM procedure_types WHERE id=$1', [req.params.id]);
    res.json({ message: 'Procedure type deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
