import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

const breadcrumbMap: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Appointments',
  billing: 'Billing',
  doctors: 'Doctors',
  users: 'Users',
  reports: 'Reports',
  reminders: 'Reminders',
  settings: 'Settings',
};

export default function Header({ onMenuToggle, sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentModule = pathParts[0] || 'dashboard';
  const pageTitle = breadcrumbMap[currentModule] || 'Dashboard';
  const isSubPage = pathParts.length > 1;

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={sidebarCollapsed ? 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5' : 'M6 18L18 6M6 6l12 12'} />
            </svg>
          </button>

          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 tracking-tight">{pageTitle}</h1>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span>Home</span>
              {isSubPage && <span className="text-gray-300 dark:text-gray-600">/</span>}
              {isSubPage && <span className="capitalize">{pathParts[1]}</span>}
              {!isSubPage && <span className="text-gray-300 dark:text-gray-600">/</span>}
              {!isSubPage && <span className="text-gray-600 dark:text-gray-300 font-medium">{pageTitle}</span>}
            </div>
          </div>
          <div className="sm:hidden">
            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-50">{pageTitle}</h1>
          </div>
        </div>

        {/* Right: User Menu */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0b6e4f] to-[#2ec4b6] flex items-center justify-center text-white text-sm font-semibold shadow-sm shadow-[#0b6e4f]/20">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-tight">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">{user?.role}</p>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/5 border border-gray-200 dark:border-gray-700 py-1.5 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-[#0b6e4f]/10 dark:bg-[#0b6e4f]/30 text-[#0b6e4f] dark:text-[#2ec4b6]">
                    {user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
