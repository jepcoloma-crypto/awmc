import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/appointments', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to } = req.query;
    let sql = `
      SELECT a.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.appointment_date >= $1 AND a.appointment_date <= $2`;
    const params: any[] = [from, to];

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ' AND a.doctor_id = $3';
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

router.get('/financial', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to } = req.query;
    let sql = `
      SELECT p.*, i.invoice_number,
        CONCAT(pat.first_name, ' ', pat.last_name) as patient_name,
        CONCAT(u.first_name, ' ', u.last_name) as processed_by
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN patients pat ON i.patient_id = pat.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.payment_date >= $1 AND p.payment_date <= $2`;
    const params: any[] = [from, to];

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $3)';
        params.push(userRes.rows[0].doctor_id);
      }
    }

    sql += ' ORDER BY p.payment_date';
    const result = await query(sql, params);
    const totalCollected = result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.amount), 0);
    res.json({ data: result.rows, total_collected: totalCollected, total_count: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cashier-audit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { from, to, groupBy } = req.query;
    const trunc = groupBy === 'weekly' ? 'week' : groupBy === 'monthly' ? 'month' : 'day';
    const dateLabel = groupBy === 'weekly' ? 'Week Starting' : groupBy === 'monthly' ? 'Month' : 'Date';

    const summary = await query(`
      SELECT
        DATE_TRUNC('${trunc}', p.payment_date)::date as period,
        u.id as cashier_id,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name,
        COUNT(*) as transaction_count,
        COALESCE(SUM(p.amount),0) as total_collected
      FROM payments p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.payment_date >= $1 AND p.payment_date <= $2
      GROUP BY DATE_TRUNC('${trunc}', p.payment_date), u.id, u.first_name, u.last_name
      ORDER BY period, cashier_name
    `, [from, to]);

    const details = await query(`
      SELECT p.*, i.invoice_number,
        CONCAT(pat.first_name, ' ', pat.last_name) as patient_name,
        CONCAT(u.first_name, ' ', u.last_name) as cashier_name
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN patients pat ON i.patient_id = pat.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.payment_date >= $1 AND p.payment_date <= $2
      ORDER BY p.payment_date DESC
    `, [from, to]);

    const grandTotal = summary.rows.reduce((s: number, r: any) => s + parseFloat(r.total_collected), 0);

    res.json({
      summary: summary.rows.map((r: any) => ({
        ...r,
        total_collected: parseFloat(r.total_collected),
        transaction_count: parseInt(r.transaction_count),
      })),
      details: details.rows,
      grand_total: grandTotal,
      date_label: dateLabel,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
