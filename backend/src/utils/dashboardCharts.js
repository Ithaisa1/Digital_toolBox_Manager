/**
 * Cálculos para los gráficos del dashboard.
 * Funciones puras: reciben suscripciones activas y devuelven series listas para pintar.
 */

const round2 = (value) => Math.round(value * 100) / 100;

/** Coste mensual equivalente de una suscripción (las anuales se reparten en 12 meses). */
export const monthlyEquivalent = (sub) =>
  sub.billingCycle === 'monthly' ? sub.price : sub.price / 12;

/**
 * Agrupa el coste mensual equivalente por categoría de la herramienta.
 * @param {Array} subscriptions - Suscripciones con `tool.category` incluido.
 * @returns {Array<{category: string, monthlyCost: number}>} Ordenado de mayor a menor.
 */
export const getCostByCategory = (subscriptions) => {
  const totals = new Map();

  for (const sub of subscriptions) {
    const category = sub.tool?.category?.name || 'Uncategorized';
    totals.set(category, (totals.get(category) || 0) + monthlyEquivalent(sub));
  }

  return [...totals.entries()]
    .map(([category, monthlyCost]) => ({ category, monthlyCost: round2(monthlyCost) }))
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
};

const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

/**
 * Pagos previstos para los próximos meses, empezando por el mes actual.
 * Mensual: se cobra cada mes desde su próxima renovación.
 * Anual: se cobra una vez, en el mes de su próxima renovación.
 * @param {Array} subscriptions - Suscripciones activas.
 * @param {Date} [now] - Fecha de referencia (para tests).
 * @param {number} [months] - Número de meses a proyectar.
 * @returns {Array<{month: string, amount: number}>} `month` en formato YYYY-MM.
 */
export const getUpcomingPayments = (subscriptions, now = new Date(), months = 12) => {
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth();
  const amounts = new Array(months).fill(0);

  // Índice del mes (0 = mes actual) de una fecha
  const indexOf = (date) =>
    (date.getUTCFullYear() - startYear) * 12 + (date.getUTCMonth() - startMonth);

  for (const sub of subscriptions) {
    const renewal = new Date(sub.renewalDate);
    if (Number.isNaN(renewal.getTime())) continue;

    let index = indexOf(renewal);
    const step = sub.billingCycle === 'monthly' ? 1 : 12;

    // Si la fecha de renovación quedó en el pasado, avanzar hasta el periodo actual
    if (index < 0) {
      index += Math.ceil(-index / step) * step;
    }

    for (; index < months; index += step) {
      amounts[index] += sub.price;
    }
  }

  return amounts.map((amount, i) => {
    const date = new Date(Date.UTC(startYear, startMonth + i, 1));
    return { month: monthKey(date.getUTCFullYear(), date.getUTCMonth()), amount: round2(amount) };
  });
};
