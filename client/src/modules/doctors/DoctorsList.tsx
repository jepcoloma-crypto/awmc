import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Notification, useToaster } from 'rsuite';
import { useAuth } from '@/contexts/AuthContext';
import { canAccess } from '@/lib/permissions';
import type { Doctor } from '@/types';

const { Column, Cell } = Table;

export default function DoctorsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toaster = useToaster();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/doctors').then((r) => { setDoctors(r.data.data); setLoading(false); });
  }, []);

  const toggleStatus = async (doctor: Doctor) => {
    const newStatus = doctor.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiClient.put(`/doctors/${doctor.id}`, { status: newStatus });
      toaster.push(<Notification type="success" header="Updated">Doctor status changed to {newStatus}</Notification>, { placement: 'topEnd' });
      setDoctors(doctors.map((d) => d.id === doctor.id ? { ...d, status: newStatus } : d));
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to toggle status</Notification>, { placement: 'topEnd' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Doctors</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Manage physician records and availability</p>
        </div>
        {canAccess('doctors', user) && (
          <Button appearance="primary" onClick={() => navigate('/doctors/add')}>+ Add Doctor</Button>
        )}
      </div>

      <div className="wellness-card">
        <Table data={doctors} loading={loading} autoHeight rowHeight={52}>
          <Column width={50}><Table.HeaderCell>#</Table.HeaderCell><Cell>{(r: Doctor, idx?: number) => (idx ?? 0) + 1}</Cell></Column>
          <Column width={220}><Table.HeaderCell>Name</Table.HeaderCell><Cell>{(r: Doctor) => <span className="font-medium text-gray-900 dark:text-gray-100">Dr. {r.first_name} {r.last_name}</span>}</Cell></Column>
          <Column width={200}><Table.HeaderCell>Specialization</Table.HeaderCell><Cell>{(r: Doctor) => r.specialization}</Cell></Column>
          <Column width={140}><Table.HeaderCell>Contact</Table.HeaderCell><Cell>{(r: Doctor) => r.phone}</Cell></Column>
          <Column width={200}><Table.HeaderCell>Email</Table.HeaderCell><Cell>{(r: Doctor) => r.email}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Doctor) => <Tag color={r.status === 'Active' ? 'green' : 'red'}>{r.status}</Tag>}</Cell></Column>
          <Column width={120}><Table.HeaderCell>Actions</Table.HeaderCell><Cell>{(r: Doctor) => (
            <Button size="sm" appearance={r.status === 'Active' ? 'default' : 'primary'} onClick={() => toggleStatus(r)}>
              {r.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Button>
          )}</Cell></Column>
        </Table>
      </div>
    </div>
  );
}
