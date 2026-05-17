/**
 * Muestra un error con opciones de reintentar o cerrar.
 */
const ErrorState = ({ error, onRetry, onDismiss }) => {
  const containerStyle = {
    backgroundColor: 'var(--color-error-bg, #fef2f2)',
    border: '1px solid var(--color-error-border, #fecaca)',
    borderRadius: '0.5rem',
    padding: '1rem',
    margin: '1rem',
  };

  const iconStyle = { flexShrink: 0, width: 20, height: 20, color: 'var(--color-error, #f87171)' };
  const titleStyle = { fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-error-text, #991b1b)' };
  const textStyle = { marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--color-error-text, #b91c1c)' };
  const buttonContainerStyle = { marginTop: '0.75rem', display: 'flex', gap: '0.5rem' };
  const retryStyle = { backgroundColor: 'var(--color-error-light, #fee2e2)', color: 'var(--color-error-text, #991b1b)', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer' };
  const dismissStyle = { color: 'var(--color-error, #dc2626)', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer' };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <div style={iconStyle}>
          <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '100%', height: '100%' }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div style={{ marginLeft: '0.75rem', flex: 1 }}>
          <h3 style={titleStyle}>Error</h3>
          <div style={textStyle}><p>{error}</p></div>
          <div style={buttonContainerStyle}>
            {onRetry && <button onClick={onRetry} style={retryStyle}>Reintentar</button>}
            {onDismiss && <button onClick={onDismiss} style={dismissStyle}>Cerrar</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
