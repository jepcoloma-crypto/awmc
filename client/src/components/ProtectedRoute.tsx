import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccess } from '@/lib/permissions';

interface Props {
  children: React.ReactNode;
  module: string;
}

export default function ProtectedRoute({ children, module }: Props) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#0b6e4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccess(module, user)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
