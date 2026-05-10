import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Memuatkan maklumat akaun...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If route requires admin, but role is public (or not loaded yet), block them
  if (requireAdmin && userRole !== 'admin') {
    console.warn("Access denied: User is not an admin", { userRole, currentUser: currentUser.email });
    return <Navigate to="/" replace />;
  }

  return children;
}
