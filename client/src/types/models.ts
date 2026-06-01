export type UserRole = 'Administrator' | 'Medical Practitioner' | 'Front Desk Staff' | 'Cashier';

export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';

export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';

export type PatientStatus = 'Active' | 'Inactive';

export interface User {
  id: number;
  username: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  doctor_id: number | null;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  specialization: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
  user_id: number | null;
  created_at: string;
}

export interface Patient {
  id: number;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  blood_type: string;
  medical_history: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  photo_url: string | null;
  status: PatientStatus;
  doctor_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'Active' | 'Inactive';
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  doctor_id: number | null;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  paid_amount: number;
  balance: number;
  status: PaymentStatus;
  notes: string;
  created_at: string;
  patient_name?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  service_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  service_name?: string;
}

export interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method: 'Cash' | 'Card' | 'Bank Transfer' | 'Online' | 'Cheque';
  payment_date: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

export interface ProcedureType {
  id: number;
  name: string;
  description: string;
  price: number;
}

export interface PatientProcedure {
  id: number;
  patient_id: number;
  procedure_type_id: number;
  doctor_id: number;
  procedure_date: string;
  notes: string;
  fee: number;
  created_at: string;
}

export interface Reminder {
  id: number;
  patient_id: number;
  type: 'SMS' | 'Email' | 'Manual';
  message: string;
  status: 'Sent' | 'Pending' | 'Failed';
  sent_at: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export interface DashboardStats {
  total_appointments_today: number;
  completed_appointments: number;
  cancelled_appointments: number;
  total_patients: number;
  total_collected_today: number;
  total_outstanding: number;
  total_invoiced: number;
  monthly_revenue: { month: string; revenue: number }[];
  patient_registrations: { month: string; count: number }[];
  appointment_status_breakdown: { status: string; count: number }[];
  today_schedule: Appointment[];
  outstanding_balances: Invoice[];
}
