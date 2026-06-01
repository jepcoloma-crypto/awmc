import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, Notification, useToaster } from 'rsuite';
import type { Doctor } from '@/types';

const roleOptions = [
  { label: 'Administrator', value: 'Administrator', description: 'Full access to all modules' },
  { label: 'Medical Practitioner', value: 'Medical Practitioner', description: 'Access to own patients, appointments, billing, and reports' },
  { label: 'Front Desk Staff', value: 'Front Desk Staff', description: 'Manage patients, appointments, and view reminders' },
  { label: 'Cashier', value: 'Cashier', description: 'Manage billing and view collections' },
];

export default function UserAdd() {
  const navigate = useNavigate();
  const toaster = useToaster();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    username: '', password: '', confirm_password: '',
    first_name: '', last_name: '', email: '',
    role: '' as string, doctor_id: null as number | null,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/doctors').then((r) => setDoctors(r.data.data));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toaster.push(<Notification type="error" header="Error">Passwords do not match</Notification>, { placement: 'topEnd' });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post('/users', {
        username: form.username,
        password_hash: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        role: form.role,
        doctor_id: form.doctor_id,
      });
      toaster.push(<Notification type="success" header="Success">User created</Notification>, { placement: 'topEnd' });
      navigate('/users');
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to create user</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roleOptions.find((r) => r.value === form.role);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Register New User</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Username" required>
              <Input value={form.username} onChange={(v) => setForm({ ...form, username: v })} required />
            </FormField>
            <FormField label="Role" required>
              <SelectPicker data={roleOptions.map((r) => ({ label: r.label, value: r.value }))} value={form.role as any} onChange={(v) => setForm({ ...form, role: v as any, doctor_id: null })} className="w-full" />
            </FormField>
            <FormField label="Password" required>
              <Input type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
            </FormField>
            <FormField label="Confirm Password" required>
              <Input type="password" value={form.confirm_password} onChange={(v) => setForm({ ...form, confirm_password: v })} required />
            </FormField>
          </div>
          {selectedRole && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {selectedRole.label}: {selectedRole.description}
            </p>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input value={form.first_name} onChange={(v) => setForm({ ...form, first_name: v })} required />
            </FormField>
            <FormField label="Last Name" required>
              <Input value={form.last_name} onChange={(v) => setForm({ ...form, last_name: v })} required />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            </FormField>
          </div>
        </div>

        {form.role === 'Medical Practitioner' && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Doctor Link</h4>
            <FormField label="Linked Doctor">
              <SelectPicker
                data={doctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name} - ${d.specialization}`, value: d.id }))}
                value={form.doctor_id as any}
                onChange={(v) => setForm({ ...form, doctor_id: v as any })}
                className="w-full"
              />
            </FormField>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Create User</Button>
          <Button appearance="default" onClick={() => navigate('/users')}>Cancel</Button>
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
