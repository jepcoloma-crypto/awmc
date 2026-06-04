import { useState } from 'react';
import apiClient from '@/api/client';
import { Table, Button, SelectPicker, DatePicker, Tag, Notification, useToaster } from 'rsuite';
import { formatCurrency, formatDate, toLocalDateString } from '@/lib/utils';
import type { Appointment, Invoice, Payment } from '@/types';

const { Column, Cell } = Table;

type ReportType = 'appointments' | 'patients' | 'financial' | 'outstanding' | 'cashier-audit' | 'unattached';

export default function ReportsPage() {
  const toaster = useToaster();
  const [reportType, setReportType] = useState<ReportType>('appointments');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [groupBy, setGroupBy] = useState('daily');
  const [auditData, setAuditData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    setAuditData(null);
    try {
      if (reportType === 'appointments') {
        const res = await apiClient.get('/reports/appointments', { params: { from: fromDate || '2026-01-01', to: toDate || '2026-12-31' } });
        setData(res.data.data);
        setSummary(`Total appointments: ${res.data.total}`);
      } else if (reportType === 'financial') {
        const res = await apiClient.get('/reports/financial', { params: { from: fromDate || '2026-01-01', to: toDate || '2026-12-31' } });
        setData(res.data.data);
        setSummary(`Total collected: ${formatCurrency(res.data.total_collected)} | Transactions: ${res.data.total_count}`);
      } else if (reportType === 'patients') {
        const res = await apiClient.get('/patients');
        const filtered = res.data.data.filter((p: any) => {
          const created = p.created_at?.split('T')[0];
          return (!fromDate || created >= fromDate) && (!toDate || created <= toDate);
        });
        setData(filtered);
        setSummary(`Total patients registered: ${filtered.length}`);
      } else if (reportType === 'outstanding') {
        const res = await apiClient.get('/billing');
        const outstanding = res.data.data.filter((i: Invoice) => i.status === 'Unpaid' || i.status === 'Partial' || i.status === 'Overdue');
        setData(outstanding);
        const totalOutstanding = outstanding.reduce((s: number, i: Invoice) => s + parseFloat(String(i.balance)), 0);
        setSummary(`Total outstanding: ${formatCurrency(totalOutstanding)} | Accounts: ${outstanding.length}`);
      } else if (reportType === 'cashier-audit') {
        const res = await apiClient.get('/reports/cashier-audit', {
          params: { from: fromDate || '2026-01-01', to: toDate || '2026-12-31', groupBy }
        });
        setAuditData(res.data);
        setSummary(`Grand total: ${formatCurrency(res.data.grand_total)} | Periods: ${res.data.summary.length}`);
      } else if (reportType === 'unattached') {
        const res = await apiClient.get('/reports/unattached', {
          params: { from: fromDate || '2026-01-01', to: toDate || '2026-12-31' }
        });
        setData(res.data.data);
        setSummary(`Total invoices: ${res.data.total_count} | Total amount: ${formatCurrency(res.data.total_amount)}`);
      }
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to generate report</Notification>, { placement: 'topEnd' });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).map((v) => `"${v || ''}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const groupedByLabel = groupBy === 'weekly' ? 'Week Starting' : groupBy === 'monthly' ? 'Month' : 'Date';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Reports</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Generate and export clinic reports</p>
      </div>

      <div className="wellness-card p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
            <SelectPicker
              data={[
                { label: 'Appointment Report', value: 'appointments' },
                { label: 'Patient Report', value: 'patients' },
                { label: 'Financial Report', value: 'financial' },
                { label: 'Outstanding Balances', value: 'outstanding' },
                { label: 'Cashier Audit', value: 'cashier-audit' },
                { label: 'Unassigned Invoices', value: 'unattached' },
              ]}
              value={reportType}
              onChange={(v) => { setReportType(v as ReportType); setData([]); setSummary(''); setAuditData(null); }}
              className="w-full"
              searchable={false}
            />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
            <DatePicker className="w-full" value={fromDate ? new Date(fromDate) : null} onChange={(v) => setFromDate(v ? toLocalDateString(v) : '')} oneTap />
          </div>
          <div className="w-44">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
            <DatePicker className="w-full" value={toDate ? new Date(toDate) : null} onChange={(v) => setToDate(v ? toLocalDateString(v) : '')} oneTap />
          </div>
          {reportType === 'cashier-audit' && (
            <div className="w-40">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
              <SelectPicker
                data={[
                  { label: 'Daily', value: 'daily' },
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                ]}
                value={groupBy}
                onChange={(v) => setGroupBy(v || 'daily')}
                className="w-full"
                searchable={false}
                cleanable={false}
              />
            </div>
          )}
          <Button appearance="primary" onClick={generateReport} loading={loading}>Generate</Button>
          {data.length > 0 && <Button appearance="default" onClick={exportCSV}>Export CSV</Button>}
        </div>
        {summary && <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{summary}</p>}
      </div>

      {auditData && (
        <div className="space-y-4">
          <div className="wellness-card p-4 table-responsive">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Cashier Collection Summary ({groupBy})</h3>
              <span className="text-sm font-bold text-[#0b6e4f]">{formatCurrency(auditData.grand_total)}</span>
            </div>
            <Table data={auditData.summary} autoHeight rowHeight={48}>
              <Column width={140}><Table.HeaderCell>{groupedByLabel}</Table.HeaderCell><Cell>{(r: any) => {
                if (groupBy === 'weekly') { const d = new Date(r.period); return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`; }
                if (groupBy === 'monthly') { const d = new Date(r.period + '-01'); return d.toLocaleString('en-US', { month: 'short', year: 'numeric' }); }
                return r.period;
              }}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Cashier</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.cashier_name || 'Unknown'}</span>}</Cell></Column>
              <Column width={120} align="right"><Table.HeaderCell>Transactions</Table.HeaderCell><Cell>{(r: any) => r.transaction_count}</Cell></Column>
              <Column width={160} align="right"><Table.HeaderCell>Total Collected</Table.HeaderCell><Cell>{(r: any) => <span className="font-semibold text-green-700">{formatCurrency(r.total_collected)}</span>}</Cell></Column>
            </Table>
          </div>

          <div className="wellness-card p-4 table-responsive">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50 mb-3">Transaction Details</h3>
            <Table data={auditData.details} autoHeight rowHeight={48}>
              <Column width={140}><Table.HeaderCell>Date</Table.HeaderCell><Cell>{(r: any) => formatDate(r.payment_date)}</Cell></Column>
              <Column width={130}><Table.HeaderCell>Invoice #</Table.HeaderCell><Cell>{(r: any) => <span className="font-mono text-sm">{r.invoice_number}</span>}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
              <Column width={130} align="right"><Table.HeaderCell>Amount</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{formatCurrency(r.amount)}</span>}</Cell></Column>
              <Column width={110}><Table.HeaderCell>Method</Table.HeaderCell><Cell>{(r: any) => r.payment_method}</Cell></Column>
              <Column width={160}><Table.HeaderCell>Reference</Table.HeaderCell><Cell>{(r: any) => r.reference_number || '—'}</Cell></Column>
              <Column width={160}><Table.HeaderCell>Cashier</Table.HeaderCell><Cell>{(r: any) => r.cashier_name || '—'}</Cell></Column>
            </Table>
          </div>
        </div>
      )}

      {data.length > 0 && !auditData && (
        <div className="wellness-card p-4 table-responsive">
          {reportType === 'appointments' && (
            <Table data={data} autoHeight rowHeight={48}>
              <Column width={100}><Table.HeaderCell>Date</Table.HeaderCell><Cell>{(r: Appointment) => r.appointment_date}</Cell></Column>
              <Column width={90}><Table.HeaderCell>Time</Table.HeaderCell><Cell>{(r: Appointment) => r.appointment_time}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Doctor</Table.HeaderCell><Cell>{(r: any) => r.doctor_name}</Cell></Column>
              <Column width={200} flexGrow={1}><Table.HeaderCell>Reason</Table.HeaderCell><Cell>{(r: Appointment) => r.reason}</Cell></Column>
              <Column width={100}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Appointment) => <Tag color={r.status === 'Completed' ? 'green' : r.status === 'Cancelled' ? 'red' : 'blue'}>{r.status}</Tag>}</Cell></Column>
            </Table>
          )}
          {reportType === 'financial' && (
            <Table data={data} autoHeight rowHeight={48}>
              <Column width={160}><Table.HeaderCell>Date</Table.HeaderCell><Cell>{(r: Payment) => formatDate(r.payment_date)}</Cell></Column>
              <Column width={140}><Table.HeaderCell>Invoice #</Table.HeaderCell><Cell>{(r: any) => <span className="font-mono text-sm">{r.invoice_number}</span>}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
              <Column width={140} align="right"><Table.HeaderCell>Amount</Table.HeaderCell><Cell>{(r: Payment) => <span className="font-medium">{formatCurrency(r.amount)}</span>}</Cell></Column>
              <Column width={120}><Table.HeaderCell>Method</Table.HeaderCell><Cell>{(r: Payment) => r.payment_method}</Cell></Column>
              <Column width={160} flexGrow={1}><Table.HeaderCell>Reference</Table.HeaderCell><Cell>{(r: Payment) => r.reference_number || '—'}</Cell></Column>
              <Column width={160}><Table.HeaderCell>Processed By</Table.HeaderCell><Cell>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{r.processed_by || '—'}</span>}</Cell></Column>
            </Table>
          )}
          {reportType === 'patients' && (
            <Table data={data} autoHeight rowHeight={48}>
              <Column width={110}><Table.HeaderCell>Patient ID</Table.HeaderCell><Cell>{(r: any) => <span className="font-mono text-xs">{r.patient_id}</span>}</Cell></Column>
              <Column width={200}><Table.HeaderCell>Name</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.first_name} {r.last_name}</span>}</Cell></Column>
              <Column width={80}><Table.HeaderCell>Gender</Table.HeaderCell><Cell>{(r: any) => r.gender}</Cell></Column>
              <Column width={140}><Table.HeaderCell>Contact</Table.HeaderCell><Cell>{(r: any) => r.phone}</Cell></Column>
              <Column width={140}><Table.HeaderCell>Registered</Table.HeaderCell><Cell>{(r: any) => formatDate(r.created_at)}</Cell></Column>
            </Table>
          )}
          {reportType === 'outstanding' && (
            <Table data={data} autoHeight rowHeight={48}>
              <Column width={140}><Table.HeaderCell>Invoice #</Table.HeaderCell><Cell>{(r: Invoice) => <span className="font-mono text-sm">{r.invoice_number}</span>}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
              <Column width={120} align="right"><Table.HeaderCell>Total</Table.HeaderCell><Cell>{(r: Invoice) => formatCurrency(parseFloat(String(r.total)))}</Cell></Column>
              <Column width={120} align="right"><Table.HeaderCell>Balance</Table.HeaderCell><Cell>{(r: Invoice) => <span className="font-semibold text-red-600">{formatCurrency(parseFloat(String(r.balance)))}</span>}</Cell></Column>
              <Column width={110}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Invoice) => <Tag color={r.status === 'Partial' ? 'yellow' : r.status === 'Overdue' ? 'red' : 'orange'}>{r.status}</Tag>}</Cell></Column>
            </Table>
          )}
          {reportType === 'unattached' && (
            <Table data={data} autoHeight rowHeight={48}>
              <Column width={140}><Table.HeaderCell>Invoice #</Table.HeaderCell><Cell>{(r: any) => <span className="font-mono text-sm">{r.invoice_number}</span>}</Cell></Column>
              <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
              <Column width={100} align="right"><Table.HeaderCell>Total</Table.HeaderCell><Cell>{(r: any) => formatCurrency(parseFloat(String(r.total)))}</Cell></Column>
              <Column width={100} align="right"><Table.HeaderCell>Balance</Table.HeaderCell><Cell>{(r: any) => <span className="font-semibold text-red-600">{formatCurrency(parseFloat(String(r.balance)))}</span>}</Cell></Column>
              <Column width={100}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: any) => <Tag color={r.status === 'Paid' ? 'green' : r.status === 'Partial' ? 'yellow' : r.status === 'Overdue' ? 'red' : 'orange'}>{r.status}</Tag>}</Cell></Column>
              <Column width={160}><Table.HeaderCell>Processed By</Table.HeaderCell><Cell>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{r.processed_by || '—'}</span>}</Cell></Column>
              <Column width={130}><Table.HeaderCell>Created</Table.HeaderCell><Cell>{(r: any) => formatDate(r.created_at)}</Cell></Column>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
