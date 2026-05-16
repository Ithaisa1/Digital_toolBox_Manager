/**
 * Placeholder cuando no hay datos: icono, mensaje y acción opcional.
 */
const EmptyState = ({ 
  title, 
  message, 
  icon, 
  action, 
  actionText 
}) => {
  const defaultIcon = (
    <svg
      className="h-12 w-12 text-gray-400 mx-auto"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  return (
    <div className="text-center py-12">
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title || 'No hay datos'}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {message || 'No se encontraron elementos para mostrar.'}
      </p>
      {action && (
        <button
          onClick={action}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {actionText || 'Agregar'}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
