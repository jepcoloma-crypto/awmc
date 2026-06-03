import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Input, SelectPicker, IconButton, Notification, useToaster } from 'rsuite';
import { CheckRound, Close } from '@rsuite/icons';
import { useAuth } from '@/contexts/AuthContext';
import { calculateAge } from '@/lib/utils';
import { canAccess } from '@/lib/permissions';
import type { Patient, Doctor } from '@/types';

const { Column, Cell } = Table;

export default function PatientsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toaster = useToaster();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState<number | null>(null);

  useEffect(() => {
    loadPatients();
    apiClient.get('/doctors').then((r) => setDoctors(r.data.data));
  }, [search, doctorFilter]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (doctorFilter) params.doctor_id = doctorFilter;
      const res = await apiClient.get('/patients', { params });
      setPatients(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (patient: Patient) => {
    const newStatus = patient.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const res = await apiClient.put(`/patients/${patient.id}`, { status: newStatus });
      setPatients(patients.map((p) => p.id === patient.id ? { ...p, ...res.data } : p));
      toaster.push(<Notification type="success" header="Updated">Patient {newStatus === 'Active' ? 'activated' : 'deactivated'}</Notification>, { placement: 'topEnd' });
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to update patient status</Notification>, { placement: 'topEnd' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2>Patients</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">Manage patient records and medical history</p>
        </div>
        {canAccess('patients', user) && (
          <Button className="btn-wellness" onClick={() => navigate('/patients/add')}>
            + Add Patient
          </Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search by name, ID, or phone..."
          value={search}
          onChange={setSearch}
          style={{ width: 300 }}
        />
        <SelectPicker
          data={doctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))}
          placeholder="Filter by doctor"
          style={{ width: 220 }}
          cleanable
          onChange={(v) => setDoctorFilter(v)}
        />
      </div>

      <div className="wellness-card">
        <Table data={patients} loading={loading} autoHeight rowHeight={52}>
          <Column width={110}>
            <Table.HeaderCell>Patient ID</Table.HeaderCell>
            <Cell>{(rowData: Patient) => (
              <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{rowData.patient_id}</span>
            )}</Cell>
          </Column>
          <Column width={200}>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Cell>{(rowData: Patient) => (
              <span className="font-medium text-[#0b6e4f] dark:text-[#2ec4b6] cursor-pointer hover:underline" onClick={() => navigate(`/patients/${rowData.id}`)}>{rowData.first_name} {rowData.last_name}</span>
            )}</Cell>
          </Column>
          <Column width={90}>
            <Table.HeaderCell>Gender</Table.HeaderCell>
            <Cell>{(rowData: Patient) => rowData.gender}</Cell>
          </Column>
          <Column width={80}>
            <Table.HeaderCell>Age</Table.HeaderCell>
            <Cell>{(rowData: Patient) => calculateAge(rowData.date_of_birth)}</Cell>
          </Column>
          <Column width={140}>
            <Table.HeaderCell>Contact</Table.HeaderCell>
            <Cell>{(rowData: Patient) => rowData.phone}</Cell>
          </Column>
          <Column width={100}>
            <Table.HeaderCell>Blood Type</Table.HeaderCell>
            <Cell>{(rowData: Patient) => rowData.blood_type || '—'}</Cell>
          </Column>
          <Column width={100}>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Cell>{(rowData: Patient) => (
              <Tag color={rowData.status === 'Active' ? 'green' : 'red'}>{rowData.status}</Tag>
            )}</Cell>
          </Column>
          <Column width={180} flexGrow={1}>
            <Table.HeaderCell>Doctors</Table.HeaderCell>
            <Cell>{(rowData: Patient) => (
              <div className="flex gap-1 flex-wrap">
                {rowData.doctors && rowData.doctors.length > 0
                  ? rowData.doctors.map((d) => <Tag key={d.id} style={{ background: '#e8f5e9', color: '#0b6e4f', fontWeight: 500, fontSize: 12 }}>Dr. {d.first_name} {d.last_name}</Tag>)
                  : <span className="text-gray-400">—</span>}
              </div>
            )}</Cell>
          </Column>
          {user?.role !== 'Medical Practitioner' && (
            <Column width={120} align="center">
              <Table.HeaderCell>Actions</Table.HeaderCell>
              <Cell>{(rowData: Patient) => (
                <div className="flex gap-1 justify-center">
                  <IconButton size="sm" appearance="subtle" icon={rowData.status !== 'Active' ? <CheckRound style={{ color: '#0b6e4f' }} /> : <Close style={{ color: '#e53e3e' }} />} onClick={() => toggleStatus(rowData)} />
                </div>
              )}</Cell>
            </Column>
          )}
        </Table>
      </div>
    </div>
  );
}
