import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button } from 'rsuite';
import { calculateAge, formatDate, formatDateDDMMYYYY, formatTimeHHMM } from '@/lib/utils';
import type { Patient, Appointment } from '@/types';

const { Column, Cell } = Table;

export default function PatientView() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get(`/patients/${id}`).then((res) => {
      setPatient(res.data);
      setAppointments(res.data.appointments || []);
      setLoading(false);
    });
  }, [id]);

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
            <InfoRow label="Assigned Doctors" value={patient.doctors && patient.doctors.length > 0 ? patient.doctors.map((d: any) => `Dr. ${d.first_name} ${d.last_name}`).join(', ') : '—'} />
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
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Appointment History</h4>
        </div>
        <Table data={appointments} autoHeight rowHeight={48}>
          <Column width={100}><Table.HeaderCell>Date</Table.HeaderCell><Cell>{(r: Appointment) => formatDateDDMMYYYY(r.appointment_date)}</Cell></Column>
          <Column width={80}><Table.HeaderCell>Time</Table.HeaderCell><Cell>{(r: Appointment) => formatTimeHHMM(r.appointment_time)}</Cell></Column>
          <Column width={180}><Table.HeaderCell>Doctor</Table.HeaderCell><Cell>{(r: Appointment) => r.doctor_name}</Cell></Column>
          <Column width={160} flexGrow={1}><Table.HeaderCell>Reason</Table.HeaderCell><Cell>{(r: Appointment) => r.reason}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Appointment) => (
            <Tag color={
              r.status === 'Completed' ? 'green' :
              r.status === 'Scheduled' ? 'blue' :
              r.status === 'Confirmed' ? 'cyan' :
              r.status === 'In Progress' ? 'orange' :
              r.status === 'Cancelled' ? 'red' : 'violet'
            }>{r.status}</Tag>
          )}</Cell></Column>
        </Table>
      </div>

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
