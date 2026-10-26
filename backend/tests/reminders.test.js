/**
 * Tests de integración: avisos de renovación por email.
 * El servicio de email se sustituye por uno falso que guarda lo que "envía".
 */
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { sendRenewalReminders } from '../src/jobs/renewalReminders.js';

const now = new Date('2026-10-25T09:00:00Z');

const fakeEmail = (ok = true) => {
  const sent = [];
  return {
    sent,
    sendRenewalDigest: async (user, items) => {
      sent.push({ user, items });
      return ok;
    },
  };
};

const createUser = (email, extra = {}) =>
  prisma.user.create({ data: { email, name: 'Test', password: 'x', ...extra } });

const createSubscription = async (user, name, renewalDate, extra = {}) => {
  const tool = await prisma.tool.create({ data: { name, type: 'SaaS', userId: user.id } });
  return prisma.subscription.create({
    data: { toolId: tool.id, userId: user.id, renewalDate: new Date(renewalDate), price: 10, billingCycle: 'monthly', ...extra },
  });
};

describe('sendRenewalReminders', () => {
  beforeEach(async () => {
    await prisma.subscription.deleteMany();
    await prisma.tool.deleteMany();
    await prisma.user.deleteMany();
  });

  it('sends one email per user with the subscriptions due soon', async () => {
    const user = await createUser('a@example.com');
    await createSubscription(user, 'Figma', '2026-10-27');
    await createSubscription(user, 'Notion', '2026-10-30');
    await createSubscription(user, 'Slack', '2026-12-20'); // fuera de plazo

    const email = fakeEmail();
    const result = await sendRenewalReminders({ now, daysAhead: 7, emailService: email });

    expect(result).toEqual({ usersNotified: 1, subscriptionsNotified: 2, failed: 0 });
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].items.map((i) => i.subscription.tool.name)).toEqual(['Figma', 'Notion']);
    expect(email.sent[0].items.map((i) => i.days)).toEqual([2, 5]);
  });

  it('does not repeat a reminder for the same renewal', async () => {
    const user = await createUser('b@example.com');
    await createSubscription(user, 'Figma', '2026-10-27');

    await sendRenewalReminders({ now, emailService: fakeEmail() });
    const second = fakeEmail();
    await sendRenewalReminders({ now: new Date('2026-10-26T09:00:00Z'), emailService: second });

    expect(second.sent).toHaveLength(0);
  });

  it('reminds again for the next cycle of a monthly plan', async () => {
    const user = await createUser('c@example.com');
    await createSubscription(user, 'Figma', '2026-10-27');

    await sendRenewalReminders({ now, emailService: fakeEmail() });
    const nextMonth = fakeEmail();
    await sendRenewalReminders({ now: new Date('2026-11-24T09:00:00Z'), emailService: nextMonth });

    expect(nextMonth.sent).toHaveLength(1);
    expect(nextMonth.sent[0].items[0].nextRenewal.toISOString().slice(0, 10)).toBe('2026-11-27');
  });

  it('skips users who turned reminders off, blocked users and inactive subscriptions', async () => {
    const off = await createUser('off@example.com', { renewalReminders: false });
    const blocked = await createUser('blocked@example.com', { isBlocked: true });
    const active = await createUser('on@example.com');
    await createSubscription(off, 'A', '2026-10-27');
    await createSubscription(blocked, 'B', '2026-10-27');
    await createSubscription(active, 'C', '2026-10-27', { status: 'INACTIVE' });

    const email = fakeEmail();
    await sendRenewalReminders({ now, emailService: email });

    expect(email.sent).toHaveLength(0);
  });

  it('retries next time if the email could not be sent', async () => {
    const user = await createUser('d@example.com');
    await createSubscription(user, 'Figma', '2026-10-27');

    const failing = fakeEmail(false);
    const result = await sendRenewalReminders({ now, emailService: failing });
    expect(result.failed).toBe(1);

    const retry = fakeEmail();
    await sendRenewalReminders({ now, emailService: retry });
    expect(retry.sent).toHaveLength(1);
  });
});

describe('POST /api/jobs/renewal-reminders', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env.CRON_SECRET = original.CRON_SECRET;
    process.env.EMAIL_USER = original.EMAIL_USER;
    process.env.EMAIL_PASSWORD = original.EMAIL_PASSWORD;
  });

  it('returns 503 when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;
    await request(app).post('/api/jobs/renewal-reminders').expect(503);
  });

  it('rejects a missing or wrong secret', async () => {
    process.env.CRON_SECRET = 'right-secret';
    await request(app).post('/api/jobs/renewal-reminders').expect(401);
    await request(app)
      .post('/api/jobs/renewal-reminders')
      .set('Authorization', 'Bearer wrong-secret')
      .expect(401);
  });

  it('returns 503 when email is not configured', async () => {
    process.env.CRON_SECRET = 'right-secret';
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASSWORD;
    await request(app)
      .post('/api/jobs/renewal-reminders')
      .set('Authorization', 'Bearer right-secret')
      .expect(503);
  });
});

describe('Profile renewalReminders preference', () => {
  it('can be read and turned off', async () => {
    await prisma.user.deleteMany();
    const register = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Pref User', email: 'pref@example.com', password: 'Password123' });
    const token = register.body.token;

    const profile = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`).expect(200);
    expect(profile.body.renewalReminders).toBe(true);

    const updated = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ renewalReminders: false })
      .expect(200);
    expect(updated.body.user.renewalReminders).toBe(false);
  });
});
