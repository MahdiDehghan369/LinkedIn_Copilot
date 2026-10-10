import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { PageSpinner } from '../components/ui/PageSpinner.jsx';

/**
 * @param {{ children: import('react').ReactNode }} props
 */
export function GuestRoute({ children }) {
  const { isAuthenticated, isLoadingSession } = useAuth();

  if (isLoadingSession) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children;
}
