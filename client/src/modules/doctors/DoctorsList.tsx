import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, IconButton, Modal, Input, Notification, useToaster } from 'rsuite';
import { EditRound, CheckRound, Close, Trash } from '@rsuite/icons';
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
  const [editModal, setEditModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', specialization: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Doctor | null>(null);

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

  const openEdit = (doctor: Doctor) => {
    setEditDoctor(doctor);
    setEditForm({ first_name: doctor.first_name, last_name: doctor.last_name, specialization: doctor.specialization, phone: doctor.phone, email: doctor.email || '' });
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editDoctor) return;
    setSaving(true);
    try {
      const res = await apiClient.put(`/doctors/${editDoctor.id}`, editForm);
      setDoctors(doctors.map((d) => d.id === editDoctor.id ? { ...d, ...res.data } : d));
      toaster.push(<Notification type="success" header="Updated">Doctor updated</Notification>, { placement: 'topEnd' });
      setEditModal(false);
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to update doctor</Notification>, { placement: 'topEnd' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiClient.delete(`/doctors/${deleteTarget.id}`);
      toaster.push(<Notification type="success" header="Deleted">Doctor removed</Notification>, { placement: 'topEnd' });
      setDoctors(doctors.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to delete doctor</Notification>, { placement: 'topEnd' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2>Doctors</h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-1">Manage physician records and availability</p>
        </div>
        {canAccess('doctors', user) && (
          <Button className="btn-wellness" onClick={() => navigate('/doctors/add')}>+ Add Doctor</Button>
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
          <Column width={150} align="center"><Table.HeaderCell>Actions</Table.HeaderCell><Cell>{(r: Doctor) => (
            <div className="flex gap-1 justify-center">
              <IconButton size="sm" appearance="subtle" icon={<EditRound style={{ color: '#0b6e4f' }} />} onClick={() => openEdit(r)} />
              <IconButton size="sm" appearance="subtle" icon={r.status !== 'Active' ? <CheckRound style={{ color: '#0b6e4f' }} /> : <Close style={{ color: '#e53e3e' }} />} onClick={() => toggleStatus(r)} />
              <IconButton size="sm" appearance="subtle" icon={<Trash style={{ color: '#e53e3e' }} />} onClick={() => setDeleteTarget(r)} />
            </div>
          )}</Cell></Column>
        </Table>
      </div>

      <Modal open={editModal} onClose={() => setEditModal(false)}>
        <Modal.Header><Modal.Title>Edit Doctor</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">First Name</label><Input value={editForm.first_name} onChange={(v) => setEditForm({ ...editForm, first_name: v })} /></div>
              <div><label className="block text-sm font-medium mb-1">Last Name</label><Input value={editForm.last_name} onChange={(v) => setEditForm({ ...editForm, last_name: v })} /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Specialization</label><Input value={editForm.specialization} onChange={(v) => setEditForm({ ...editForm, specialization: v })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Phone</label><Input value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} /></div>
              <div><label className="block text-sm font-medium mb-1">Email</label><Input value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} /></div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-wellness" onClick={handleSave} loading={saving}>Save Changes</Button>
          <Button appearance="subtle" onClick={() => setEditModal(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="xs">
        <Modal.Header><Modal.Title>Delete Doctor</Modal.Title></Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete <strong>Dr. {deleteTarget?.first_name} {deleteTarget?.last_name}</strong>? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button className="btn-wellness" appearance="primary" onClick={handleDelete}>Delete</Button>
          <Button appearance="subtle" onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
