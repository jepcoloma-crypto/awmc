import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, DatePicker, Notification, useToaster } from 'rsuite';
import { useAuth } from '@/contexts/AuthContext';
import { toLocalDateString } from '@/lib/utils';
import type { Patient, Doctor } from '@/types';

export default function AppointmentAdd() {
  const navigate = useNavigate();
  const toaster = useToaster();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    patient_id: null as number | null,
    doctor_id: null as number | null,
    appointment_date: '',
    appointment_time: '',
    end_time: '',
    status: 'Scheduled',
    reason: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const isDoctor = user?.role === 'Medical Practitioner';

  useEffect(() => {
    apiClient.get('/patients').then((r) => setPatients(r.data.data));
    apiClient.get('/doctors').then((r) => setDoctors(r.data.data));
  }, []);

  useEffect(() => {
    if (isDoctor && user?.doctor_id) {
      setForm((f) => ({ ...f, doctor_id: user.doctor_id }));
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.patient_id || !form.appointment_date || !form.appointment_time) {
      toaster.push(<Notification type="error" header="Error">Please fill in all required fields</Notification>, { placement: 'topEnd' });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/appointments', form);
      toaster.push(<Notification type="success" header="Success">Appointment created</Notification>, { placement: 'topEnd' });
      navigate('/appointments');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to create appointment';
      toaster.push(<Notification type="error" header="Error">{msg}</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  const timeSlots: { label: string; value: string }[] = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 30) {
      const val = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      timeSlots.push({ label: val, value: val });
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Schedule Appointment</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Patient" required>
            <SelectPicker
              data={patients.map((p) => ({ label: `${p.first_name} ${p.last_name} (${p.patient_id})`, value: p.id }))}
              value={form.patient_id as any}
              onChange={(v) => setForm({ ...form, patient_id: v as any })}
              className="w-full"
              searchable
            />
          </FormField>

          <FormField label="Doctor">
            <SelectPicker
              data={doctors.filter((d) => d.status === 'Active').map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name} - ${d.specialization}`, value: d.id }))}
              value={form.doctor_id as any}
              onChange={(v) => setForm({ ...form, doctor_id: v as any })}
              className="w-full"
              disabled={isDoctor}
              cleanable
            />
          </FormField>

          <FormField label="Date" required>
            <DatePicker
              className="w-full"
              value={form.appointment_date ? new Date(form.appointment_date) : null}
              onChange={(v) => setForm({ ...form, appointment_date: v ? toLocalDateString(v) : '' })}
              oneTap
            />
          </FormField>

          <FormField label="Status">
            <SelectPicker
              data={[
                { label: 'Scheduled', value: 'Scheduled' },
                { label: 'Confirmed', value: 'Confirmed' },
              ]}
              value={form.status as any}
              onChange={(v) => setForm({ ...form, status: v as any })}
              className="w-full"
              searchable={false}
            />
          </FormField>

          <FormField label="Start Time" required>
            <SelectPicker data={timeSlots} value={form.appointment_time} onChange={(v) => setForm({ ...form, appointment_time: v ?? '' })} className="w-full" searchable />
          </FormField>

          <FormField label="End Time" required>
            <SelectPicker data={timeSlots} value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v ?? '' })} className="w-full" searchable />
          </FormField>

          <FormField label="Reason" required className="md:col-span-2">
            <Input value={form.reason} onChange={(v) => setForm({ ...form, reason: v })} required />
          </FormField>

          <FormField label="Notes" className="md:col-span-2">
            <Input as="textarea" rows={3} value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </FormField>
        </div>

        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Create Appointment</Button>
          <Button appearance="default" onClick={() => navigate('/appointments')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
