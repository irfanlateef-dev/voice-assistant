import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function LoadingScreen() {
  return (
    <div className="login-screen">
      <p className="login-subtitle">Loading…</p>
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/app" replace />;

  return children;
}
