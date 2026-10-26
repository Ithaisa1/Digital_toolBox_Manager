/**
 * Indicador de carga circular con tamaños predefinidos.
 */
const Spinner = ({ size = 'medium' }) => {
  const sizeMap = {
    small: { width: 16, height: 16, borderWidth: 2 },
    medium: { width: 32, height: 32, borderWidth: 3 },
    large: { width: 48, height: 48, borderWidth: 4 },
  };

  const { width, height, borderWidth } = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width,
          height,
          border: `${borderWidth}px solid var(--color-border, #e0d3c0)`,
          borderTopColor: 'var(--color-primary, #b9622a)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
};

export default Spinner;
