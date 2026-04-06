import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function SmartRedirect() {
  const { isLoading, isStaff, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // If user is authenticated and has staff/admin role, go to staff dashboard
  if (isAuthenticated && isStaff) {
    return <Navigate to="/staff" replace />;
  }

  // Otherwise, go to public menu
  return <Navigate to="/menu" replace />;
}
