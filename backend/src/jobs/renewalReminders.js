/**
 * Tarea de avisos de renovación.
 * Busca suscripciones activas que se renuevan en los próximos días y envía
 * un único email por usuario con todas ellas. Guarda en `reminderSentFor`
 * la renovación avisada para no repetir el aviso al día siguiente.
 */
import prisma from '../config/database.js';
import EmailService from '../utils/emailService.js';
import { daysUntil, getNextRenewalDate, startOfUtcDay } from '../utils/renewals.js';

export const DEFAULT_REMINDER_DAYS = 7;

/** Días de antelación configurados (REMINDER_DAYS), con valor por defecto. */
export const getReminderDays = () => {
  const value = Number.parseInt(process.env.REMINDER_DAYS, 10);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_REMINDER_DAYS;
};

/**
 * Ejecuta la tarea.
 * @param {object} [options]
 * @param {Date} [options.now] - Fecha de referencia (para tests).
 * @param {number} [options.daysAhead] - Días de antelación.
 * @param {{sendRenewalDigest: Function}} [options.emailService] - Servicio de email (inyectable en tests).
 * @param {import('@prisma/client').PrismaClient} [options.db]
 * @returns {Promise<{usersNotified: number, subscriptionsNotified: number, failed: number}>}
 */
export const sendRenewalReminders = async ({
  now = new Date(),
  daysAhead = getReminderDays(),
  emailService = new EmailService(),
  db = prisma,
} = {}) => {
  const today = startOfUtcDay(now);

  const subscriptions = await db.subscription.findMany({
    where: {
      status: 'ACTIVE',
      user: { renewalReminders: true, isBlocked: false },
    },
    include: {
      tool: { select: { name: true, url: true } },
      user: { select: { id: true, email: true, name: true, language: true } },
    },
  });

  // Quedarse con las que se renuevan dentro del plazo y aún no se han avisado
  const byUser = new Map();
  for (const subscription of subscriptions) {
    const nextRenewal = getNextRenewalDate(subscription, today);
    if (!nextRenewal) continue;

    const days = daysUntil(nextRenewal, today);
    if (days > daysAhead) continue;

    const alreadySent =
      subscription.reminderSentFor &&
      startOfUtcDay(subscription.reminderSentFor).getTime() === nextRenewal.getTime();
    if (alreadySent) continue;

    if (!byUser.has(subscription.userId)) {
      byUser.set(subscription.userId, { user: subscription.user, items: [] });
    }
    byUser.get(subscription.userId).items.push({ subscription, nextRenewal, days });
  }

  const result = { usersNotified: 0, subscriptionsNotified: 0, failed: 0 };

  for (const { user, items } of byUser.values()) {
    items.sort((a, b) => a.nextRenewal - b.nextRenewal);

    const sent = await emailService.sendRenewalDigest(user, items);
    if (!sent) {
      result.failed += 1;
      continue;
    }

    await db.$transaction(
      items.map(({ subscription, nextRenewal }) =>
        db.subscription.update({
          where: { id: subscription.id },
          data: { reminderSentFor: nextRenewal },
        }),
      ),
    );

    result.usersNotified += 1;
    result.subscriptionsNotified += items.length;
  }

  return result;
};
