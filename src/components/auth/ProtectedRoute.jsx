import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If route requires admin, but role is public (or not loaded yet), block them
  if (requireAdmin && userRole !== 'admin') {
    // If userRole is null, it might still be fetching, but typically onAuthStateChanged fetches it.
    // For simplicity, if not explicitly 'admin', kick to home.
    return <Navigate to="/" replace />;
  }

  return children;
}
