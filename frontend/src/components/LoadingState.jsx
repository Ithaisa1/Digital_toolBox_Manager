/**
 * Bloque de carga centrado con spinner y mensaje.
 */
import Spinner from './Spinner';

const LoadingState = ({ message = 'Cargando...', size = 'medium' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <Spinner size={size} />
      <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary, #6b7280)', textAlign: 'center' }}>{message}</p>
    </div>
  );
};

export default LoadingState;
