import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatsCardSkeleton } from '@/components/skeletons/TableSkeleton';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, Tag } from 'rsuite';

const { Column, Cell: CellT } = Table;

const PIE_COLORS = ['#0ea89a', '#2ec4b6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="font-semibold text-gray-900 dark:text-gray-100">
            {formatter ? formatter(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const res = await apiClient.get('/dashboard/stats');
      setStats(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-80" />
          <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-80" />
        </div>
      </div>
    );
  }
  if (!stats) {
    return <div className="text-center py-20 text-gray-400 dark:text-gray-500">Failed to load dashboard data.</div>;
  }

  const isDoctor = user?.role === 'Medical Practitioner';
  const isCashier = user?.role === 'Cashier';
  const isFrontDesk = user?.role === 'Front Desk Staff';

  const statCards = [];
  if (!isCashier) {
    statCards.push({
      title: "Today's Appointments", value: stats.total_appointments_today, icon: 'calendar', variant: 'blue',
      detail: `${stats.completed_appointments} completed`,
    });
  }
  if (!isCashier) {
    statCards.push({
      title: 'Active Patients', value: stats.total_patients, icon: 'users', variant: 'green',
      detail: 'Registered patients',
    });
  }
  if (isCashier || isDoctor) {
    if (isDoctor) {
      statCards.push({
        title: "Today's Professional Fee", value: formatCurrency(stats.prof_fee_collected_today), icon: 'currency', variant: 'teal',
        detail: 'Doctor professional fee collected',
      });
    }
    statCards.push({
      title: "Today's Collections", value: formatCurrency(stats.total_collected_today), icon: 'currency', variant: 'green',
      detail: 'Total collected today',
    });
    statCards.push({
      title: 'Outstanding', value: formatCurrency(stats.total_outstanding), icon: 'alert', variant: 'rose',
      detail: 'Unpaid balance',
    });
  }
  if (!isCashier && !isFrontDesk) {
    statCards.push({
      title: 'Total Collected', value: formatCurrency(stats.total_collected), icon: 'currency', variant: 'green',
      detail: 'Lifetime total collected',
    });
    statCards.push({
      title: 'Total Invoiced', value: formatCurrency(stats.total_invoiced), icon: 'receipt', variant: 'amber',
      detail: 'Lifetime invoice total',
    });
  }
  if (!isCashier) {
    statCards.push({
      title: 'Appointments Completed', value: stats.completed_appointments, icon: 'check', variant: 'teal',
      detail: 'Today',
    });
  }

  const statIcons: Record<string, string> = {
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
    currency: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    alert: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    receipt: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.first_name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          System online
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.title}
            className={`stat-${card.variant} wellness-stat-card animate-fade-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                card.variant === 'blue' ? 'bg-[#eefbfa] dark:bg-[#0ea89a]/20' :
                card.variant === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                card.variant === 'teal' ? 'bg-[#eefbfa] dark:bg-[#0ea89a]/20' :
                card.variant === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                card.variant === 'rose' ? 'bg-rose-100 dark:bg-rose-900/30' :
                'bg-gray-100 dark:bg-gray-800'
              }`}>
                <svg className={`w-5 h-5 ${
                  card.variant === 'blue' ? 'text-[#0ea89a] dark:text-[#2ec4b6]' :
                  card.variant === 'green' ? 'text-green-600 dark:text-green-400' :
                  card.variant === 'teal' ? 'text-[#0ea89a] dark:text-[#2ec4b6]' :
                  card.variant === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                  card.variant === 'rose' ? 'text-rose-600 dark:text-rose-400' :
                  'text-gray-600 dark:text-gray-400'
                }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={statIcons[card.icon] || statIcons.calendar} />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">{card.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{card.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.detail}</p>
          </div>
        ))}
      </div>

      {/* Charts + Today's Schedule */}
      {!isCashier && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="wellness-card animate-fade-in">
          <div className="wellness-card-header">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">Revenue</p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{isDoctor ? 'Daily Revenue' : 'Monthly Revenue'}</h3>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{isDoctor ? 'Last 7 days' : 'Last 6 months'}</span>
            </div>
          </div>
          <div className="wellness-card-body">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={isDoctor ? stats.daily_revenue : stats.monthly_revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey={isDoctor ? 'day' : 'month'} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={isDoctor ? (v: string) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; } : undefined} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => formatCurrency(v)} />} />
                <Line type="monotone" dataKey="revenue" stroke="#179f8f" strokeWidth={2.5} dot={{ r: 4, fill: '#179f8f', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#179f8f' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Registrations Chart */}
        <div className="wellness-card animate-fade-in">
          <div className="wellness-card-header">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">Growth</p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Patient Registrations</h3>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">Last 6 months</span>
            </div>
          </div>
          <div className="wellness-card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.patient_registrations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* Lower section */}
      {!isCashier && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="wellness-card animate-fade-in">
          <div className="wellness-card-header">
            <p className="section-title">Status</p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Appointment Status</h3>
          </div>
          <div className="wellness-card-body">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={stats.appointment_status_breakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={85} innerRadius={45} label={({ status, count, cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 24;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#64748b" fontSize={11} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                      {status} ({(percent * 100).toFixed(0)}%)
                    </text>
                  );
                }}>
                  {stats.appointment_status_breakdown.map((_: any, idx: number) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="wellness-card lg:col-span-2 animate-fade-in table-responsive">
          <div className="wellness-card-header">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">Schedule</p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Today's Schedule</h3>
              </div>
              <button
                onClick={() => navigate('/appointments')}
                className="text-xs text-[#0ea89a] dark:text-[#2ec4b6] hover:text-[#0a877d] font-medium"
              >
                View all &rarr;
              </button>
            </div>
          </div>
          <div className="wellness-card-body pt-0">
            {stats.today_schedule?.length > 0 ? (
              <Table data={stats.today_schedule.slice(0, 8)} autoHeight rowHeight={52} hover={false}>
                <Column width={110}>
                  <Table.HeaderCell>Time</Table.HeaderCell>
                  <CellT>{(r: any) => (
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{r.appointment_time}</span>
                  )}</CellT>
                </Column>
                <Column width={170}>
                  <Table.HeaderCell>Patient</Table.HeaderCell>
                  <CellT>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{r.patient_name}</span>}</CellT>
                </Column>
                <Column width={170}>
                  <Table.HeaderCell>Doctor</Table.HeaderCell>
                  <CellT>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{r.doctor_name}</span>}</CellT>
                </Column>
                <Column width={110}>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <CellT>{(r: any) => (
                    <Tag color={
                      r.status === 'Completed' ? 'green' :
                      r.status === 'Scheduled' ? 'blue' :
                      r.status === 'Confirmed' ? 'cyan' :
                      r.status === 'In Progress' ? 'orange' :
                      r.status === 'Cancelled' ? 'red' : 'yellow'
                    }>{r.status}</Tag>
                  )}</CellT>
                </Column>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <p>No appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Outstanding Balances */}
      {stats.outstanding_balances?.length > 0 && (
        <div className="wellness-card animate-fade-in table-responsive">
          <div className="wellness-card-header">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title">Collections</p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Outstanding Balances</h3>
              </div>
              <button
                onClick={() => navigate('/billing')}
                className="text-xs text-[#0ea89a] dark:text-[#2ec4b6] hover:text-[#0a877d] font-medium"
              >
                View all &rarr;
              </button>
            </div>
          </div>
          <div className="wellness-card-body pt-0">
            <Table data={stats.outstanding_balances.slice(0, 8)} autoHeight rowHeight={52}>
              <Column width={140}>
                <Table.HeaderCell>Invoice #</Table.HeaderCell>
                <CellT>{(r: any) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.invoice_number}</span>}</CellT>
              </Column>
              <Column width={170}>
                <Table.HeaderCell>Patient</Table.HeaderCell>
                <CellT>{(r: any) => r.patient_name}</CellT>
              </Column>
              <Column width={120} align="right">
                <Table.HeaderCell>Total</Table.HeaderCell>
                <CellT>{(r: any) => formatCurrency(r.total)}</CellT>
              </Column>
              <Column width={120} align="right">
                <Table.HeaderCell>Balance</Table.HeaderCell>
                <CellT>{(r: any) => <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(r.balance)}</span>}</CellT>
              </Column>
              <Column width={110}>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <CellT>{(r: any) => (
                  <Tag color={r.status === 'Paid' ? 'green' : r.status === 'Partial' ? 'yellow' : r.status === 'Overdue' ? 'red' : 'orange'}>
                    {r.status}
                  </Tag>
                )}</CellT>
              </Column>
            </Table>
          </div>
        </div>
      )}

      {/* Unattached Invoices — invoices not linked to any doctor */}
      {!isCashier && !isDoctor && !isFrontDesk && stats.unattached_invoices?.length > 0 && (
        <div className="wellness-card animate-fade-in border-2 border-amber-200 dark:border-amber-800 table-responsive">
          <div className="wellness-card-header bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-title text-amber-700 dark:text-amber-400">Audit Alert</p>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">Invoices Without Doctor Assignment</h3>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{stats.unattached_invoices.length} invoice(s)</span>
            </div>
          </div>
          <div className="wellness-card-body pt-0">
            <div className="mb-3 mt-3 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3">
                These invoices are not assigned to any medical practitioner. 
              Please assign a doctor to the patient so their invoices appear in the correct practitioner dashboard.
            </div>
            <Table data={stats.unattached_invoices.slice(0, 10)} autoHeight rowHeight={52}>
              <Column width={140}>
                <Table.HeaderCell>Invoice #</Table.HeaderCell>
                <CellT>{(r: any) => <span className="font-medium text-gray-900 dark:text-gray-100">{r.invoice_number}</span>}</CellT>
              </Column>
              <Column width={170}>
                <Table.HeaderCell>Patient</Table.HeaderCell>
                <CellT>{(r: any) => r.patient_name}</CellT>
              </Column>
              <Column width={120} align="right">
                <Table.HeaderCell>Total</Table.HeaderCell>
                <CellT>{(r: any) => formatCurrency(r.total)}</CellT>
              </Column>
              <Column width={120} align="right">
                <Table.HeaderCell>Balance</Table.HeaderCell>
                <CellT>{(r: any) => <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(r.balance)}</span>}</CellT>
              </Column>
              <Column width={110}>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <CellT>{(r: any) => (
                  <Tag color={r.status === 'Paid' ? 'green' : r.status === 'Partial' ? 'yellow' : r.status === 'Overdue' ? 'red' : 'orange'}>
                    {r.status}
                  </Tag>
                )}</CellT>
              </Column>
              <Column width={130}>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <CellT>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{formatDate(r.created_at)}</span>}</CellT>
              </Column>
              <Column width={160}>
                <Table.HeaderCell>Processed By</Table.HeaderCell>
                <CellT>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{r.processed_by || '—'}</span>}</CellT>
              </Column>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
