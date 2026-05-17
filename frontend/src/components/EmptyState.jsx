/**
 * Placeholder cuando no hay datos: icono, mensaje y acción opcional.
 */
const EmptyState = ({ title, message, icon, action, actionText }) => {
  const defaultIcon = (
    <svg style={{ width: 48, height: 48, color: 'var(--color-text-muted, #9ca3af)', margin: '0 auto' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
      <div style={{ marginBottom: '1rem' }}>{icon || defaultIcon}</div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: 'var(--color-text, #111827)', marginBottom: '0.5rem' }}>
        {title || 'No hay datos'}
      </h3>
      <p style={{ color: 'var(--color-text-secondary, #6b7280)', marginBottom: '1.5rem', maxWidth: 28, margin: '0 auto 1.5rem' }}>
        {message || 'No se encontraron elementos para mostrar.'}
      </p>
      {action && (
        <button onClick={action} style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', border: 'none', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.375rem', color: '#fff', backgroundColor: 'var(--color-primary, #3b82f6)', cursor: 'pointer' }}>
          {actionText || 'Agregar'}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
