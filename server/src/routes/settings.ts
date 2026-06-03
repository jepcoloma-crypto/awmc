import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await query('SELECT key, value FROM settings');
    const map: Record<string, string> = {};
    result.rows.forEach((r: any) => { map[r.key] = r.value; });
    res.json(map);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', authMiddleware, requireRole('Administrator'), async (req, res) => {
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

export default router;
