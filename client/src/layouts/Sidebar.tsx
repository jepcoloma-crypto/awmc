import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccess } from '@/lib/permissions';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

const iconMap: Record<string, string> = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  patients: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  appointments: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  billing: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  doctors: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  reports: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  reminders: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  setup: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', module: 'dashboard' },
    { label: 'Patients', path: '/patients', icon: 'patients', module: 'patients' },
    { label: 'Appointments', path: '/appointments', icon: 'appointments', module: 'appointments' },
    { label: 'Billing', path: '/billing', icon: 'billing', module: 'billing' },
    { label: 'Doctors', path: '/doctors', icon: 'doctors', module: 'doctors' },
    { label: 'Reports', path: '/reports', icon: 'reports', module: 'reports' },
    { label: 'Users', path: '/users', icon: 'users', module: 'users' },
    { label: 'Reminders', path: '/reminders', icon: 'reminders', module: 'reminders' },
    { label: 'Setup', path: '/setup', icon: 'setup', module: 'setup' },
    { label: 'Settings', path: '/settings', icon: 'settings', module: 'settings' },
  ];

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-[72px]' : 'translate-x-0 w-[272px]'
        }`}
        style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Brand */}
        <div className="flex items-center h-16 px-5 border-b shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0ea89a] to-[#2ec4b6] flex items-center justify-center shrink-0 shadow-lg shadow-[#0ea89a]/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              <p className="text-sm font-bold tracking-tight" style={{ color: 'var(--sidebar-text-active)' }}>Alyssa Wellness</p>
              <p className="text-[10px] font-medium -mt-0.5" style={{ color: 'var(--sidebar-text)' }}>Medical Clinic</p>
            </div>
          </div>
          <button onClick={onToggle} className="lg:hidden ml-auto" style={{ color: 'var(--sidebar-text)' }}>&times;</button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) =>
            canAccess(item.module, user) ? (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 1024) onToggle(); }}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={({ isActive }) => {
                  const active = isActive || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                   return `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                     active
                       ? 'font-semibold'
                       : 'hover:bg-[var(--sidebar-hover)]'
                   }`;
                }}
                style={({ isActive }) => {
                  const active = isActive || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return {
                    color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                    background: active ? 'var(--sidebar-active)' : 'transparent',
                    borderLeftColor: active ? 'var(--sidebar-active-border)' : 'transparent',
                  };
                }}
              >
                {({ isActive }) => {
                  const active = isActive || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                  return (
                    <>
                      <svg className={`w-5 h-5 shrink-0 transition-colors duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                        style={{ color: active ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconMap[item.icon] || iconMap.dashboard} />
                      </svg>
                      <span className={`truncate transition-all duration-300 ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
                        {item.label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            ) : null
          )}
        </nav>

        {/* Tooltip for collapsed state */}
        {collapsed && navItems.map((item) => {
          if (!canAccess(item.module, user)) return null;
          return hoveredItem === item.path ? (
            <div key={`tip-${item.path}`} className="fixed left-[78px] z-[60] bg-gray-800 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none" style={{ top: 'auto' }}>
              {item.label}
            </div>
          ) : null;
        })}

        {/* Footer */}
        <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-2`}>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--sidebar-text)' }}>{user?.role}</p>
              </div>
            )}
            <button
              onClick={toggleTheme}
              className="transition-colors text-lg p-1 rounded-lg hover:bg-[var(--sidebar-hover)]"
              style={{ color: 'var(--sidebar-text)' }}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
