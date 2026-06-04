import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';

const LoginPage = lazy(() => import('@/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/modules/dashboard/DashboardPage'));
const PatientsList = lazy(() => import('@/modules/patients/PatientsList'));
const PatientAdd = lazy(() => import('@/modules/patients/PatientAdd'));
const PatientView = lazy(() => import('@/modules/patients/PatientView'));
const PatientEdit = lazy(() => import('@/modules/patients/PatientEdit'));
const AppointmentsPage = lazy(() => import('@/modules/appointments/AppointmentsPage'));
const AppointmentAdd = lazy(() => import('@/modules/appointments/AppointmentAdd'));
const AppointmentEdit = lazy(() => import('@/modules/appointments/AppointmentEdit'));
const BillingList = lazy(() => import('@/modules/billing/BillingList'));
const InvoiceAdd = lazy(() => import('@/modules/billing/InvoiceAdd'));
const InvoiceView = lazy(() => import('@/modules/billing/InvoiceView'));
const DoctorsList = lazy(() => import('@/modules/doctors/DoctorsList'));
const DoctorAdd = lazy(() => import('@/modules/doctors/DoctorAdd'));
const UsersList = lazy(() => import('@/modules/users/UsersList'));
const UserAdd = lazy(() => import('@/modules/users/UserAdd'));
const ReportsPage = lazy(() => import('@/modules/reports/ReportsPage'));
const SettingsPage = lazy(() => import('@/modules/settings/SettingsPage'));
const RemindersPage = lazy(() => import('@/modules/reminders/RemindersPage'));
const SetupPage = lazy(() => import('@/modules/setup/SetupPage'));
const CertificatesPage = lazy(() => import('@/modules/certificates/CertificatesPage'));
const CertificateView = lazy(() => import('@/modules/certificates/CertificateView'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-[#0b6e4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><DashboardPage /></ProtectedRoute>} />
                  <Route path="/patients" element={<ProtectedRoute module="patients"><PatientsList /></ProtectedRoute>} />
                  <Route path="/patients/add" element={<ProtectedRoute module="patients"><PatientAdd /></ProtectedRoute>} />
                  <Route path="/patients/:id" element={<ProtectedRoute module="patients"><PatientView /></ProtectedRoute>} />
                  <Route path="/patients/:id/edit" element={<ProtectedRoute module="patients"><PatientEdit /></ProtectedRoute>} />
                  <Route path="/appointments" element={<ProtectedRoute module="appointments"><AppointmentsPage /></ProtectedRoute>} />
                  <Route path="/appointments/add" element={<ProtectedRoute module="appointments"><AppointmentAdd /></ProtectedRoute>} />
                  <Route path="/appointments/:id/edit" element={<ProtectedRoute module="appointments"><AppointmentEdit /></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute module="billing"><BillingList /></ProtectedRoute>} />
                  <Route path="/billing/add" element={<ProtectedRoute module="billing"><InvoiceAdd /></ProtectedRoute>} />
                  <Route path="/billing/:id" element={<ProtectedRoute module="billing"><InvoiceView /></ProtectedRoute>} />
                  <Route path="/doctors" element={<ProtectedRoute module="doctors"><DoctorsList /></ProtectedRoute>} />
                  <Route path="/doctors/add" element={<ProtectedRoute module="doctors"><DoctorAdd /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute module="users"><UsersList /></ProtectedRoute>} />
                  <Route path="/users/add" element={<ProtectedRoute module="users"><UserAdd /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute module="reports"><ReportsPage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
                  <Route path="/setup" element={<ProtectedRoute module="setup"><SetupPage /></ProtectedRoute>} />
                  <Route path="/reminders" element={<ProtectedRoute module="reminders"><RemindersPage /></ProtectedRoute>} />
                  <Route path="/certificates" element={<ProtectedRoute module="certificates"><CertificatesPage /></ProtectedRoute>} />
                  <Route path="/certificates/:id" element={<CertificateView />} />
                </Route>
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
