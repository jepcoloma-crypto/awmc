import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, DatePicker, TagPicker, Notification, useToaster } from 'rsuite';
import { toLocalDateString } from '@/lib/utils';
import type { Patient, Doctor } from '@/types';

const genderOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

const bloodTypeOptions = [
  { label: 'A+', value: 'A+' }, { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' }, { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' }, { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' }, { label: 'O-', value: 'O-' },
];

export default function PatientEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toaster = useToaster();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/doctors').then((r) => setDoctors(r.data.data));
    apiClient.get(`/patients/${id}`).then((res) => {
      setForm({ ...res.data, doctor_ids: (res.data.doctors || []).map((d: any) => d.id) });
      setLoading(false);
    });
  }, [id]);

  const handleChange = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put(`/patients/${id}`, form);
      toaster.push(<Notification type="success" header="Success">Patient updated</Notification>, { placement: 'topEnd' });
      navigate(`/patients/${id}`);
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to update patient</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Edit Patient</h2>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="First Name" required>
            <Input value={form.first_name || ''} onChange={(v) => handleChange('first_name', v)} required />
          </FormField>
          <FormField label="Last Name" required>
            <Input value={form.last_name || ''} onChange={(v) => handleChange('last_name', v)} required />
          </FormField>
          <FormField label="Date of Birth" required>
            <DatePicker className="w-full" value={form.date_of_birth ? new Date(form.date_of_birth) : null} onChange={(v) => handleChange('date_of_birth', v ? toLocalDateString(v) : '')} oneTap />
          </FormField>
          <FormField label="Gender" required>
            <SelectPicker data={genderOptions} value={form.gender as any} onChange={(v) => handleChange('gender', v)} className="w-full" searchable={false} />
          </FormField>
          <FormField label="Phone" required>
            <Input type="tel" value={form.phone || ''} onChange={(v) => handleChange('phone', v)} required />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={form.email || ''} onChange={(v) => handleChange('email', v)} />
          </FormField>
          <FormField label="Blood Type">
            <SelectPicker data={bloodTypeOptions} value={form.blood_type as any} onChange={(v) => handleChange('blood_type', v)} className="w-full" searchable={false} />
          </FormField>
          <FormField label="Address">
            <Input as="textarea" rows={2} value={form.address || ''} onChange={(v) => handleChange('address', v)} />
          </FormField>
          <FormField label="Medical History">
            <Input as="textarea" rows={3} value={form.medical_history || ''} onChange={(v) => handleChange('medical_history', v)} />
          </FormField>
          <FormField label="Allergies">
            <Input as="textarea" rows={3} value={form.allergies || ''} onChange={(v) => handleChange('allergies', v)} />
          </FormField>
          <FormField label="Emergency Contact Name">
            <Input value={form.emergency_contact_name || ''} onChange={(v) => handleChange('emergency_contact_name', v)} />
          </FormField>
          <FormField label="Emergency Contact Phone">
            <Input type="tel" value={form.emergency_contact_phone || ''} onChange={(v) => handleChange('emergency_contact_phone', v)} />
          </FormField>
        </div>

        <div>
          <h4 className="form-section-title">Assigned Doctors</h4>
          <TagPicker
            data={doctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))}
            value={form.doctor_ids || []}
            onChange={(v: any) => setForm({ ...form, doctor_ids: v })}
            style={{ width: '100%' }}
            placeholder="Select doctors..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Update Patient</Button>
          <Button appearance="default" onClick={() => navigate(`/patients/${id}`)}>Cancel</Button>
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
