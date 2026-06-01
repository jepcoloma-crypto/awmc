import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';
import { Table, Tag, Button, SelectPicker, Modal, Notification, useToaster } from 'rsuite';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventClickArg } from '@fullcalendar/core';
import type { Appointment } from '@/types';

const { Column, Cell } = Table;

const statusColors: Record<string, string> = {
  Scheduled: '#0d6efd',
  Confirmed: '#0dcaf0',
  'In Progress': '#ffc107',
  Completed: '#198754',
  Cancelled: '#dc3545',
  'No Show': '#ffc107',
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const toaster = useToaster();
  const calendarRef = useRef<FullCalendar>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<Appointment | null>(null);
  const [stats, setStats] = useState({ scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0 });

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      const res = await apiClient.get('/appointments');
      const data = res.data.data;
      setAppointments(data);
      const s = { scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0 };
      data.forEach((a: Appointment) => {
        const map: Record<string, keyof typeof s> = { Scheduled: 'scheduled', Confirmed: 'confirmed', Completed: 'completed', Cancelled: 'cancelled', 'No Show': 'noShow', 'In Progress': 'confirmed' };
        const k = map[a.status];
        if (k) s[k]++;
      });
      setStats(s);
    } finally {
      setLoading(false);
    }
  };

  const events = appointments
    .filter((a) => !statusFilter || a.status === statusFilter)
    .map((a) => ({
      id: String(a.id),
      title: `${a.patient_name} - ${a.reason}`,
      start: `${a.appointment_date}T${a.appointment_time}`,
      end: `${a.appointment_date}T${a.end_time}`,
      backgroundColor: statusColors[a.status] || '#3b82f6',
      borderColor: statusColors[a.status] || '#3b82f6',
      textColor: '#fff',
      extendedProps: a,
    }));

  const handleEventClick = (info: EventClickArg) => {
    const appt = appointments.find((a) => String(a.id) === info.event.id);
    if (appt) setViewModal(appt);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this appointment?')) return;
    try {
      await apiClient.delete(`/appointments/${id}`);
      toaster.push(<Notification type="success" header="Deleted">Appointment deleted</Notification>, { placement: 'topEnd' });
      setViewModal(null);
      loadAppointments();
    } catch {
      toaster.push(<Notification type="error" header="Error">Failed to delete</Notification>, { placement: 'topEnd' });
    }
  };

  const statCards = [
    { label: 'Scheduled', count: stats.scheduled, color: 'blue' },
    { label: 'Confirmed', count: stats.confirmed, color: 'teal' },
    { label: 'Completed', count: stats.completed, color: 'green' },
    { label: 'Cancelled', count: stats.cancelled, color: 'rose' },
    { label: 'No Show', count: stats.noShow, color: 'purple' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 tracking-tight">Appointments</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Schedule and manage patient appointments</p>
        </div>
        <Button appearance="primary" onClick={() => navigate('/appointments/add')}>+ New Appointment</Button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-${s.color} rounded-xl border px-4 py-3`}>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{s.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="wellness-card p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          locale="en"
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        />
      </div>

      <div className="wellness-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-title">Appointment List</p>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">All Appointments</h3>
          </div>
          <SelectPicker
            data={[
              { label: 'All Status', value: '' },
              { label: 'Scheduled', value: 'Scheduled' },
              { label: 'Confirmed', value: 'Confirmed' },
              { label: 'In Progress', value: 'In Progress' },
              { label: 'Completed', value: 'Completed' },
              { label: 'Cancelled', value: 'Cancelled' },
              { label: 'No Show', value: 'No Show' },
            ]}
            value={statusFilter || ''}
            onChange={(v) => setStatusFilter(v || null)}
            className="w-40"
            cleanable={false}
          />
        </div>
        <Table data={appointments} loading={loading} autoHeight rowHeight={52}>
          <Column width={100}><Table.HeaderCell>Date</Table.HeaderCell><Cell>{(r: Appointment) => r.appointment_date}</Cell></Column>
          <Column width={90}><Table.HeaderCell>Time</Table.HeaderCell><Cell>{(r: Appointment) => r.appointment_time}</Cell></Column>
          <Column width={180}><Table.HeaderCell>Patient</Table.HeaderCell><Cell>{(r: Appointment) => <span className="font-medium">{r.patient_name}</span>}</Cell></Column>
          <Column width={180}><Table.HeaderCell>Doctor</Table.HeaderCell><Cell>{(r: Appointment) => r.doctor_name}</Cell></Column>
          <Column width={160} flexGrow={1}><Table.HeaderCell>Reason</Table.HeaderCell><Cell>{(r: Appointment) => r.reason}</Cell></Column>
          <Column width={110}><Table.HeaderCell>Status</Table.HeaderCell><Cell>{(r: Appointment) => (
            <Tag color={
              r.status === 'Completed' ? 'green' :
              r.status === 'Scheduled' ? 'blue' :
              r.status === 'Confirmed' ? 'cyan' :
              r.status === 'In Progress' ? 'orange' :
              r.status === 'Cancelled' ? 'red' : 'violet'
            }>{r.status}</Tag>
          )}</Cell></Column>
          <Column width={100}><Table.HeaderCell>Actions</Table.HeaderCell>
            <Cell>{(r: Appointment) => (
              <div className="flex gap-1">
                <Button size="sm" appearance="link" onClick={(e) => { e.stopPropagation(); setViewModal(r); }}>View</Button>
                <Button size="sm" appearance="link" onClick={(e) => { e.stopPropagation(); navigate(`/appointments/${r.id}/edit`); }}>Edit</Button>
              </div>
            )}</Cell>
          </Column>
        </Table>
      </div>

      <Modal open={!!viewModal} onClose={() => setViewModal(null)} size="sm">
        <Modal.Header><Modal.Title>Appointment Details</Modal.Title></Modal.Header>
        <Modal.Body>
          {viewModal && (
            <div className="space-y-3 text-sm">
              <DetailRow label="Patient" value={viewModal.patient_name} />
              <DetailRow label="Doctor" value={viewModal.doctor_name} />
              <DetailRow label="Date" value={viewModal.appointment_date} />
              <DetailRow label="Time" value={`${viewModal.appointment_time} - ${viewModal.end_time}`} />
              <DetailRow label="Status" value={viewModal.status} />
              <DetailRow label="Reason" value={viewModal.reason} />
              {viewModal.notes && <DetailRow label="Notes" value={viewModal.notes} />}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {viewModal && (
            <Button appearance="default" color="red" onClick={() => handleDelete(viewModal.id)}>Delete</Button>
          )}
          <Button onClick={() => setViewModal(null)} appearance="primary">Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return value ? (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-600 dark:text-gray-300">{label}:</span>
      <span className="font-semibold text-gray-900 dark:text-gray-50">{value}</span>
    </div>
  ) : null;
}
