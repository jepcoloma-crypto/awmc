import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, type AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${day}`;
    const userId = req.user!.id;
    const role = req.user!.role;
    const isDoctor = role === 'Medical Practitioner';

    let doctorId: number | null = null;
    if (isDoctor) {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [userId]);
      doctorId = userRes.rows[0]?.doctor_id || null;
    }

    const todayApps = await query(
      `SELECT a.*,
        CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        CONCAT('Dr. ', d.first_name, ' ', d.last_name) as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.appointment_date = $1${isDoctor && doctorId ? ' AND a.doctor_id = $2' : ''}
       ORDER BY a.appointment_time`,
      isDoctor && doctorId ? [today, doctorId] : [today]
    );

    const activePatients = await query("SELECT COUNT(*) FROM patients WHERE status = $1", ['Active']);

    const invoices = await query(
      `SELECT COALESCE(SUM(total),0) as total_invoiced, COALESCE(SUM(paid_amount),0) as total_collected, COALESCE(SUM(balance),0) as total_outstanding FROM invoices i WHERE 1=1${isDoctor && doctorId ? ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $1)' : ''}`,
      isDoctor && doctorId ? [doctorId] : []
    );

    const monthlyRevenue = await query(`
      SELECT TO_CHAR(date_trunc('month', p.payment_date), 'Mon') as month,
             COALESCE(SUM(p.amount),0) as revenue
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE p.payment_date >= NOW() - INTERVAL '6 months'${isDoctor && doctorId ? ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $1)' : ''}
      GROUP BY date_trunc('month', p.payment_date)
      ORDER BY date_trunc('month', p.payment_date)
    `, isDoctor && doctorId ? [doctorId] : []);

    const dailyRevenue = await query(`
      SELECT TO_CHAR(date_trunc('day', p.payment_date), 'YYYY-MM-DD') as day,
             COALESCE(SUM(p.amount),0) as revenue
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE p.payment_date >= NOW() - INTERVAL '6 days'${isDoctor && doctorId ? ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $1)' : ''}
      GROUP BY date_trunc('day', p.payment_date)
      ORDER BY date_trunc('day', p.payment_date)
    `, isDoctor && doctorId ? [doctorId] : []);

    const registrations = await query(`
      SELECT TO_CHAR(date_trunc('month', created_at), 'Mon') as month,
             COUNT(*) as count
      FROM patients
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY date_trunc('month', created_at)
    `);

    const statusBreakdown = await query(`
      SELECT status, COUNT(*) as count
      FROM appointments
      WHERE 1=1${isDoctor && doctorId ? ' AND doctor_id = $1' : ''}
      GROUP BY status
    `, isDoctor && doctorId ? [doctorId] : []);

    const outstanding = await query(`
      SELECT i.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE i.status IN ('Unpaid', 'Partial', 'Overdue')${isDoctor && doctorId ? ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $1)' : ''}
      ORDER BY i.balance DESC
      LIMIT 10
    `, isDoctor && doctorId ? [doctorId] : []);

    const todayCompleted = todayApps.rows.filter((a: any) => a.status === 'Completed').length;
    const todayCancelled = todayApps.rows.filter((a: any) => a.status === 'Cancelled').length;

    const todayCollected = await query(
      `SELECT COALESCE(SUM(p.amount),0) as total
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE p.payment_date::date = $1${isDoctor && doctorId ? ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $2)' : ''}`,
      isDoctor && doctorId ? [today, doctorId] : [today]
    );

    const todayProfFee = await query(
      `SELECT COALESCE(SUM(ii.total),0) as total
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       WHERE ii.description LIKE 'Professional Fee%'
         AND i.id IN (SELECT p.invoice_id FROM payments p WHERE p.payment_date::date = $1)${isDoctor && doctorId ? ' AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $2)' : ''}`,
      isDoctor && doctorId ? [today, doctorId] : [today]
    );

    const unattached = await query(`
      SELECT i.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM payments pm
         LEFT JOIN users u ON pm.created_by = u.id
         WHERE pm.invoice_id = i.id
         ORDER BY pm.payment_date DESC LIMIT 1) as processed_by
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE NOT EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id)
      ORDER BY i.created_at DESC
    `);

    res.json({
      total_appointments_today: todayApps.rows.length,
      completed_appointments: todayCompleted,
      cancelled_appointments: todayCancelled,
      total_patients: parseInt(activePatients.rows[0].count),
      total_collected_today: parseFloat(todayCollected.rows[0].total) || 0,
      prof_fee_collected_today: parseFloat(todayProfFee.rows[0].total) || 0,
      total_outstanding: parseFloat(invoices.rows[0].total_outstanding) || 0,
      total_invoiced: parseFloat(invoices.rows[0].total_invoiced) || 0,
      monthly_revenue: monthlyRevenue.rows.map((r: any) => ({ month: r.month, revenue: parseFloat(r.revenue) })),
      daily_revenue: dailyRevenue.rows.map((r: any) => ({ day: r.day, revenue: parseFloat(r.revenue) })),
      patient_registrations: registrations.rows.map((r: any) => ({ month: r.month, count: parseInt(r.count) })),
      appointment_status_breakdown: statusBreakdown.rows.map((r: any) => ({ status: r.status, count: parseInt(r.count) })),
      today_schedule: todayApps.rows,
      outstanding_balances: outstanding.rows,
      unattached_invoices: unattached.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
