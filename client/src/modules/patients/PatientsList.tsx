import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Input, SelectPicker } from 'rsuite';
import { useAuth } from '@/contexts/AuthContext';
import { calculateAge } from '@/lib/utils';
import { canAccess } from '@/lib/permissions';
import type { Patient, Doctor } from '@/types';

const { Column, Cell } = Table;

export default function PatientsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Patients</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Manage patient records and medical history</p>
        </div>
        {canAccess('patients', user) && (
          <Button appearance="primary" onClick={() => navigate('/patients/add')}>
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
        <Table data={patients} loading={loading} autoHeight rowHeight={52} onRowClick={(rowData) => navigate(`/patients/${rowData.id}`)}>
          <Column width={110}>
            <Table.HeaderCell>Patient ID</Table.HeaderCell>
            <Cell>{(rowData: Patient) => (
              <span className="font-mono text-xs font-medium text-gray-700 dark:text-gray-300">{rowData.patient_id}</span>
            )}</Cell>
          </Column>
          <Column width={200}>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Cell>{(rowData: Patient) => (
              <span className="font-medium text-gray-900 dark:text-gray-100">{rowData.first_name} {rowData.last_name}</span>
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
        </Table>
      </div>
    </div>
  );
}
