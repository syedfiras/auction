import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getUserRole } from '../../utils/auth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const session = useAuthStore(state => state.session);
  const isLoading = useAuthStore(state => state.isLoading);
  const userRole = getUserRole(session?.user);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Loading...
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/" replace />;
  return children;
}