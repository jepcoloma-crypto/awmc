import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Button, Input, SelectPicker, DatePicker, TagPicker, Notification, useToaster } from 'rsuite';
import { toLocalDateString } from '@/lib/utils';
import type { Doctor } from '@/types';

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

export default function PatientAdd() {
  const navigate = useNavigate();
  const toaster = useToaster();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({
    first_name: '', last_name: '', date_of_birth: '', gender: '' as string,
    phone: '', email: '', address: '', blood_type: '',
    medical_history: '', allergies: '', emergency_contact_name: '', emergency_contact_phone: '',
    doctor_ids: [] as number[],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/doctors').then((r) => setDoctors(r.data.data));
  }, []);

  const handleChange = (key: string, value: any) => setForm({ ...form, [key]: value });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/patients', form);
      toaster.push(<Notification type="success" header="Success">Patient registered successfully</Notification>, { placement: 'topEnd' });
      navigate('/patients');
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to register patient</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Register New Patient</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Fill in the patient's details below</p>
      </div>

      <form onSubmit={handleSubmit} className="wellness-card p-6 space-y-6">
        <div>
          <h4 className="form-section-title">Personal Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input value={form.first_name} onChange={(v) => handleChange('first_name', v)} required />
            </FormField>
            <FormField label="Last Name" required>
              <Input value={form.last_name} onChange={(v) => handleChange('last_name', v)} required />
            </FormField>
            <FormField label="Date of Birth" required>
              <DatePicker className="w-full" value={form.date_of_birth ? new Date(form.date_of_birth) : null} onChange={(v) => handleChange('date_of_birth', v ? toLocalDateString(v) : '')} placement="auto" oneTap />
            </FormField>
            <FormField label="Gender" required>
              <SelectPicker data={genderOptions} value={form.gender as any} onChange={(v) => handleChange('gender', v)} className="w-full" searchable={false} />
            </FormField>
            <FormField label="Phone" required>
              <Input type="tel" value={form.phone} onChange={(v) => handleChange('phone', v)} required />
            </FormField>
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(v) => handleChange('email', v)} />
            </FormField>
            <FormField label="Blood Type">
              <SelectPicker data={bloodTypeOptions} value={form.blood_type as any} onChange={(v) => handleChange('blood_type', v)} className="w-full" searchable={false} />
            </FormField>
            <FormField label="Address">
              <Input as="textarea" rows={2} value={form.address} onChange={(v) => handleChange('address', v)} />
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="form-section-title">Medical Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Medical History">
              <Input as="textarea" rows={3} value={form.medical_history} onChange={(v) => handleChange('medical_history', v)} />
            </FormField>
            <FormField label="Allergies">
              <Input as="textarea" rows={3} value={form.allergies} onChange={(v) => handleChange('allergies', v)} />
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="form-section-title">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Contact Name">
              <Input value={form.emergency_contact_name} onChange={(v) => handleChange('emergency_contact_name', v)} />
            </FormField>
            <FormField label="Contact Phone">
              <Input type="tel" value={form.emergency_contact_phone} onChange={(v) => handleChange('emergency_contact_phone', v)} />
            </FormField>
          </div>
        </div>

        <div>
          <h4 className="form-section-title">Assigned Doctors</h4>
          <TagPicker
            data={doctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))}
            value={form.doctor_ids}
            onChange={(v: any) => handleChange('doctor_ids', v)}
            style={{ width: '100%' }}
            placeholder="Select doctors..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button appearance="primary" type="submit" loading={saving}>Save Patient</Button>
          <Button appearance="default" onClick={() => navigate('/patients')}>Cancel</Button>
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
