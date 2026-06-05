import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT * FROM inventory ORDER BY item_name');
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { item_name, category, quantity, unit, reorder_level, unit_price, supplier, notes } = req.body;
    const result = await query(
      `INSERT INTO inventory (item_name, category, quantity, unit, reorder_level, unit_price, supplier, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item_name, category || 'Medicine', quantity || 0, unit || 'piece', reorder_level ?? 10, unit_price || 0, supplier || '', notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { item_name, category, quantity, unit, reorder_level, unit_price, supplier, notes } = req.body;
    const result = await query(
      `UPDATE inventory SET item_name=$1, category=$2, quantity=$3, unit=$4, reorder_level=$5, unit_price=$6, supplier=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [item_name, category, quantity, unit, reorder_level, unit_price, supplier, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    await query('DELETE FROM inventory WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;