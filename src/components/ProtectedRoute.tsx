import { useAuth } from '@/context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { ReactNode } from 'react';
import { Skeleton } from './ui/skeleton';

const ProtectedRoute = ({ children }: { children?: ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col space-y-3 p-4">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;