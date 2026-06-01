import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/modules/dashboard/DashboardPage';
import PatientsList from '@/modules/patients/PatientsList';
import PatientAdd from '@/modules/patients/PatientAdd';
import PatientView from '@/modules/patients/PatientView';
import PatientEdit from '@/modules/patients/PatientEdit';
import AppointmentsPage from '@/modules/appointments/AppointmentsPage';
import AppointmentAdd from '@/modules/appointments/AppointmentAdd';
import AppointmentEdit from '@/modules/appointments/AppointmentEdit';
import BillingList from '@/modules/billing/BillingList';
import InvoiceAdd from '@/modules/billing/InvoiceAdd';
import InvoiceView from '@/modules/billing/InvoiceView';
import DoctorsList from '@/modules/doctors/DoctorsList';
import DoctorAdd from '@/modules/doctors/DoctorAdd';
import UsersList from '@/modules/users/UsersList';
import UserAdd from '@/modules/users/UserAdd';
import ReportsPage from '@/modules/reports/ReportsPage';
import SettingsPage from '@/modules/settings/SettingsPage';
import RemindersPage from '@/modules/reminders/RemindersPage';
import SetupPage from '@/modules/setup/SetupPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsList />} />
              <Route path="/patients/add" element={<PatientAdd />} />
              <Route path="/patients/:id" element={<PatientView />} />
              <Route path="/patients/:id/edit" element={<PatientEdit />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/appointments/add" element={<AppointmentAdd />} />
              <Route path="/appointments/:id/edit" element={<AppointmentEdit />} />
              <Route path="/billing" element={<BillingList />} />
              <Route path="/billing/add" element={<InvoiceAdd />} />
              <Route path="/billing/:id" element={<InvoiceView />} />
              <Route path="/doctors" element={<DoctorsList />} />
              <Route path="/doctors/add" element={<DoctorAdd />} />
              <Route path="/users" element={<UsersList />} />
              <Route path="/users/add" element={<UserAdd />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/setup" element={<SetupPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
