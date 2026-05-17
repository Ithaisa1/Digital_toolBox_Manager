/**
 * Envuelve rutas privadas: exige sesión y opcionalmente un rol concreto.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error, #dc2626)', marginBottom: '1rem' }}>
          Acceso Denegado
        </h2>
        <p style={{ color: 'var(--color-text-secondary, #6b7280)', marginBottom: '1rem' }}>
          No tienes permisos para acceder a esta página.
        </p>
        <button
          onClick={() => window.history.back()}
          style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-primary, #3b82f6)', color: '#fff', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
        >
          Volver
        </button>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
