import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, Modal, Input, SelectPicker, DatePicker, Notification, useToaster } from 'rsuite';
import { calculateAge, formatDate, formatCurrency } from '@/lib/utils';
import type { Patient, PatientProcedure, ProcedureType } from '@/types';

const { Column, Cell } = Table;

export default function PatientView() {
  const { id } = useParams();
  const toaster = useToaster();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [procedures, setProcedures] = useState<PatientProcedure[]>([]);
  const [procedureTypes, setProcedureTypes] = useState<ProcedureType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddProcedure, setShowAddProcedure] = useState(false);
  const [procForm, setProcForm] = useState({ procedure_type_id: '', procedure_date: '', notes: '', fee: 0, doctor_id: 1 });

  useEffect(() => {
    loadPatient();
    apiClient.get('/procedure-types').then((r) => setProcedureTypes(r.data.data));
  }, [id]);

  const loadPatient = async () => {
    try {
      const res = await apiClient.get(`/patients/${id}`);
      setPatient(res.data);
      setProcedures(res.data.procedures || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProcedure = async () => {
    try {
      const procType = procedureTypes.find((pt) => pt.id === Number(procForm.procedure_type_id));
      await apiClient.post(`/patients/${id}/procedures`, {
        ...procForm,
        procedure_type_id: Number(procForm.procedure_type_id),
        fee: procType?.price || 0,
      });
      toaster.push(<Notification type="success" header="Success">Procedure added</Notification>, { placement: 'topEnd' });
      setShowAddProcedure(false);
      loadPatient();
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to add procedure</Notification>, { placement: 'topEnd' });
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading...</div>;
  if (!patient) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Patient not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Patient Profile</h2>
        <div className="flex gap-2">
          <Link to={`/patients/${id}/edit`}>
            <Button appearance="primary">Edit</Button>
          </Link>
          <Link to="/patients"><Button appearance="default">Back</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#e8f5e9] dark:bg-[#0b6e4f]/30 flex items-center justify-center text-3xl text-[#0b6e4f] dark:text-[#2ec4b6] font-bold mb-3">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{patient.first_name} {patient.last_name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{patient.patient_id}</p>
            <Tag color={patient.status === 'Active' ? 'green' : 'red'} className="mt-2">{patient.status}</Tag>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Personal Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Date of Birth" value={formatDate(patient.date_of_birth, 'long')} />
            <InfoRow label="Age" value={String(calculateAge(patient.date_of_birth))} />
            <InfoRow label="Gender" value={patient.gender} />
            <InfoRow label="Blood Type" value={patient.blood_type || '—'} />
            <InfoRow label="Phone" value={patient.phone} />
            <InfoRow label="Email" value={patient.email || '—'} />
            <InfoRow label="Address" value={patient.address || '—'} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Medical History</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{patient.medical_history || 'No medical history recorded'}</p>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4 mb-3">Allergies</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{patient.allergies || 'No allergies recorded'}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Emergency Contact</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">{patient.emergency_contact_name || 'Not set'}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{patient.emergency_contact_phone || 'Not set'}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Procedures</h4>
          <Button appearance="primary" size="sm" onClick={() => setShowAddProcedure(true)}>+ Add Procedure</Button>
        </div>
        <Table data={procedures} autoHeight rowHeight={48}>
          <Column width={100}>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Cell>{(rowData: PatientProcedure) => formatDate(rowData.procedure_date)}</Cell>
          </Column>
          <Column width={160}>
            <Table.HeaderCell>Procedure</Table.HeaderCell>
            <Cell>{(rowData: PatientProcedure) => procedureTypes.find((pt) => pt.id === rowData.procedure_type_id)?.name || 'Unknown'}</Cell>
          </Column>
          <Column width={200} flexGrow={1}>
            <Table.HeaderCell>Notes</Table.HeaderCell>
            <Cell>{(rowData: PatientProcedure) => rowData.notes}</Cell>
          </Column>
          <Column width={100}>
            <Table.HeaderCell>Fee</Table.HeaderCell>
            <Cell>{(rowData: PatientProcedure) => formatCurrency(rowData.fee)}</Cell>
          </Column>
        </Table>
      </div>

      <Modal open={showAddProcedure} onClose={() => setShowAddProcedure(false)}>
        <Modal.Header>
          <Modal.Title>Add Procedure</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Procedure Type</label>
              <SelectPicker
                data={procedureTypes.map((pt) => ({ label: `${pt.name} (${formatCurrency(pt.price)})`, value: pt.id }))}
                value={procForm.procedure_type_id as any}
                onChange={(v) => setProcForm({ ...procForm, procedure_type_id: v as any, fee: procedureTypes.find((pt) => pt.id === v)?.price || 0 })}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <DatePicker className="w-full" value={procForm.procedure_date ? new Date(procForm.procedure_date) : null} onChange={(v) => setProcForm({ ...procForm, procedure_date: v ? v.toISOString().split('T')[0] : '' })} oneTap />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input as="textarea" rows={3} value={procForm.notes} onChange={(v) => setProcForm({ ...procForm, notes: v })} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" onClick={handleAddProcedure}>Add</Button>
          <Button appearance="default" onClick={() => setShowAddProcedure(false)}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-gray-800 dark:text-gray-200 font-medium">{value}</p>
    </div>
  );
}
