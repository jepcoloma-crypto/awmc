import type { User, Doctor, Patient, Appointment, Service, Invoice, InvoiceItem, Payment, ProcedureType, PatientProcedure, Reminder, Setting } from '@/types';

export const mockUsers: User[] = [
  { id: 1, username: 'admin', password_hash: '$2b$10$mockhash', first_name: 'System', last_name: 'Admin', email: 'admin@clinic.com', role: 'Administrator', doctor_id: null, status: 'Active', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', last_login: '2026-06-01T08:00:00Z' },
  { id: 2, username: 'doctor1', password_hash: '$2b$10$mockhash', first_name: 'Maria', last_name: 'Santos', email: 'maria.santos@clinic.com', role: 'Medical Practitioner', doctor_id: 1, status: 'Active', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', last_login: '2026-06-01T07:30:00Z' },
  { id: 3, username: 'receptionist', password_hash: '$2b$10$mockhash', first_name: 'Juan', last_name: 'Dela Cruz', email: 'juan.delacruz@clinic.com', role: 'Front Desk Staff', doctor_id: null, status: 'Active', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', last_login: '2026-06-01T07:45:00Z' },
  { id: 4, username: 'cashier', password_hash: '$2b$10$mockhash', first_name: 'Ana', last_name: 'Reyes', email: 'ana.reyes@clinic.com', role: 'Cashier', doctor_id: null, status: 'Active', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', last_login: '2026-06-01T08:00:00Z' },
  { id: 5, username: 'doctor2', password_hash: '$2b$10$mockhash', first_name: 'Carlos', last_name: 'Lopez', email: 'carlos.lopez@clinic.com', role: 'Medical Practitioner', doctor_id: 2, status: 'Active', created_at: '2025-02-01T00:00:00Z', updated_at: '2025-02-01T00:00:00Z', last_login: null },
];

export const mockDoctors: Doctor[] = [
  { id: 1, first_name: 'Maria', last_name: 'Santos', specialization: 'General Medicine', phone: '09171234567', email: 'maria.santos@clinic.com', status: 'Active', user_id: 2, created_at: '2025-01-01T00:00:00Z' },
  { id: 2, first_name: 'Carlos', last_name: 'Lopez', specialization: 'Pediatrics', phone: '09172345678', email: 'carlos.lopez@clinic.com', status: 'Active', user_id: 5, created_at: '2025-02-01T00:00:00Z' },
  { id: 3, first_name: 'Elena', last_name: 'Cruz', specialization: 'Cardiology', phone: '09173456789', email: 'elena.cruz@clinic.com', status: 'Active', user_id: null, created_at: '2025-01-15T00:00:00Z' },
  { id: 4, first_name: 'Roberto', last_name: 'Tan', specialization: 'Dermatology', phone: '09174567890', email: 'roberto.tan@clinic.com', status: 'Inactive', user_id: null, created_at: '2025-03-01T00:00:00Z' },
];

export const mockPatients: Patient[] = [
  { id: 1, patient_id: 'PT-001', first_name: 'John', last_name: 'Doe', date_of_birth: '1990-05-15', gender: 'Male', phone: '09175551234', email: 'john.doe@email.com', address: '123 Main St, Manila', blood_type: 'A+', medical_history: 'None', allergies: 'Penicillin', emergency_contact_name: 'Jane Doe', emergency_contact_phone: '09175551235', photo_url: null, status: 'Active', doctor_id: 1, created_at: '2025-06-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z' },
  { id: 2, patient_id: 'PT-002', first_name: 'Jane', last_name: 'Smith', date_of_birth: '1985-08-22', gender: 'Female', phone: '09176662345', email: 'jane.smith@email.com', address: '456 Oak Ave, Quezon City', blood_type: 'B+', medical_history: 'Asthma', allergies: 'None', emergency_contact_name: 'Bob Smith', emergency_contact_phone: '09176662346', photo_url: null, status: 'Active', doctor_id: 1, created_at: '2025-06-05T00:00:00Z', updated_at: '2025-06-05T00:00:00Z' },
  { id: 3, patient_id: 'PT-003', first_name: 'Robert', last_name: 'Johnson', date_of_birth: '1978-12-01', gender: 'Male', phone: '09177773456', email: 'robert.j@email.com', address: '789 Pine Rd, Makati', blood_type: 'O+', medical_history: 'Hypertension', allergies: 'Sulfa', emergency_contact_name: 'Mary Johnson', emergency_contact_phone: '09177773457', photo_url: null, status: 'Active', doctor_id: 2, created_at: '2025-06-10T00:00:00Z', updated_at: '2025-06-10T00:00:00Z' },
  { id: 4, patient_id: 'PT-004', first_name: 'Emily', last_name: 'Brown', date_of_birth: '1995-03-10', gender: 'Female', phone: '09178884567', email: 'emily.brown@email.com', address: '321 Elm St, Pasig', blood_type: 'AB-', medical_history: 'None', allergies: 'Latex', emergency_contact_name: 'Tom Brown', emergency_contact_phone: '09178884568', photo_url: null, status: 'Active', doctor_id: 2, created_at: '2025-07-01T00:00:00Z', updated_at: '2025-07-01T00:00:00Z' },
  { id: 5, patient_id: 'PT-005', first_name: 'Michael', last_name: 'Wilson', date_of_birth: '1965-11-30', gender: 'Male', phone: '09179995678', email: 'michael.w@email.com', address: '654 Maple Dr, Mandaluyong', blood_type: 'A-', medical_history: 'Diabetes Type 2', allergies: 'None', emergency_contact_name: 'Sarah Wilson', emergency_contact_phone: '09179995679', photo_url: null, status: 'Inactive', doctor_id: 1, created_at: '2025-07-15T00:00:00Z', updated_at: '2025-07-15T00:00:00Z' },
  { id: 6, patient_id: 'PT-006', first_name: 'Patricia', last_name: 'Garcia', date_of_birth: '2000-01-20', gender: 'Female', phone: '09171116789', email: 'pat.garcia@email.com', address: '987 Cedar Ln, Taguig', blood_type: 'O-', medical_history: 'None', allergies: 'None', emergency_contact_name: 'Luis Garcia', emergency_contact_phone: '09171116780', photo_url: null, status: 'Active', doctor_id: 3, created_at: '2025-08-01T00:00:00Z', updated_at: '2025-08-01T00:00:00Z' },
  { id: 7, patient_id: 'PT-007', first_name: 'David', last_name: 'Martinez', date_of_birth: '1988-07-14', gender: 'Male', phone: '09172227890', email: 'david.m@email.com', address: '135 Birch Ave, Manila', blood_type: 'B-', medical_history: 'None', allergies: 'Ibuprofen', emergency_contact_name: 'Anna Martinez', emergency_contact_phone: '09172227891', photo_url: null, status: 'Active', doctor_id: 3, created_at: '2025-08-15T00:00:00Z', updated_at: '2025-08-15T00:00:00Z' },
  { id: 8, patient_id: 'PT-008', first_name: 'Lisa', last_name: 'Anderson', date_of_birth: '1975-09-05', gender: 'Female', phone: '09173338901', email: 'lisa.anderson@email.com', address: '246 Walnut St, Pasay', blood_type: 'AB+', medical_history: 'Migraine', allergies: 'None', emergency_contact_name: 'Mark Anderson', emergency_contact_phone: '09173338902', photo_url: null, status: 'Active', doctor_id: 1, created_at: '2025-09-01T00:00:00Z', updated_at: '2025-09-01T00:00:00Z' },
];

export const mockServices: Service[] = [
  { id: 1, name: 'General Consultation', description: 'Standard medical consultation', price: 500, category: 'Consultation', status: 'Active' },
  { id: 2, name: 'Pediatric Checkup', description: 'Child health assessment', price: 600, category: 'Consultation', status: 'Active' },
  { id: 3, name: 'ECG', description: 'Electrocardiogram', price: 800, category: 'Diagnostic', status: 'Active' },
  { id: 4, name: 'Blood Test - CBC', description: 'Complete Blood Count', price: 350, category: 'Laboratory', status: 'Active' },
  { id: 5, name: 'X-Ray - Chest', description: 'Chest X-Ray', price: 700, category: 'Diagnostic', status: 'Active' },
  { id: 6, name: 'Vaccination - Flu Shot', description: 'Influenza vaccine', price: 1200, category: 'Vaccination', status: 'Active' },
  { id: 7, name: 'Skin Check', description: 'Full skin examination', price: 1000, category: 'Consultation', status: 'Active' },
  { id: 8, name: 'Blood Pressure Monitoring', description: '24-hour ambulatory BP monitoring', price: 1500, category: 'Diagnostic', status: 'Active' },
  { id: 9, name: 'Health Certificate', description: 'Medical clearance certificate', price: 300, category: 'Others', status: 'Active' },
  { id: 10, name: 'Teleconsultation', description: 'Online video consultation', price: 400, category: 'Consultation', status: 'Active' },
];

export const mockAppointments: Appointment[] = [
  { id: 1, patient_id: 1, doctor_id: 1, appointment_date: '2026-06-01', appointment_time: '09:00', end_time: '09:30', status: 'Scheduled', reason: 'Annual physical checkup', notes: 'Patient requested full lab work', created_at: '2026-05-28T10:00:00Z', updated_at: '2026-05-28T10:00:00Z' },
  { id: 2, patient_id: 3, doctor_id: 2, appointment_date: '2026-06-01', appointment_time: '09:30', end_time: '10:00', status: 'Confirmed', reason: 'Follow-up on blood pressure', notes: '', created_at: '2026-05-29T14:00:00Z', updated_at: '2026-05-30T09:00:00Z' },
  { id: 3, patient_id: 2, doctor_id: 1, appointment_date: '2026-06-01', appointment_time: '10:00', end_time: '10:30', status: 'Completed', reason: 'Asthma follow-up', notes: 'Prescribed maintenance inhaler', created_at: '2026-05-25T08:00:00Z', updated_at: '2026-06-01T10:35:00Z' },
  { id: 4, patient_id: 4, doctor_id: 2, appointment_date: '2026-06-01', appointment_time: '10:30', end_time: '11:00', status: 'In Progress', reason: 'Skin rash consultation', notes: '', created_at: '2026-05-30T11:00:00Z', updated_at: '2026-06-01T10:35:00Z' },
  { id: 5, patient_id: 6, doctor_id: 3, appointment_date: '2026-06-01', appointment_time: '11:00', end_time: '11:45', status: 'Scheduled', reason: 'Cardiology checkup', notes: 'ECG needed', created_at: '2026-05-27T09:00:00Z', updated_at: '2026-05-27T09:00:00Z' },
  { id: 6, patient_id: 7, doctor_id: 3, appointment_date: '2026-06-01', appointment_time: '13:00', end_time: '13:30', status: 'Scheduled', reason: 'Chest pain evaluation', notes: 'Bring previous ECG results', created_at: '2026-05-29T16:00:00Z', updated_at: '2026-05-29T16:00:00Z' },
  { id: 7, patient_id: 1, doctor_id: 2, appointment_date: '2026-06-02', appointment_time: '09:00', end_time: '09:30', status: 'Scheduled', reason: 'Lab results review', notes: '', created_at: '2026-06-01T08:00:00Z', updated_at: '2026-06-01T08:00:00Z' },
  { id: 8, patient_id: 8, doctor_id: 1, appointment_date: '2026-06-02', appointment_time: '10:00', end_time: '10:30', status: 'Scheduled', reason: 'Migraine consultation', notes: 'Patient reports increasing frequency', created_at: '2026-05-31T10:00:00Z', updated_at: '2026-05-31T10:00:00Z' },
  { id: 9, patient_id: 2, doctor_id: 1, appointment_date: '2026-05-30', appointment_time: '14:00', end_time: '14:30', status: 'Cancelled', reason: 'Postponed due to emergency', notes: 'Rescheduled to June 5', created_at: '2026-05-28T10:00:00Z', updated_at: '2026-05-30T08:00:00Z' },
  { id: 10, patient_id: 5, doctor_id: 1, appointment_date: '2026-05-29', appointment_time: '15:00', end_time: '15:30', status: 'No Show', reason: 'Diabetes management follow-up', notes: 'Patient did not arrive', created_at: '2026-05-25T10:00:00Z', updated_at: '2026-05-29T16:00:00Z' },
];

export const mockInvoices: Invoice[] = [
  { id: 1, invoice_number: 'INV-2026-0001', patient_id: 1, doctor_id: 1, invoice_date: '2026-06-01', due_date: '2026-06-15', subtotal: 1350, tax: 135, total: 1485, paid_amount: 1485, balance: 0, status: 'Paid', notes: 'Annual physical + lab', created_at: '2026-06-01T11:00:00Z' },
  { id: 2, invoice_number: 'INV-2026-0002', patient_id: 3, doctor_id: 2, invoice_date: '2026-06-01', due_date: '2026-06-15', subtotal: 500, tax: 50, total: 550, paid_amount: 300, balance: 250, status: 'Partial', notes: '', created_at: '2026-06-01T11:30:00Z' },
  { id: 3, invoice_number: 'INV-2026-0003', patient_id: 4, doctor_id: 2, invoice_date: '2026-06-01', due_date: '2026-06-15', subtotal: 2300, tax: 230, total: 2530, paid_amount: 0, balance: 2530, status: 'Unpaid', notes: 'Skin check + biopsy', created_at: '2026-06-01T12:00:00Z' },
  { id: 4, invoice_number: 'INV-2026-0004', patient_id: 6, doctor_id: 3, invoice_date: '2026-05-30', due_date: '2026-06-13', subtotal: 800, tax: 80, total: 880, paid_amount: 880, balance: 0, status: 'Paid', notes: 'ECG procedure', created_at: '2026-05-30T15:00:00Z' },
  { id: 5, invoice_number: 'INV-2026-0005', patient_id: 2, doctor_id: 1, invoice_date: '2026-05-25', due_date: '2026-06-08', subtotal: 1200, tax: 120, total: 1320, paid_amount: 500, balance: 820, status: 'Partial', notes: '', created_at: '2026-05-25T10:00:00Z' },
  { id: 6, invoice_number: 'INV-2026-0006', patient_id: 7, doctor_id: 3, invoice_date: '2026-05-20', due_date: '2026-06-03', subtotal: 3000, tax: 300, total: 3300, paid_amount: 0, balance: 3300, status: 'Overdue', notes: 'Cardiology workup package', created_at: '2026-05-20T14:00:00Z' },
];

export const mockInvoiceItems: InvoiceItem[] = [
  { id: 1, invoice_id: 1, service_id: 1, description: 'General Consultation', quantity: 1, unit_price: 500, total: 500 },
  { id: 2, invoice_id: 1, service_id: 4, description: 'Blood Test - CBC', quantity: 1, unit_price: 350, total: 350 },
  { id: 3, invoice_id: 1, service_id: 9, description: 'Health Certificate', quantity: 1, unit_price: 300, total: 300 },
  { id: 4, invoice_id: 1, service_id: 10, description: 'Teleconsultation', quantity: 1, unit_price: 200, total: 200 },
  { id: 5, invoice_id: 2, service_id: 1, description: 'General Consultation', quantity: 1, unit_price: 500, total: 500 },
  { id: 6, invoice_id: 3, service_id: 7, description: 'Skin Check', quantity: 1, unit_price: 1000, total: 1000 },
  { id: 7, invoice_id: 3, service_id: 5, description: 'X-Ray - Chest', quantity: 1, unit_price: 700, total: 700 },
  { id: 8, invoice_id: 3, service_id: 9, description: 'Health Certificate', quantity: 2, unit_price: 300, total: 600 },
  { id: 9, invoice_id: 4, service_id: 3, description: 'ECG', quantity: 1, unit_price: 800, total: 800 },
  { id: 10, invoice_id: 5, service_id: 1, description: 'General Consultation', quantity: 1, unit_price: 500, total: 500 },
  { id: 11, invoice_id: 5, service_id: 8, description: 'Blood Pressure Monitoring', quantity: 1, unit_price: 700, total: 700 },
  { id: 12, invoice_id: 6, service_id: 3, description: 'ECG', quantity: 2, unit_price: 800, total: 1600 },
  { id: 13, invoice_id: 6, service_id: 1, description: 'General Consultation', quantity: 1, unit_price: 500, total: 500 },
  { id: 14, invoice_id: 6, service_id: 9, description: 'Health Certificate', quantity: 3, unit_price: 300, total: 900 },
];

export const mockPayments: Payment[] = [
  { id: 1, invoice_id: 1, amount: 1485, payment_method: 'Cash', payment_date: '2026-06-01T11:15:00Z', reference_number: '', notes: 'Full payment', created_at: '2026-06-01T11:15:00Z' },
  { id: 2, invoice_id: 2, amount: 300, payment_method: 'Card', payment_date: '2026-06-01T11:45:00Z', reference_number: 'CARD-001', notes: 'Partial payment', created_at: '2026-06-01T11:45:00Z' },
  { id: 3, invoice_id: 4, amount: 880, payment_method: 'Bank Transfer', payment_date: '2026-05-30T16:00:00Z', reference_number: 'BANK-001', notes: '', created_at: '2026-05-30T16:00:00Z' },
  { id: 4, invoice_id: 5, amount: 500, payment_method: 'Cash', payment_date: '2026-05-25T10:30:00Z', reference_number: '', notes: 'Initial payment', created_at: '2026-05-25T10:30:00Z' },
];

export const mockProcedureTypes: ProcedureType[] = [
  { id: 1, name: 'General Checkup', description: 'Standard physical examination', price: 500 },
  { id: 2, name: 'Blood Extraction', description: 'Venipuncture for lab tests', price: 150 },
  { id: 3, name: 'ECG', description: 'Electrocardiogram', price: 800 },
  { id: 4, name: 'Nebulization', description: 'Respiratory treatment', price: 350 },
  { id: 5, name: 'Wound Dressing', description: 'Wound cleaning and bandaging', price: 400 },
  { id: 6, name: 'Vaccination', description: 'Administer vaccine', price: 200 },
  { id: 7, name: 'Biopsy', description: 'Tissue sampling', price: 1500 },
  { id: 8, name: 'Skin Prick Test', description: 'Allergy testing', price: 800 },
];

export const mockPatientProcedures: PatientProcedure[] = [
  { id: 1, patient_id: 1, procedure_type_id: 1, doctor_id: 1, procedure_date: '2026-06-01', notes: 'Annual physical, all vitals normal', fee: 500, created_at: '2026-06-01T10:00:00Z' },
  { id: 2, patient_id: 2, procedure_type_id: 4, doctor_id: 1, procedure_date: '2026-06-01', notes: 'Patient responded well', fee: 350, created_at: '2026-06-01T10:30:00Z' },
  { id: 3, patient_id: 4, procedure_type_id: 1, doctor_id: 2, procedure_date: '2026-06-01', notes: 'Referred to dermatologist', fee: 500, created_at: '2026-06-01T11:00:00Z' },
];

export const mockReminders: Reminder[] = [
  { id: 1, patient_id: 1, type: 'SMS', message: 'Reminder: Your appointment is tomorrow at 9:00 AM with Dr. Santos.', status: 'Sent', sent_at: '2026-05-31T09:00:00Z', created_at: '2026-05-31T09:00:00Z' },
  { id: 2, patient_id: 3, type: 'Email', message: 'Follow-up on outstanding balance of 250.00 PHP.', status: 'Sent', sent_at: '2026-05-31T10:00:00Z', created_at: '2026-05-31T10:00:00Z' },
  { id: 3, patient_id: 5, type: 'Manual', message: 'Called patient to reschedule missed appointment.', status: 'Sent', sent_at: '2026-05-30T15:00:00Z', created_at: '2026-05-30T15:00:00Z' },
];

export const mockSettings: Setting[] = [
  { id: 1, key: 'clinic_name', value: 'Alyssa Wellness & Medical Clinic', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, key: 'clinic_address', value: '123 Health Avenue, Barangay San Juan, Manila, Philippines', updated_at: '2026-01-01T00:00:00Z' },
  { id: 3, key: 'clinic_phone', value: '+63 2 8123 4567', updated_at: '2026-01-01T00:00:00Z' },
  { id: 4, key: 'clinic_email', value: 'info@alyssaclinic.com', updated_at: '2026-01-01T00:00:00Z' },
  { id: 5, key: 'currency', value: 'PHP', updated_at: '2026-01-01T00:00:00Z' },
  { id: 6, key: 'appointment_duration', value: '30', updated_at: '2026-01-01T00:00:00Z' },
];

export const adminUser: User & { token: string } = {
  ...mockUsers[0],
  token: 'mock-jwt-token-admin',
};

export const mockCredentials: Record<string, { password: string; user: User }> = {
  admin: { password: 'admin123', user: mockUsers[0] },
  doctor1: { password: 'admin123', user: mockUsers[1] },
  receptionist: { password: 'admin123', user: mockUsers[2] },
  cashier: { password: 'admin123', user: mockUsers[3] },
  doctor2: { password: 'admin123', user: mockUsers[4] },
};

export function getAppointmentsWithNames(): Appointment[] {
  return mockAppointments.map((a) => {
    const patient = mockPatients.find((p) => p.id === a.patient_id);
    const doctor = mockDoctors.find((d) => d.id === a.doctor_id);
    return {
      ...a,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
      doctor_name: doctor ? `Dr. ${doctor.first_name} ${doctor.last_name}` : 'Unknown',
    };
  });
}

export function getInvoicesWithDetails(): Invoice[] {
  return mockInvoices.map((inv) => {
    const patient = mockPatients.find((p) => p.id === inv.patient_id);
    return {
      ...inv,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
      items: mockInvoiceItems.filter((item) => item.invoice_id === inv.id),
    };
  });
}
