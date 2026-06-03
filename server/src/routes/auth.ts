import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db';
import { authMiddleware, generateToken, type AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }
    const result = await query('SELECT * FROM users WHERE username = $1 AND status = $2', [username, 'Active']);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, username, first_name, last_name, email, role, doctor_id, status, created_at, last_login FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
