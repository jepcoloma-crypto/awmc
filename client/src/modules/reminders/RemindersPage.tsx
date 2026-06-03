import { useEffect, useState } from 'react';
import apiClient from '@/api/client';
import { Table, Tag, Button, Modal, Input, SelectPicker, Notification, useToaster } from 'rsuite';
import { formatDate, formatTimeHHMM } from '@/lib/utils';
import type { Reminder, Patient, Appointment } from '@/types';

const { Column, Cell } = Table;

export default function RemindersPage() {
  const toaster = useToaster();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ patient_id: null as number | null, type: 'Manual' as string, message: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.get('/reminders'), apiClient.get('/patients'), apiClient.get('/reminders/today-scheduled')]).then(([rRes, pRes, tRes]) => {
      setReminders(rRes.data.data);
      setPatients(pRes.data.data);
      setTodayAppointments(tRes.data.data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!form.patient_id || !form.message) return;
    setSaving(true);
    try {
      await apiClient.post('/reminders', form);
      toaster.push(<Notification type="success" header="Sent">Reminder created</Notification>, { placement: 'topEnd' });
      setShowAdd(false);
      setForm({ patient_id: null, type: 'Manual', message: '' });
      const res = await apiClient.get('/reminders');
      setReminders(res.data.data);
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to send reminder</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  const outstandingPatients = patients.slice(0, 3);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Reminders & Notifications</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Send and track patient reminders</p>
        </div>
        <Button appearance="primary" onClick={() => setShowAdd(true)}>+ New Reminder</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="wellness-card p-5">
          <p className="section-title flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Today's Patients
          </p>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No appointments scheduled for today.</p>
          ) : (
            <div className="space-y-2 mt-2">
              {todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{a.patient_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{a.doctor_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTimeHHMM(a.appointment_time)}</span>
                    <Tag size="sm" color={a.status === 'Confirmed' ? 'blue' : 'yellow'}>{a.status}</Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="wellness-card p-5">
          <p className="section-title flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Outstanding Balances
          </p>
          {outstandingPatients.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No outstanding balances.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {outstandingPatients.map((p) => (
                <li key={p.id} className="text-gray-700 dark:text-gray-300">{p.first_name} {p.last_name}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="wellness-card p-5">
          <p className="section-title flex items-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Recent Reminders
          </p>
          {reminders.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No reminders sent yet.</p>
          ) : (
            <div className="space-y-2">
              {reminders.slice(0, 5).map((r) => (
                <div key={r.id} className="text-xs text-gray-600 dark:text-gray-400 pb-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <p className="truncate">{r.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-400 dark:text-gray-500">{formatDate(r.created_at, 'short')}</span>
                    <Tag size="sm" color={r.status === 'Sent' ? 'green' : r.status === 'Failed' ? 'red' : 'yellow'}>{r.status}</Tag>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="wellness-card p-5">
        <p className="section-title">All Reminders</p>
        <Table data={reminders} loading={loading} autoHeight rowHeight={56}>
          <Column width={300} flexGrow={1}><Table.HeaderCell>Message</Table.HeaderCell><Cell>{(r: Reminder) => <div className="truncate max-w-sm">{r.message}</div>}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Type</Table.HeaderCell><Cell>{(r: Reminder) => <Tag color={r.type === 'SMS' ? 'cyan' : r.type === 'Email' ? 'blue' : 'orange'}>{r.type}</Tag>}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Reminder) => <Tag color={r.status === 'Sent' ? 'green' : r.status === 'Pending' ? 'yellow' : 'red'}>{r.status}</Tag>}</Cell></Column>
          <Column width={160}><Table.HeaderCell>Sent At</Table.HeaderCell><Cell>{(r: Reminder) => formatDate(r.sent_at, 'short')}</Cell></Column>
        </Table>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} size="sm">
        <Modal.Header><Modal.Title>New Reminder</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <FormField label="Patient">
              <SelectPicker data={patients.map((p) => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }))} value={form.patient_id as any} onChange={(v) => setForm({ ...form, patient_id: v as any })} className="w-full" searchable />
            </FormField>
            <FormField label="Type">
              <SelectPicker data={[{ label: 'Manual', value: 'Manual' }, { label: 'SMS', value: 'SMS' }, { label: 'Email', value: 'Email' }]} value={form.type as any} onChange={(v) => setForm({ ...form, type: v as any })} className="w-full" searchable={false} />
            </FormField>
            <FormField label="Message">
              <Input as="textarea" rows={4} value={form.message} onChange={(v) => setForm({ ...form, message: v })} />
            </FormField>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={handleAdd} loading={saving}>Send Reminder</Button>
          <Button appearance="default" onClick={() => setShowAdd(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
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
