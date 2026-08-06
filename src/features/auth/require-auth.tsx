import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { useAuth } from './auth-context';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
