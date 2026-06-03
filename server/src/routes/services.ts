import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM services ORDER BY name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('Administrator'), async (req, res) => {
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

router.put('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { name, description, price, category, status } = req.body;
    const result = await query(
      'UPDATE services SET name=$1, description=$2, price=$3, category=$4, status=$5 WHERE id=$6 RETURNING *',
      [name, description || '', price || 0, category || '', status || 'Active', req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    await query('DELETE FROM services WHERE id=$1', [req.params.id]);
    res.json({ message: 'Service deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
