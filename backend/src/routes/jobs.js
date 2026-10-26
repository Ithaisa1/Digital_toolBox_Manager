/**
 * Tareas programadas que se lanzan desde fuera (GitHub Actions u otro cron).
 * Prefijo montado en la app: /api/jobs
 * Protegidas con la cabecera `Authorization: Bearer <CRON_SECRET>`.
 */
import express from 'express';
import crypto from 'crypto';
import EmailService from '../utils/emailService.js';
import { sendRenewalReminders } from '../jobs/renewalReminders.js';

const router = express.Router();

/** Comprueba el secreto compartido sin filtrar información por tiempos. */
const requireCronSecret = (req, res, next) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ error: 'CRON_SECRET is not configured' });
  }

  const header = req.get('authorization') || '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = crypto.createHash('sha256').update(provided).digest();
  const b = crypto.createHash('sha256').update(secret).digest();

  if (!provided || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

router.post('/renewal-reminders', requireCronSecret, async (req, res, next) => {
  try {
    if (!EmailService.isConfigured()) {
      return res.status(503).json({ error: 'Email is not configured (EMAIL_USER / EMAIL_PASSWORD)' });
    }
    const result = await sendRenewalReminders();
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
