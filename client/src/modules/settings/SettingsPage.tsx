import { useEffect, useState, type FormEvent } from 'react';
import apiClient from '@/api/client';
import { Button, Input, Notification, useToaster } from 'rsuite';

export default function SettingsPage() {
  const toaster = useToaster();
  const [form, setForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/settings').then((res) => {
      setForm(res.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/settings', form);
      toaster.push(<Notification type="success" header="Success">Settings saved</Notification>, { placement: 'topEnd' });
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to save settings</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400 dark:text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Settings</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Configure clinic information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="wellness-card p-5">
          <h4 className="form-section-title">Clinic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Clinic Name">
              <Input value={form.clinic_name || ''} onChange={(v) => setForm({ ...form, clinic_name: v })} />
            </FormField>
            <FormField label="Currency">
              <Input value={form.currency || ''} onChange={(v) => setForm({ ...form, currency: v })} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.clinic_phone || ''} onChange={(v) => setForm({ ...form, clinic_phone: v })} />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.clinic_email || ''} onChange={(v) => setForm({ ...form, clinic_email: v })} />
            </FormField>
            <FormField label="Address" className="md:col-span-2">
              <Input as="textarea" rows={2} value={form.clinic_address || ''} onChange={(v) => setForm({ ...form, clinic_address: v })} />
            </FormField>
          </div>
        </div>

        <div className="wellness-card p-5">
          <h4 className="form-section-title">Appointment Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Default Duration (minutes)">
              <Input type="number" value={form.appointment_duration || '30'} onChange={(v) => setForm({ ...form, appointment_duration: v })} />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3">
          <Button appearance="primary" type="submit" loading={saving}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {children}
    </div>
  );
}
