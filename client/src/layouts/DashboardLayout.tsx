import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--surface-secondary)] dark:bg-[var(--surface-dark)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0b6e4f] to-[#2ec4b6] flex items-center justify-center shadow-lg shadow-[#0b6e4f]/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-[#0b6e4f] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--surface-secondary)] dark:bg-[var(--surface-dark)]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[272px]'}`}>
        <Header onMenuToggle={() => setSidebarCollapsed(!sidebarCollapsed)} sidebarCollapsed={sidebarCollapsed} />
        <main className="p-4 lg:p-6 xl:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
