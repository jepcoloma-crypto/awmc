import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Modal, Input, SelectPicker, Notification, useToaster } from 'rsuite';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Invoice, Payment } from '@/types';

const { Column, Cell } = Table;

export default function InvoiceView() {
  const { id } = useParams();
  const toaster = useToaster();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, payment_method: 'Cash' as string, reference_number: '' });

  useEffect(() => {
    loadInvoice();
    apiClient.get('/settings').then((res) => setSettings(res.data)).catch(() => {});
  }, [id]);

  const loadInvoice = async () => {
    try {
      const res = await apiClient.get(`/billing/${id}`);
      setInvoice(res.data);
      setPayments(res.data.payments || []);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (paymentForm.amount <= 0) return;
    try {
      await apiClient.post(`/billing/${id}/payment`, paymentForm);
      toaster.push(<Notification type="success" header="Success">Payment recorded</Notification>, { placement: 'topEnd' });
      setShowPayment(false);
      setPaymentForm({ amount: 0, payment_method: 'Cash', reference_number: '' });
      loadInvoice();
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to record payment</Notification>, { placement: 'topEnd' });
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const clinicName = settings.clinic_name || 'Alyssa Wellness & Medical Clinic';
    const clinicAddress = settings.clinic_address || '';
    const clinicPhone = settings.clinic_phone || '';
    const clinicEmail = settings.clinic_email || '';

    const itemsHtml = (invoice.items || []).map((item: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left">${item.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${formatCurrency(item.unit_price)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    const paymentsHtml = payments.length > 0 ? `
      <h3 style="font-size:16px;font-weight:600;margin:24px 0 12px;color:#1a2332;border-bottom:2px solid #179f8f;padding-bottom:8px">Payment History</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f4f8fc">
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#3d4e66;font-size:13px;text-transform:uppercase">Date</th>
            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#3d4e66;font-size:13px;text-transform:uppercase">Amount</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#3d4e66;font-size:13px;text-transform:uppercase">Method</th>
            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#3d4e66;font-size:13px;text-transform:uppercase">Reference</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map((p: Payment) => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left">${formatDate(p.payment_date, 'short')}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${formatCurrency(p.amount)}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left">${p.payment_method}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:left">${p.reference_number || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '';

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #1a2332;
            padding: 40px;
            -webkit-font-smoothing: antialiased;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 3px solid #179f8f;
          }
          .brand h1 {
            font-size: 22px;
            font-weight: 700;
            color: #179f8f;
            letter-spacing: -0.02em;
          }
          .brand p {
            font-size: 13px;
            color: #6c819e;
            margin-top: 4px;
          }
          .invoice-meta {
            text-align: right;
          }
          .invoice-meta h2 {
            font-size: 18px;
            font-weight: 700;
            color: #1a2332;
          }
          .invoice-meta p {
            font-size: 13px;
            color: #6c819e;
            margin-top: 2px;
          }
          .invoice-meta .status {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 8px;
          }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-partial { background: #fef3c7; color: #92400e; }
          .status-unpaid { background: #fce4ec; color: #c62828; }
          .status-overdue { background: #ffe0e0; color: #b71c1c; }
          .detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .detail-item label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6c819e;
            margin-bottom: 2px;
          }
          .detail-item span {
            font-size: 15px;
            font-weight: 500;
            color: #1a2332;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            margin-bottom: 24px;
          }
          thead th {
            background: #f4f8fc;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            color: #3d4e66;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          tbody td {
            padding: 10px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          tbody tr:last-child td {
            border-bottom: none;
          }
          .totals {
            margin-left: auto;
            width: 320px;
            border-top: 2px solid #179f8f;
            padding-top: 12px;
          }
          .totals .row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          .totals .row.final {
            font-size: 18px;
            font-weight: 700;
            color: #1a2332;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 6px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
          .no-print {
            text-align: center;
            margin-bottom: 20px;
          }
          .no-print button {
            padding: 10px 32px;
            background: #179f8f;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          }
          .no-print button:hover { background: #0d7f72; }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()">Print Invoice</button>
        </div>

        <div class="header">
          <div class="brand">
            <h1>${clinicName}</h1>
            ${clinicAddress ? `<p>${clinicAddress}</p>` : ''}
            ${clinicPhone ? `<p>${clinicPhone}${clinicEmail ? ' | ' + clinicEmail : ''}</p>` : clinicEmail ? `<p>${clinicEmail}</p>` : ''}
          </div>
          <div class="invoice-meta">
            <h2>Invoice #${invoice.invoice_number}</h2>
            <p>Date: ${formatDate(invoice.invoice_date)}</p>
            <p>Due: ${formatDate(invoice.due_date)}</p>
            <span class="status status-${invoice.status.toLowerCase()}">${invoice.status}</span>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <label>Patient</label>
            <span>${invoice.patient_name || '—'}</span>
          </div>
          <div class="detail-item">
            <label>Status</label>
            <span>${invoice.status}</span>
          </div>
          ${invoice.notes ? `
          <div class="detail-item" style="grid-column: span 2;">
            <label>Notes</label>
            <span>${invoice.notes}</span>
          </div>
          ` : ''}
        </div>

        <h3 style="font-size:16px;font-weight:600;margin-bottom:12px;color:#1a2332;border-bottom:2px solid #179f8f;padding-bottom:8px">Line Items</h3>
        <table>
          <thead>
            <tr>
              <th style="text-align:left">Description</th>
              <th style="text-align:center;width:60px">Qty</th>
              <th style="text-align:right;width:130px">Unit Price</th>
              <th style="text-align:right;width:130px">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <div class="row">
            <span>Subtotal</span>
            <span>${formatCurrency(invoice.items?.reduce((s: number, i: any) => s + i.total, 0) || 0)}</span>
          </div>
          <div class="row final">
            <span>Total</span>
            <span>${formatCurrency(invoice.total)}</span>
          </div>
          <div class="row">
            <span>Paid</span>
            <span style="color:#16a34a">${formatCurrency(invoice.paid_amount)}</span>
          </div>
          <div class="row" style="font-weight:600;color:${parseFloat(String(invoice.balance)) > 0 ? '#dc2626' : '#16a34a'}">
            <span>Balance</span>
            <span>${formatCurrency(invoice.balance)}</span>
          </div>
        </div>

        ${paymentsHtml}

        <div class="footer">
          <p>Thank you for choosing ${clinicName}</p>
          <p style="margin-top:4px">This is a computer-generated invoice.</p>
        </div>

        <script>
          setTimeout(function() { window.print(); }, 500);
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!invoice) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Invoice not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Invoice {invoice.invoice_number}</h2>
        <div className="flex gap-2">
          <Button appearance="ghost" onClick={handlePrint}>
            <svg className="w-4 h-4 inline mr-1.5 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
            </svg>
            Print
          </Button>
          <Button appearance="primary" onClick={() => setShowPayment(true)} disabled={invoice.status === 'Paid'}>Record Payment</Button>
          <Link to="/billing"><Button appearance="default">Back</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard label="Total" value={formatCurrency(invoice.total)} color="blue" />
        <SummaryCard label="Paid" value={formatCurrency(invoice.paid_amount)} color="green" />
        <SummaryCard label="Balance" value={formatCurrency(invoice.balance)} color={invoice.balance > 0 ? 'red' : 'green'} />
        <SummaryCard label="Status" value={invoice.status} color={invoice.status === 'Paid' ? 'green' : invoice.status === 'Partial' ? 'yellow' : 'red'} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Invoice Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <InfoRow label="Patient" value={invoice.patient_name || '—'} />
          <InfoRow label="Date" value={formatDate(invoice.invoice_date)} />
          <InfoRow label="Due Date" value={formatDate(invoice.due_date)} />
          <InfoRow label="Status" value={invoice.status} />
          {invoice.notes && <InfoRow label="Notes" value={invoice.notes} className="col-span-2" />}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Line Items</h4>
        <Table data={invoice.items || []} autoHeight rowHeight={56}>
          <Column width={250} flexGrow={1}>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Cell>{(rowData: any) => <span className="block truncate text-gray-800 dark:text-gray-200">{rowData.description}</span>}</Cell>
          </Column>
          <Column width={100}>
            <Table.HeaderCell>Qty</Table.HeaderCell>
            <Cell>{(rowData: any) => <span className="text-gray-700 dark:text-gray-300">{rowData.quantity}</span>}</Cell>
          </Column>
          <Column width={150} align="right">
            <Table.HeaderCell>Unit Price</Table.HeaderCell>
            <Cell>{(rowData: any) => <span className="block w-full font-medium text-gray-900 dark:text-gray-100 text-right">{formatCurrency(rowData.unit_price)}</span>}</Cell>
          </Column>
          <Column width={150} align="right">
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Cell>{(rowData: any) => <span className="block w-full font-semibold text-gray-900 dark:text-gray-100 text-right">{formatCurrency(rowData.total)}</span>}</Cell>
          </Column>
        </Table>
      </div>

      {payments.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment History</h4>
          <Table data={payments} autoHeight rowHeight={56}>
            <Column width={160}>
              <Table.HeaderCell>Date</Table.HeaderCell>
              <Cell>{(rowData: Payment) => <span className="text-gray-700 dark:text-gray-300">{formatDate(rowData.payment_date, 'short')}</span>}</Cell>
            </Column>
            <Column width={150} align="right">
              <Table.HeaderCell>Amount</Table.HeaderCell>
              <Cell>{(rowData: Payment) => <span className="block w-full font-semibold text-gray-900 dark:text-gray-100 text-right">{formatCurrency(rowData.amount)}</span>}</Cell>
            </Column>
            <Column width={150}>
              <Table.HeaderCell>Method</Table.HeaderCell>
              <Cell>{(rowData: Payment) => <span className="text-gray-700 dark:text-gray-300">{rowData.payment_method}</span>}</Cell>
            </Column>
            <Column width={170}>
              <Table.HeaderCell>Reference</Table.HeaderCell>
              <Cell>{(rowData: Payment) => <span className="text-gray-700 dark:text-gray-300">{rowData.reference_number || '—'}</span>}</Cell>
            </Column>
          </Table>
        </div>
      )}

      <Modal open={showPayment} onClose={() => setShowPayment(false)} size="sm">
        <Modal.Header><Modal.Title>Record Payment</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-300">Invoice Total: {formatCurrency(invoice.total)} | Balance: {formatCurrency(invoice.balance)}</p>
            <FormField label="Amount">
              <Input type="number" min={1} max={invoice.balance} value={paymentForm.amount} onChange={(v) => setPaymentForm({ ...paymentForm, amount: Number(v) || 0 })} />
            </FormField>
            <FormField label="Payment Method">
              <SelectPicker
                data={[
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Card', value: 'Card' },
                  { label: 'Bank Transfer', value: 'Bank Transfer' },
                  { label: 'Online', value: 'Online' },
                  { label: 'Cheque', value: 'Cheque' },
                ]}
                value={paymentForm.payment_method as any}
                onChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v as any })}
                className="w-full"
                searchable={false}
              />
            </FormField>
            <FormField label="Reference Number">
              <Input value={paymentForm.reference_number} onChange={(v) => setPaymentForm({ ...paymentForm, reference_number: v })} />
            </FormField>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={handleRecordPayment} disabled={paymentForm.amount <= 0}>Record</Button>
          <Button appearance="default" onClick={() => setShowPayment(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-[#e8f5e9] dark:bg-[#0b6e4f]/20 border-[#a5d6a7] dark:border-[#0b6e4f]/50 text-[#0b6e4f] dark:text-[#2ec4b6]',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <p className="text-xs">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-gray-600 dark:text-gray-300 text-xs">{label}</p>
      <p className="text-gray-800 dark:text-gray-200 font-medium">{value}</p>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}
