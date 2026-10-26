/**
 * Tareas programadas (cron de Vercel u otro servicio externo).
 * Prefijo montado en la app: /api/jobs
 * Protegidas con la cabecera `Authorization: Bearer <CRON_SECRET>`.
 */
import express from 'express';
import crypto from 'crypto';
import EmailService from '../utils/emailService.js';
import { sendRenewalReminders } from '../jobs/renewalReminders.js';
import prisma from '../config/database.js';
import { isDemoMode } from '../config/demo.js';
import { resetDemoData } from '../demo/demoData.js';

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

const runRenewalReminders = async (req, res, next) => {
  try {
    if (!EmailService.isConfigured()) {
      return res.status(503).json({ error: 'Email is not configured (EMAIL_USER / EMAIL_PASSWORD)' });
    }
    const result = await sendRenewalReminders();
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET lo usa el cron de Vercel (envía Authorization: Bearer <CRON_SECRET>); POST, cualquier otro cron
router.get('/renewal-reminders', requireCronSecret, runRenewalReminders);
router.post('/renewal-reminders', requireCronSecret, runRenewalReminders);

// Web de demo: cada noche se borran los cambios de los visitantes y se recargan los datos
const runDemoReset = async (req, res, next) => {
  try {
    if (!isDemoMode()) return res.status(404).json({ error: 'Not found' });
    const result = await resetDemoData(prisma);
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
};

router.get('/demo-reset', requireCronSecret, runDemoReset);
router.post('/demo-reset', requireCronSecret, runDemoReset);

export default router;
