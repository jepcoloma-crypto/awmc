import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, DatePicker, Notification, useToaster } from 'rsuite';
import { toLocalDateString } from '@/lib/utils';
import type { Appointment, Patient, Doctor } from '@/types';

const statusOptions = [
  { label: 'Scheduled', value: 'Scheduled' },
  { label: 'Confirmed', value: 'Confirmed' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'No Show', value: 'No Show' },
];

export default function AppointmentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toaster = useToaster();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/patients'),
      apiClient.get('/doctors'),
      apiClient.get('/appointments'),
    ]).then(([pRes, dRes, aRes]) => {
      setPatients(pRes.data.data);
      setDoctors(dRes.data.data);
      const appt = aRes.data.data.find((a: Appointment) => a.id === Number(id));
      if (appt) setForm(appt);
      setLoading(false);
    });
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put(`/appointments/${id}`, form);
      toaster.push(<Notification type="success" header="Success">Appointment updated</Notification>, { placement: 'topEnd' });
      navigate('/appointments');
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to update</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  const timeSlots = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeSlots.push({ label: val, value: val });
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Edit Appointment</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Patient" required>
            <SelectPicker data={patients.map((p) => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }))} value={form.patient_id} onChange={(v) => setForm({ ...form, patient_id: v })} className="w-full" />
          </FormField>
          <FormField label="Doctor" required>
            <SelectPicker data={doctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))} value={form.doctor_id} onChange={(v) => setForm({ ...form, doctor_id: v })} className="w-full" />
          </FormField>
          <FormField label="Date" required>
            <DatePicker className="w-full" value={form.appointment_date ? new Date(form.appointment_date) : null} onChange={(v) => setForm({ ...form, appointment_date: v ? toLocalDateString(v) : '' })} oneTap />
          </FormField>
          <FormField label="Status">
            <SelectPicker data={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: v })} className="w-full" searchable={false} />
          </FormField>
          <FormField label="Start Time" required>
            <SelectPicker data={timeSlots} value={form.appointment_time} onChange={(v) => setForm({ ...form, appointment_time: v })} className="w-full" />
          </FormField>
          <FormField label="End Time" required>
            <SelectPicker data={timeSlots} value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} className="w-full" />
          </FormField>
          <FormField label="Reason" required className="md:col-span-2">
            <Input value={form.reason || ''} onChange={(v) => setForm({ ...form, reason: v })} />
          </FormField>
          <FormField label="Notes" className="md:col-span-2">
            <Input as="textarea" rows={3} value={form.notes || ''} onChange={(v) => setForm({ ...form, notes: v })} />
          </FormField>
        </div>
        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Update</Button>
          <Button appearance="default" onClick={() => navigate('/appointments')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      {children}
    </div>
  );
}
