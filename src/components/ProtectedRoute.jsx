import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function ProtectedRoute({ role, children }) {
  const { user } = useApp();
  const location = useLocation();
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'worker' ? '/worker' : '/customer'} replace />;
  }
  return children;
}
