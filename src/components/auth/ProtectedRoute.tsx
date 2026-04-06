import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
}

export function ProtectedRoute({ children, requireStaff = false }: ProtectedRouteProps) {
  const { isAuthenticated, isStaff, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // If not authenticated at all, redirect to auth page
  if (requireStaff && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // If authenticated but not staff/admin, redirect to public menu immediately
  if (requireStaff && isAuthenticated && !isStaff) {
    return <Navigate to="/menu" replace />;
  }

  return <>{children}</>;
}
