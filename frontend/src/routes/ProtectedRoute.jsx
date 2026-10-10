import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSpinner } from '../components/ui/PageSpinner.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <AppShell>{children}</AppShell>;
}
