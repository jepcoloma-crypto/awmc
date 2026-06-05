import type { UserRole, User } from '@/types';

const modulePermissions: Record<string, UserRole[]> = {
  dashboard: ['Administrator', 'Medical Practitioner', 'Front Desk Staff', 'Cashier'],
  patients: ['Administrator', 'Medical Practitioner', 'Front Desk Staff'],
  appointments: ['Administrator', 'Medical Practitioner', 'Front Desk Staff'],
  billing: ['Administrator', 'Medical Practitioner', 'Cashier'],
  doctors: ['Administrator', 'Medical Practitioner', 'Front Desk Staff'],
  reports: ['Administrator', 'Medical Practitioner'],
  users: ['Administrator'],
  settings: ['Administrator'],
  setup: ['Administrator'],
  reminders: ['Administrator', 'Medical Practitioner', 'Front Desk Staff', 'Cashier'],
  certificates: ['Administrator', 'Medical Practitioner', 'Front Desk Staff'],
  inventory: ['Administrator', 'Medical Practitioner', 'Front Desk Staff', 'Cashier'],
};

export function canAccess(module: string, user: User | null): boolean {
  if (!user) return false;
  const roles = modulePermissions[module];
  if (!roles) return false;
  return roles.includes(user.role);
}

export const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: 'grid', module: 'dashboard' },
  { label: 'Patients', path: '/patients', icon: 'people', module: 'patients' },
  { label: 'Appointments', path: '/appointments', icon: 'calendar', module: 'appointments' },
  { label: 'Billing', path: '/billing', icon: 'money', module: 'billing' },
  { label: 'Doctors', path: '/doctors', icon: 'medical', module: 'doctors' },
  { label: 'Reports', path: '/reports', icon: 'chart', module: 'reports' },
  { label: 'Users', path: '/users', icon: 'user', module: 'users' },
  { label: 'Reminders', path: '/reminders', icon: 'bell', module: 'reminders' },
  { label: 'Certificates', path: '/certificates', icon: 'certificate', module: 'certificates' },
  { label: 'Setup', path: '/setup', icon: 'setup', module: 'setup' },
  { label: 'Settings', path: '/settings', icon: 'gear', module: 'settings' },
];
