import { Router } from 'express';
import { query } from '../db';
import { authMiddleware, requireRole, type AuthRequest } from '../middleware/auth';

const router = Router();

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    let sql = `
      SELECT i.*, CONCAT(p.first_name, ' ', p.last_name) as patient_name,
        (SELECT CONCAT(u.first_name, ' ', u.last_name) FROM payments pm
         LEFT JOIN users u ON pm.created_by = u.id
         WHERE pm.invoice_id = i.id
         ORDER BY pm.payment_date DESC LIMIT 1) as processed_by
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE 1=1`;
    const params: any[] = [];
    let idx = 1;

    if (req.user!.role === 'Medical Practitioner') {
      const userRes = await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id]);
      if (userRes.rows[0]?.doctor_id) {
        sql += ` AND EXISTS (SELECT 1 FROM patient_doctors pd WHERE pd.patient_id = i.patient_id AND pd.doctor_id = $${idx})`;
        params.push(userRes.rows[0].doctor_id);
        idx++;
      }
    }

    sql += ' ORDER BY i.created_at DESC';
    const result = await query(sql, params);
    res.json({ data: result.rows, total: result.rows.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await query(
      'SELECT i.*, CONCAT(p.first_name, \' \', p.last_name) as patient_name FROM invoices i JOIN patients p ON i.patient_id = p.id WHERE i.id = $1',
      [req.params.id]
    );
    if (invoice.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const items = await query(
      'SELECT ii.*, s.name as service_name FROM invoice_items ii LEFT JOIN services s ON ii.service_id = s.id WHERE ii.invoice_id = $1',
      [req.params.id]
    );
    const payments = await query('SELECT p.*, CONCAT(u.first_name, \' \', u.last_name) as processed_by FROM payments p LEFT JOIN users u ON p.created_by = u.id WHERE p.invoice_id = $1 ORDER BY p.payment_date', [req.params.id]);
    res.json({ ...invoice.rows[0], items: items.rows, payments: payments.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { patient_id, due_date, notes, items, subtotal, tax, total } = req.body;
    const invNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;
    const doctorId = req.user!.role === 'Medical Practitioner'
      ? (await query('SELECT doctor_id FROM users WHERE id = $1', [req.user!.id])).rows[0]?.doctor_id
      : req.body.doctor_id || null;

    const invoice = await query(
      `INSERT INTO invoices (invoice_number, patient_id, doctor_id, due_date, subtotal, tax, total, paid_amount, balance, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,0,$7,'Unpaid',$8) RETURNING *`,
      [invNumber, patient_id, doctorId, due_date || tomorrow(), subtotal || 0, tax || 0, total || 0, notes || '']
    );

    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          'INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6)',
          [invoice.rows[0].id, item.service_id || null, item.description, item.quantity, item.unit_price, item.total]
        );
      }
    }

    res.status(201).json(invoice.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/payment', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, payment_method, reference_number } = req.body;
    const invoice = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (invoice.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const payment = await query(
      'INSERT INTO payments (invoice_id, amount, payment_method, reference_number, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, amount, payment_method, reference_number || '', req.user!.id]
    );

    const newPaid = parseFloat(invoice.rows[0].paid_amount) + parseFloat(amount);
    const newBalance = parseFloat(invoice.rows[0].total) - newPaid;
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    await query('UPDATE invoices SET paid_amount=$1, balance=$2, status=$3 WHERE id=$4',
      [newPaid, Math.max(0, newBalance), newStatus, req.params.id]);

    res.status(201).json(payment.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: 'Items array is required' });
      return;
    }

    const invoiceRes = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (invoiceRes.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const invoice = invoiceRes.rows[0];
    const paidAmount = parseFloat(invoice.paid_amount);

    // Delete existing items and re-insert
    await query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);

    for (const item of items) {
      await query(
        'INSERT INTO invoice_items (invoice_id, service_id, description, quantity, unit_price, total) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.params.id, item.service_id || null, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    const subtotal = items.reduce((s: number, i: any) => s + parseFloat(i.total), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    const balance = Math.max(0, total - paidAmount);
    let status = 'Unpaid';
    if (balance <= 0) status = 'Paid';
    else if (paidAmount > 0) status = 'Partial';

    await query(
      'UPDATE invoices SET subtotal=$1, tax=$2, total=$3, balance=$4, status=$5 WHERE id=$6',
      [subtotal, tax, total, balance, status, req.params.id]
    );

    const updated = await query(
      'SELECT i.*, CONCAT(p.first_name, \' \', p.last_name) as patient_name FROM invoices i JOIN patients p ON i.patient_id = p.id WHERE i.id = $1',
      [req.params.id]
    );
    const updatedItems = await query(
      'SELECT ii.*, s.name as service_name FROM invoice_items ii LEFT JOIN services s ON ii.service_id = s.id WHERE ii.invoice_id = $1',
      [req.params.id]
    );
    const payments = await query('SELECT p.*, CONCAT(u.first_name, \' \', u.last_name) as processed_by FROM payments p LEFT JOIN users u ON p.created_by = u.id WHERE p.invoice_id = $1 ORDER BY p.payment_date', [req.params.id]);
    res.json({ ...updated.rows[0], items: updatedItems.rows, payments: payments.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, requireRole('Administrator'), async (req, res) => {
  try {
    const result = await query('DELETE FROM invoices WHERE id=$1 RETURNING id', [req.params.id]);
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
