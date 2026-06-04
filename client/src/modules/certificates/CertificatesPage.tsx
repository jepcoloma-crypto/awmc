import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Modal, SelectPicker, Input, DatePicker, Notification, useToaster } from 'rsuite';
import { formatDate, formatCurrency, toLocalDateString } from '@/lib/utils';

const { Column, Cell } = Table;

export default function CertificatesPage() {
  const toaster = useToaster();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patient_id: null as number | null,
    doctor_id: null as number | null,
    diagnosis: '',
    rest_from: null as Date | null,
    rest_to: null as Date | null,
    restrictions: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      apiClient.get('/certificates'),
      apiClient.get('/patients'),
      apiClient.get('/doctors'),
    ]).then(([cRes, pRes, dRes]) => {
      setCertificates(cRes.data.data);
      setPatients(pRes.data.data);
      setDoctors(dRes.data.data);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!form.patient_id || !form.doctor_id || !form.diagnosis) return;
    setSaving(true);
    try {
      await apiClient.post('/certificates', {
        ...form,
        rest_from: form.rest_from ? toLocalDateString(form.rest_from) : null,
        rest_to: form.rest_to ? toLocalDateString(form.rest_to) : null,
      });
      toaster.push(<Notification type="success" header="Created">Medical certificate issued</Notification>, { placement: 'topEnd' });
      setShowCreate(false);
      setForm({ patient_id: null, doctor_id: null, diagnosis: '', rest_from: null, rest_to: null, restrictions: '', notes: '' });
      const res = await apiClient.get('/certificates');
      setCertificates(res.data.data);
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to create certificate</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Medical Certificates</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Issue and manage medical certificates</p>
        </div>
        <Button appearance="primary" onClick={() => setShowCreate(true)}>+ New Certificate</Button>
      </div>

      <div className="wellness-card p-4 table-responsive">
        <Table data={certificates} loading={loading} autoHeight rowHeight={56}>
          <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: any) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
          <Column width={160}><Table.HeaderCell>Doctor</Table.HeaderCell><Cell>{(r: any) => r.doctor_name}</Cell></Column>
          <Column width={300} flexGrow={1}><Table.HeaderCell>Diagnosis</Table.HeaderCell><Cell>{(r: any) => <div className="truncate max-w-sm">{r.diagnosis}</div>}</Cell></Column>
          <Column width={130}><Table.HeaderCell>Rest Period</Table.HeaderCell><Cell>{(r: any) => r.rest_from && r.rest_to ? `${formatDate(r.rest_from)} – ${formatDate(r.rest_to)}` : '—'}</Cell></Column>
          <Column width={160}><Table.HeaderCell>Issued By</Table.HeaderCell><Cell>{(r: any) => <span className="text-gray-700 dark:text-gray-300">{r.issued_by_name || '—'}</span>}</Cell></Column>
          <Column width={140}><Table.HeaderCell>Issued At</Table.HeaderCell><Cell>{(r: any) => formatDate(r.issued_at)}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Print</Table.HeaderCell><Cell>{(r: any) => (
            <Button size="sm" appearance="link" onClick={() => window.open(`/certificates/${r.id}`, '_blank')}>View</Button>
          )}</Cell></Column>
        </Table>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} size="md">
        <Modal.Header><Modal.Title>Issue Medical Certificate</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Patient">
                <SelectPicker data={patients.map((p: any) => ({ label: `${p.first_name} ${p.last_name}`, value: p.id }))} value={form.patient_id as any} onChange={(v) => setForm({ ...form, patient_id: v as any })} className="w-full" searchable />
              </FormField>
              <FormField label="Doctor">
                <SelectPicker data={doctors.map((d: any) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))} value={form.doctor_id as any} onChange={(v) => setForm({ ...form, doctor_id: v as any })} className="w-full" searchable />
              </FormField>
            </div>
            <FormField label="Diagnosis / Findings">
              <Input as="textarea" rows={3} value={form.diagnosis} onChange={(v) => setForm({ ...form, diagnosis: v })} />
            </FormField>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Rest From">
                <DatePicker className="w-full" value={form.rest_from} onChange={(v) => setForm({ ...form, rest_from: v })} oneTap />
              </FormField>
              <FormField label="Rest To">
                <DatePicker className="w-full" value={form.rest_to} onChange={(v) => setForm({ ...form, rest_to: v })} oneTap />
              </FormField>
            </div>
            <FormField label="Restrictions / Recommendations">
              <Input as="textarea" rows={2} value={form.restrictions} onChange={(v) => setForm({ ...form, restrictions: v })} />
            </FormField>
            <FormField label="Additional Notes">
              <Input as="textarea" rows={2} value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            </FormField>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={handleCreate} loading={saving}>Issue Certificate</Button>
          <Button appearance="default" onClick={() => setShowCreate(false)}>Cancel</Button>
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
