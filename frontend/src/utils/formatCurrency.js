/**
 * Formatea un número como moneda EUR (locale es-ES).
 */
export const formatEuro = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};
