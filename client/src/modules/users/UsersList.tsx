import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Modal, Input, SelectPicker, Notification, useToaster } from 'rsuite';
import { useAuth } from '@/contexts/AuthContext';
import type { User, Doctor } from '@/types';

const { Column, Cell } = Table;

const roleOptions = [
  { label: 'Administrator', value: 'Administrator' },
  { label: 'Medical Practitioner', value: 'Medical Practitioner' },
  { label: 'Front Desk Staff', value: 'Front Desk Staff' },
  { label: 'Cashier', value: 'Cashier' },
];

export default function UsersList() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toaster = useToaster();
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any>(null);
  const [passwordModal, setPasswordModal] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.get('/users'), apiClient.get('/doctors')]).then(([uRes, dRes]) => {
      setUsers(uRes.data.data);
      setDoctors(dRes.data.data);
      setLoading(false);
    });
  }, []);

  const toggleStatus = async (targetUser: User) => {
    const newStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiClient.put(`/users/${targetUser.id}`, { status: newStatus });
      toaster.push(<Notification type="success" header="Updated">User status changed</Notification>, { placement: 'topEnd' });
      setUsers(users.map((u) => u.id === targetUser.id ? { ...u, status: newStatus } : u));
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to update</Notification>, { placement: 'topEnd' });
    }
  };

  const openEdit = (u: User) => setEditModal({
    id: u.id, first_name: u.first_name, last_name: u.last_name,
    email: u.email, role: u.role, doctor_id: u.doctor_id,
  });

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 4) return;
    setSavingPassword(true);
    try {
      await apiClient.put(`/users/${passwordModal.id}/password`, { password: newPassword });
      toaster.push(<Notification type="success" header="Password Reset">Password changed successfully</Notification>, { placement: 'topEnd' });
      setPasswordModal(null);
      setNewPassword('');
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to reset password</Notification>, { placement: 'topEnd' });
    } finally {
      setSavingPassword(false);
    }
  };

  const saveEdit = async () => {
    try {
      await apiClient.put(`/users/${editModal.id}`, editModal);
      toaster.push(<Notification type="success" header="Updated">User updated</Notification>, { placement: 'topEnd' });
      setEditModal(null);
      const res = await apiClient.get('/users');
      setUsers(res.data.data);
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to update</Notification>, { placement: 'topEnd' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Users</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Manage system user accounts and roles</p>
        </div>
        <Button appearance="primary" onClick={() => navigate('/users/add')}>+ Add User</Button>
      </div>

      <div className="wellness-card table-responsive">
        <Table data={users} loading={loading} autoHeight rowHeight={52}>
          <Column width={50}><Table.HeaderCell>#</Table.HeaderCell><Cell>{(r: any, idx?: number) => (idx ?? 0) + 1}</Cell></Column>
          <Column width={140}><Table.HeaderCell>Username</Table.HeaderCell><Cell>{(r: User) => <span className="font-mono text-sm">{r.username}</span>}</Cell></Column>
          <Column width={180}><Table.HeaderCell>Name</Table.HeaderCell><Cell>{(r: User) => <span className="font-medium">{r.first_name} {r.last_name}</span>}</Cell></Column>
          <Column width={220}><Table.HeaderCell>Email</Table.HeaderCell><Cell>{(r: User) => r.email}</Cell></Column>
          <Column width={160}><Table.HeaderCell>Role</Table.HeaderCell><Cell>{(r: User) => (
            <Tag color={r.role === 'Administrator' ? 'red' : r.role === 'Medical Practitioner' ? 'blue' : r.role === 'Front Desk Staff' ? 'cyan' : 'green'}>{r.role}</Tag>
          )}</Cell></Column>
          <Column width={90}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: User) => <Tag color={r.status === 'Active' ? 'green' : 'red'}>{r.status}</Tag>}</Cell></Column>
          <Column width={150}><Table.HeaderCell>Actions</Table.HeaderCell>
            <Cell>{(r: User) => (
              <div className="flex gap-1">
                <Button size="sm" appearance="link" onClick={() => openEdit(r)}>Edit</Button>
                <Button size="sm" appearance="link" color="violet" onClick={() => { setPasswordModal(r); setNewPassword(''); }}>Password</Button>
                {r.id !== currentUser?.id && (
                  <Button size="sm" appearance="link" color={r.status === 'Active' ? 'orange' : 'green'} onClick={() => toggleStatus(r)}>
                    {r.status === 'Active' ? 'Disable' : 'Enable'}
                  </Button>
                )}
              </div>
            )}</Cell>
          </Column>
        </Table>
      </div>

      <Modal open={!!passwordModal} onClose={() => setPasswordModal(null)} size="xs">
        <Modal.Header><Modal.Title>Reset Password</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            New password for <strong>{passwordModal?.first_name} {passwordModal?.last_name}</strong> ({passwordModal?.username})
          </p>
          <Input type="password" value={newPassword} onChange={setNewPassword} placeholder="Enter new password (min 4 characters)" />
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={resetPassword} loading={savingPassword} disabled={!newPassword || newPassword.length < 4}>Reset Password</Button>
          <Button appearance="default" onClick={() => setPasswordModal(null)}>Cancel</Button>
        </Modal.Footer>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} size="sm">
        <Modal.Header><Modal.Title>Edit User</Modal.Title></Modal.Header>
        <Modal.Body>
          {editModal && (
            <div className="space-y-4">
              <FormField label="First Name"><Input value={editModal.first_name} onChange={(v) => setEditModal({ ...editModal, first_name: v })} /></FormField>
              <FormField label="Last Name"><Input value={editModal.last_name} onChange={(v) => setEditModal({ ...editModal, last_name: v })} /></FormField>
              <FormField label="Email"><Input value={editModal.email} onChange={(v) => setEditModal({ ...editModal, email: v })} /></FormField>
              <FormField label="Role">
                <SelectPicker data={roleOptions} value={editModal.role} onChange={(v) => setEditModal({ ...editModal, role: v })} className="w-full" searchable={false} />
              </FormField>
              {editModal.role === 'Medical Practitioner' && (
                <FormField label="Linked Doctor">
                  <SelectPicker data={doctors.map((d) => ({ label: `Dr. ${d.first_name} ${d.last_name}`, value: d.id }))} value={editModal.doctor_id} onChange={(v) => setEditModal({ ...editModal, doctor_id: v })} className="w-full" />
                </FormField>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={saveEdit}>Save</Button>
          <Button appearance="default" onClick={() => setEditModal(null)}>Cancel</Button>
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
