import { http, HttpResponse, delay } from 'msw';
import type { Appointment, Doctor, Invoice, Payment, Reminder, User } from '@/types';
import {
  mockUsers,
  mockDoctors,
  mockPatients,
  mockAppointments,
  mockServices,
  mockInvoices,
  mockInvoiceItems,
  mockPayments,
  mockProcedureTypes,
  mockPatientProcedures,
  mockReminders,
  mockSettings,
  mockCredentials,
  getAppointmentsWithNames,
  getInvoicesWithDetails,
  adminUser,
} from './data';

const API = '/api';

export const handlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { username: string; password: string };
    await delay(500);
    const entry = mockCredentials[body.username.toLowerCase()];
    if (!entry || entry.password !== body.password) {
      return HttpResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    return HttpResponse.json({ user: entry.user, token: `mock-jwt-${entry.user.role}` });
  }),

  http.get(`${API}/auth/me`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth) return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return HttpResponse.json({ user: adminUser });
  }),

  http.get(`${API}/dashboard/stats`, async () => {
    await delay(300);
    const today = new Date().toISOString().split('T')[0];
    const todayApps = getAppointmentsWithNames().filter((a) => a.appointment_date === today);
    return HttpResponse.json({
      total_appointments_today: todayApps.length,
      completed_appointments: todayApps.filter((a) => a.status === 'Completed').length,
      cancelled_appointments: todayApps.filter((a) => a.status === 'Cancelled').length,
      total_patients: mockPatients.filter((p) => p.status === 'Active').length,
      total_collected_today: 4560,
      total_outstanding: mockInvoices.reduce((sum, inv) => sum + inv.balance, 0),
      total_invoiced: mockInvoices.reduce((sum, inv) => sum + inv.total, 0),
      monthly_revenue: [
        { month: 'Jan', revenue: 45000 },
        { month: 'Feb', revenue: 52000 },
        { month: 'Mar', revenue: 48000 },
        { month: 'Apr', revenue: 61000 },
        { month: 'May', revenue: 58000 },
        { month: 'Jun', revenue: 35000 },
      ],
      patient_registrations: [
        { month: 'Jan', count: 15 },
        { month: 'Feb', count: 22 },
        { month: 'Mar', count: 18 },
        { month: 'Apr', count: 25 },
        { month: 'May', count: 20 },
        { month: 'Jun', count: 8 },
      ],
      appointment_status_breakdown: [
        { status: 'Scheduled', count: 12 },
        { status: 'Confirmed', count: 8 },
        { status: 'Completed', count: 45 },
        { status: 'Cancelled', count: 5 },
        { status: 'No Show', count: 3 },
      ],
      today_schedule: todayApps,
      outstanding_balances: getInvoicesWithDetails().filter((i) => i.status === 'Unpaid' || i.status === 'Overdue' || i.status === 'Partial'),
    });
  }),

  http.get(`${API}/patients`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const doctorId = url.searchParams.get('doctor_id');
    let result = [...mockPatients];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          p.patient_id.toLowerCase().includes(q) ||
          p.phone.includes(search)
      );
    }
    if (doctorId) {
      result = result.filter((p) => p.doctor_id === Number(doctorId));
    }
    return HttpResponse.json({ data: result, total: result.length });
  }),

  http.get(`${API}/patients/:id`, async ({ params }) => {
    await delay(200);
    const patient = mockPatients.find((p) => p.id === Number(params.id));
    if (!patient) return HttpResponse.json({ error: 'Patient not found' }, { status: 404 });
    const procedures = mockPatientProcedures.filter((pp) => pp.patient_id === patient.id);
    return HttpResponse.json({ ...patient, procedures });
  }),

  http.post(`${API}/patients`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<typeof mockPatients[0]>;
    const newPatient = {
      ...body,
      id: mockPatients.length + 1,
      patient_id: `PT-${String(mockPatients.length + 1).padStart(3, '0')}`,
      status: 'Active' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockPatients.push(newPatient as any);
    return HttpResponse.json(newPatient, { status: 201 });
  }),

  http.put(`${API}/patients/:id`, async ({ params, request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<typeof mockPatients[0]>;
    const idx = mockPatients.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    mockPatients[idx] = { ...mockPatients[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockPatients[idx]);
  }),

  http.delete(`${API}/patients/:id`, async ({ params }) => {
    await delay(300);
    const idx = mockPatients.findIndex((p) => p.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    mockPatients[idx].status = 'Inactive';
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API}/appointments`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    let result = getAppointmentsWithNames();
    if (start && end) {
      result = result.filter((a) => a.appointment_date >= start && a.appointment_date <= end);
    }
    return HttpResponse.json({ data: result, total: result.length });
  }),

  http.post(`${API}/appointments`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<Appointment>;
    const newApp = {
      ...body,
      id: mockAppointments.length + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Appointment;
    mockAppointments.push(newApp);
    return HttpResponse.json(newApp, { status: 201 });
  }),

  http.put(`${API}/appointments/:id`, async ({ params, request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<Appointment>;
    const idx = mockAppointments.findIndex((a) => a.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    mockAppointments[idx] = { ...mockAppointments[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockAppointments[idx]);
  }),

  http.delete(`${API}/appointments/:id`, async ({ params }) => {
    await delay(300);
    const idx = mockAppointments.findIndex((a) => a.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    mockAppointments.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API}/doctors`, async () => {
    await delay(300);
    return HttpResponse.json({ data: mockDoctors, total: mockDoctors.length });
  }),

  http.post(`${API}/doctors`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<Doctor>;
    const newDoctor = { ...body, id: mockDoctors.length + 1, status: 'Active', created_at: new Date().toISOString() } as Doctor;
    mockDoctors.push(newDoctor);
    return HttpResponse.json(newDoctor, { status: 201 });
  }),

  http.put(`${API}/doctors/:id`, async ({ params, request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<Doctor>;
    const idx = mockDoctors.findIndex((d) => d.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    mockDoctors[idx] = { ...mockDoctors[idx], ...body };
    return HttpResponse.json(mockDoctors[idx]);
  }),

  http.get(`${API}/billing`, async () => {
    await delay(300);
    return HttpResponse.json({ data: getInvoicesWithDetails(), total: mockInvoices.length });
  }),

  http.get(`${API}/billing/:id`, async ({ params }) => {
    await delay(200);
    const inv = getInvoicesWithDetails().find((i) => i.id === Number(params.id));
    if (!inv) return HttpResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const payments = mockPayments.filter((p) => p.invoice_id === inv.id);
    return HttpResponse.json({ ...inv, payments });
  }),

  http.post(`${API}/billing`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as any;
    const newInvoice: Invoice = {
      id: mockInvoices.length + 1,
      invoice_number: `INV-2026-${String(mockInvoices.length + 1).padStart(4, '0')}`,
      patient_id: body.patient_id,
      doctor_id: body.doctor_id || null,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: body.due_date || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      subtotal: body.subtotal || 0,
      tax: body.tax || 0,
      total: body.total || 0,
      paid_amount: 0,
      balance: body.total || 0,
      status: 'Unpaid',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
    };
    mockInvoices.push(newInvoice);
    return HttpResponse.json(newInvoice, { status: 201 });
  }),

  http.post(`${API}/billing/:id/payment`, async ({ params, request }) => {
    await delay(400);
    const body = (await request.json()) as { amount: number; payment_method: string; reference_number?: string };
    const inv = mockInvoices.find((i) => i.id === Number(params.id));
    if (!inv) return HttpResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const payment: Payment = {
      id: mockPayments.length + 1,
      invoice_id: inv.id,
      amount: body.amount,
      payment_method: body.payment_method as Payment['payment_method'],
      payment_date: new Date().toISOString(),
      reference_number: body.reference_number || '',
      notes: '',
      created_at: new Date().toISOString(),
    };
    mockPayments.push(payment);
    inv.paid_amount += body.amount;
    inv.balance = inv.total - inv.paid_amount;
    if (inv.balance <= 0) inv.status = 'Paid';
    else if (inv.paid_amount > 0) inv.status = 'Partial';
    return HttpResponse.json(payment, { status: 201 });
  }),

  http.get(`${API}/services`, async () => {
    await delay(200);
    return HttpResponse.json({ data: mockServices, total: mockServices.length });
  }),

  http.get(`${API}/procedure-types`, async () => {
    await delay(200);
    return HttpResponse.json({ data: mockProcedureTypes, total: mockProcedureTypes.length });
  }),

  http.get(`${API}/users`, async () => {
    await delay(300);
    return HttpResponse.json({ data: mockUsers, total: mockUsers.length });
  }),

  http.post(`${API}/users`, async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as Partial<User>;
    const newUser = {
      ...body,
      id: mockUsers.length + 1,
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null,
    } as User;
    mockUsers.push(newUser);
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.put(`${API}/users/:id`, async ({ params, request }) => {
    await delay(300);
    const body = (await request.json()) as Partial<User>;
    const idx = mockUsers.findIndex((u) => u.id === Number(params.id));
    if (idx === -1) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    mockUsers[idx] = { ...mockUsers[idx], ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(mockUsers[idx]);
  }),

  http.get(`${API}/reports/appointments`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const from = url.searchParams.get('from') || '2026-01-01';
    const to = url.searchParams.get('to') || '2026-12-31';
    const data = getAppointmentsWithNames().filter((a) => a.appointment_date >= from && a.appointment_date <= to);
    return HttpResponse.json({ data, total: data.length });
  }),

  http.get(`${API}/reports/financial`, async ({ request }) => {
    await delay(400);
    const url = new URL(request.url);
    const from = url.searchParams.get('from') || '2026-01-01';
    const to = url.searchParams.get('to') || '2026-12-31';
    const data = mockPayments.filter((p) => p.payment_date >= from && p.payment_date <= to);
    const totalCollected = data.reduce((s, p) => s + p.amount, 0);
    return HttpResponse.json({ data, total_collected: totalCollected, total_count: data.length });
  }),

  http.get(`${API}/settings`, async () => {
    await delay(200);
    const map: Record<string, string> = {};
    mockSettings.forEach((s) => { map[s.key] = s.value; });
    return HttpResponse.json(map);
  }),

  http.put(`${API}/settings`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, string>;
    Object.entries(body).forEach(([key, value]) => {
      const existing = mockSettings.find((s) => s.key === key);
      if (existing) existing.value = value;
      else mockSettings.push({ id: mockSettings.length + 1, key, value, updated_at: new Date().toISOString() });
    });
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API}/reminders`, async () => {
    await delay(300);
    return HttpResponse.json({ data: mockReminders, total: mockReminders.length });
  }),

  http.post(`${API}/reminders`, async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Partial<Reminder>;
    const reminder: Reminder = {
      ...body,
      id: mockReminders.length + 1,
      status: 'Sent',
      created_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    } as Reminder;
    mockReminders.push(reminder);
    return HttpResponse.json(reminder, { status: 201 });
  }),
];


