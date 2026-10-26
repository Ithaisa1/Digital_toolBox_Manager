/**
 * Utilidades de fechas de renovación.
 * Las fechas se tratan por día en UTC para evitar saltos por zona horaria.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Devuelve la fecha a las 00:00 UTC del mismo día. */
export const startOfUtcDay = (date) => {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

/** Suma meses sin desbordar (31 ene + 1 mes = 28/29 feb, no 3 mar). */
const addMonthsUtc = (date, months, day) => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
};

/**
 * Próxima fecha de renovación a partir de hoy (incluido).
 * Si la fecha guardada ya pasó, se avanza por ciclos (1 mes o 12 meses).
 * @param {{renewalDate: Date|string, billingCycle: string}} subscription
 * @param {Date} [now]
 * @returns {Date|null} Fecha a las 00:00 UTC, o null si la fecha no es válida.
 */
export const getNextRenewalDate = (subscription, now = new Date()) => {
  const original = new Date(subscription.renewalDate);
  if (Number.isNaN(original.getTime())) return null;

  const today = startOfUtcDay(now);
  const start = startOfUtcDay(original);
  if (start >= today) return start;

  const step = subscription.billingCycle === 'monthly' ? 1 : 12;
  const day = start.getUTCDate();

  // Salto directo cerca de hoy y luego ajuste fino
  const monthsBehind =
    (today.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (today.getUTCMonth() - start.getUTCMonth());
  let cycles = Math.max(0, Math.floor(monthsBehind / step));
  let next = addMonthsUtc(start, cycles * step, day);

  while (next < today) {
    cycles += 1;
    next = addMonthsUtc(start, cycles * step, day);
  }

  return next;
};

/** Días completos entre hoy y la fecha dada (0 = hoy). */
export const daysUntil = (date, now = new Date()) =>
  Math.round((startOfUtcDay(date) - startOfUtcDay(now)) / DAY_MS);
