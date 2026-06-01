import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Input, SelectPicker } from 'rsuite';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { canAccess } from '@/lib/permissions';
import type { Invoice } from '@/types';

const { Column, Cell } = Table;

export default function BillingList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, search]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/billing');
      let data = res.data.data;
      if (statusFilter) data = data.filter((i: Invoice) => i.status === statusFilter);
      if (search) {
        const q = search.toLowerCase();
        data = data.filter((i: Invoice) => i.invoice_number?.toLowerCase().includes(q) || i.patient_name?.toLowerCase().includes(q));
      }
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  const totalInvoiced = invoices.reduce((s, i) => s + parseFloat(String(i.total)), 0);
  const totalCollected = invoices.reduce((s, i) => s + parseFloat(String(i.paid_amount)), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + parseFloat(String(i.balance)), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Billing & Invoices</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Manage patient invoices and payments</p>
        </div>
        {canAccess('billing', user) && (
          <Button appearance="primary" onClick={() => navigate('/billing/add')}>+ New Invoice</Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-blue wellness-stat-card">
          <p className="text-sm text-[#0b6e4f] dark:text-[#2ec4b6] font-semibold uppercase tracking-wider">Total Invoiced</p>
          <p className="text-3xl font-bold text-[#0b6e4f] dark:text-[#2ec4b6] mt-1">{formatCurrency(totalInvoiced)}</p>
        </div>
        <div className="stat-green wellness-stat-card">
          <p className="text-sm text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider">Total Collected</p>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="stat-rose wellness-stat-card">
          <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold uppercase tracking-wider">Outstanding</p>
          <p className="text-3xl font-bold text-rose-700 dark:text-rose-300 mt-1">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input placeholder="Search invoice # or patient..." value={search} onChange={setSearch} style={{ width: 280 }} />
        <SelectPicker
          data={[
            { label: 'All Status', value: '' },
            { label: 'Paid', value: 'Paid' },
            { label: 'Partial', value: 'Partial' },
            { label: 'Unpaid', value: 'Unpaid' },
            { label: 'Overdue', value: 'Overdue' },
          ]}
          value={statusFilter || ''}
          onChange={(v) => setStatusFilter(v || null)}
          className="w-40"
          cleanable={false}
        />
      </div>

      <div className="wellness-card">
        <Table data={invoices} loading={loading} autoHeight rowHeight={60} onRowClick={(rowData) => navigate(`/billing/${rowData.id}`)}>
          <Column width={180}><Table.HeaderCell>Invoice #</Table.HeaderCell><Cell>{(r: Invoice) => <span className="block font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">{r.invoice_number}</span>}</Cell></Column>
          <Column flexGrow={1} minWidth={220}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: Invoice) => <span className="block font-medium text-gray-800 dark:text-gray-200 truncate">{r.patient_name}</span>}</Cell></Column>
          <Column width={140}><Table.HeaderCell>Date</Table.HeaderCell><Cell>{(r: Invoice) => <span className="block text-gray-700 dark:text-gray-300 truncate">{r.invoice_date}</span>}</Cell></Column>
          <Column width={160} align="right"><Table.HeaderCell>Total</Table.HeaderCell><Cell>{(r: Invoice) => <span className="block w-full font-semibold text-gray-900 dark:text-gray-100 text-right">{formatCurrency(parseFloat(String(r.total)))}</span>}</Cell></Column>
          <Column width={160} align="right"><Table.HeaderCell>Paid</Table.HeaderCell><Cell>{(r: Invoice) => <span className="block w-full font-semibold text-green-700 dark:text-green-300 text-right">{formatCurrency(parseFloat(String(r.paid_amount)))}</span>}</Cell></Column>
          <Column width={160} align="right"><Table.HeaderCell>Balance</Table.HeaderCell><Cell>{(r: Invoice) => (
            <span className={`block w-full font-semibold text-right ${parseFloat(String(r.balance)) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {formatCurrency(parseFloat(String(r.balance)))}
            </span>
          )}</Cell></Column>
          <Column width={150}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Invoice) => (
            <span className="block"><Tag color={r.status === 'Paid' ? 'green' : r.status === 'Partial' ? 'yellow' : r.status === 'Overdue' ? 'red' : 'orange'}>{r.status}</Tag></span>
          )}</Cell></Column>
        </Table>
      </div>
    </div>
  );
}
