import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, Notification, useToaster } from 'rsuite';

export default function DoctorAdd() {
  const navigate = useNavigate();
  const toaster = useToaster();
  const [form, setForm] = useState({ first_name: '', last_name: '', specialization: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/doctors', form);
      toaster.push(<Notification type="success" header="Success">Doctor registered</Notification>, { placement: 'topEnd' });
      navigate('/doctors');
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to register doctor</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Register Doctor</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <Input value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} required />
          </FormField>
          <FormField label="Last Name" required>
            <Input value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} required />
          </FormField>
          <FormField label="Specialization" required>
            <Input value={form.specialization} onChange={(v) => setForm({ ...form, specialization: v })} required placeholder="e.g. Cardiology, Pediatrics" />
          </FormField>
          <FormField label="Phone" required>
            <Input type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          </FormField>
        </div>
        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Save Doctor</Button>
          <Button appearance="default" onClick={() => navigate('/doctors')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
