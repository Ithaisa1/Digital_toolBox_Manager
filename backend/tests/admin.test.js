/**
 * Tests del panel de administración y del modo demo.
 */
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { resetDemoData } from '../src/demo/demoData.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../src/config/demo.js';

const clean = async () => {
  await prisma.movement.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.user.deleteMany();
};

const register = async (email, name = 'User') => {
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'Password123' });
  return { token: res.body.token, id: res.body.user.id };
};

const makeAdmin = (id) => prisma.user.update({ where: { id }, data: { role: 'ADMIN' } });
const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('Admin panel', () => {
  let admin;
  let user;

  beforeEach(async () => {
    await clean();
    admin = await register('boss@example.com', 'Boss');
    await makeAdmin(admin.id);
    user = await register('worker@example.com', 'Worker');
    await prisma.tool.create({ data: { name: 'Figma', type: 'Design', price: 15, userId: user.id } });
  });

  it('applies blocks and role changes immediately, even with an old token', async () => {
    await request(app).get('/api/tools').set(auth(user.token)).expect(200);
    await request(app).put(`/api/admin/users/${user.id}/block`).set(auth(admin.token)).expect(200);
    const blocked = await request(app).get('/api/tools').set(auth(user.token)).expect(403);
    expect(blocked.body.code).toBe('blocked');

    // Un admin al que se le quita el rol pierde el acceso al panel al momento
    const second = await register('second@example.com');
    await makeAdmin(second.id);
    await request(app).get('/api/admin/overview').set(auth(second.token)).expect(200);
    await request(app).put(`/api/admin/users/${second.id}/role`).set(auth(admin.token)).send({ role: 'USER' }).expect(200);
    await request(app).get('/api/admin/overview').set(auth(second.token)).expect(403);
  });

  it('rejects tokens of deleted users', async () => {
    await request(app).delete(`/api/admin/users/${user.id}`).set(auth(admin.token)).expect(200);
    const res = await request(app).get('/api/tools').set(auth(user.token)).expect(401);
    expect(res.body.code).toBe('userDeleted');
    expect(await prisma.tool.count()).toBe(0); // sus datos se borran con él
  });

  it('never lets an admin act on themselves or remove the last admin', async () => {
    const self = await request(app).put(`/api/admin/users/${admin.id}/role`).set(auth(admin.token)).send({ role: 'USER' }).expect(400);
    expect(self.body.code).toBe('self');
    await request(app).delete(`/api/admin/users/${admin.id}`).set(auth(admin.token)).expect(400);

    // El único admin no puede borrar su propia cuenta desde el perfil
    const profile = await request(app).delete('/api/auth/profile').set(auth(admin.token)).send({ currentPassword: 'Password123' }).expect(400);
    expect(profile.body.code).toBe('lastAdmin');
  });

  it('protects the last active admin from being blocked by another admin', async () => {
    const second = await register('second@example.com');
    await makeAdmin(second.id);
    // second bloquea a boss: queda second como único admin activo → permitido
    await request(app).put(`/api/admin/users/${admin.id}/block`).set(auth(second.token)).expect(200);
    // ahora nadie puede quitarle el rol a second (sería el último)
    const third = await register('third@example.com');
    await makeAdmin(third.id);
    await prisma.user.update({ where: { id: third.id }, data: { isBlocked: true } });
    await request(app).put(`/api/admin/users/${admin.id}/block`).set(auth(second.token)).expect(200); // desbloquear boss
    await request(app).put(`/api/admin/users/${second.id}/role`).set(auth(admin.token)).send({ role: 'USER' }).expect(200);
    const last = await request(app).put(`/api/admin/users/${admin.id}/role`).set(auth(second.token)).send({ role: 'USER' }).expect(403);
    expect(last.body.error).toBe('Admin access required'); // second ya no es admin
  });

  it('returns overview, filtered users, detail, tools, activity and system', async () => {
    const overview = await request(app).get('/api/admin/overview').set(auth(admin.token)).expect(200);
    expect(overview.body.users).toMatchObject({ total: 2, admins: 1, blocked: 0 });
    expect(overview.body.charts.signupsByMonth).toHaveLength(12);

    const admins = await request(app).get('/api/admin/users?role=ADMIN&page=1&limit=10').set(auth(admin.token)).expect(200);
    expect(admins.body.items.map((u) => u.email)).toEqual(['boss@example.com']);

    const detail = await request(app).get(`/api/admin/users/${user.id}`).set(auth(admin.token)).expect(200);
    expect(detail.body).toMatchObject({ email: 'worker@example.com', toolsCount: 1 });
    expect(detail.body.tools[0].name).toBe('Figma');

    const tools = await request(app).get('/api/admin/tools?q=worker').set(auth(admin.token)).expect(200);
    expect(tools.body.map((t) => t.owner.email)).toEqual(['worker@example.com']);

    const activity = await request(app).get('/api/admin/activity').set(auth(admin.token)).expect(200);
    expect(activity.body).toHaveProperty('items');

    const system = await request(app).get('/api/admin/system').set(auth(admin.token)).expect(200);
    expect(system.body.database.connected).toBe(true);
    expect(system.body.database.lastMigration).toMatch(/default_categories|renewal/);
  });

  it('is closed to regular users', async () => {
    for (const path of ['overview', 'users', 'tools', 'activity', 'system']) {
      await request(app).get(`/api/admin/${path}`).set(auth(user.token)).expect(403);
    }
  });
});

describe('Demo mode', () => {
  const original = process.env.DEMO_MODE;
  afterEach(() => {
    if (original === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = original;
  });

  it('is off by default: no public accounts and no reset job', async () => {
    delete process.env.DEMO_MODE;
    const meta = await request(app).get('/api/meta').expect(200);
    expect(meta.body).toMatchObject({ demo: false, accounts: [] });
    process.env.CRON_SECRET = 'cron-test';
    await request(app).post('/api/jobs/demo-reset').set('Authorization', 'Bearer cron-test').expect(404);
  });

  it('loads realistic data, exposes demo accounts and protects them', async () => {
    process.env.DEMO_MODE = 'true';
    await clean();
    const result = await resetDemoData(prisma);
    expect(result.users).toBeGreaterThan(20);
    expect(result.tools).toBeGreaterThan(80);
    expect(result.subscriptions).toBeGreaterThan(40);

    const meta = await request(app).get('/api/meta').expect(200);
    expect(meta.body.accounts.map((a) => a.role)).toEqual(['ADMIN', 'USER']);

    const login = (email) => request(app).post('/api/auth/login').send({ email, password: DEMO_PASSWORD });
    const adminLogin = await login(DEMO_ACCOUNTS[0].email).expect(200);
    const userLogin = await login(DEMO_ACCOUNTS[1].email).expect(200);
    const adminToken = adminLogin.body.token;
    const demoUserId = userLogin.body.user.id;

    // La usuaria demo tiene datos para enseñar
    const stats = await request(app).get('/api/dashboard/stats').set(auth(userLogin.body.token)).expect(200);
    expect(stats.body.subscriptions.total).toBeGreaterThanOrEqual(10);
    expect(stats.body.subscriptions.upcomingRenewals).toBeGreaterThan(0);

    // Nadie puede estropear las cuentas de demo
    for (const [method, path, body] of [
      ['put', `/api/admin/users/${demoUserId}/block`],
      ['put', `/api/admin/users/${demoUserId}/role`, { role: 'ADMIN' }],
      ['delete', `/api/admin/users/${demoUserId}`],
    ]) {
      const res = await request(app)[method](path).set(auth(adminToken)).send(body || {}).expect(400);
      expect(res.body.code).toBe('demoProtected');
    }
    const pwd = await request(app).put('/api/auth/profile').set(auth(userLogin.body.token))
      .send({ currentPassword: DEMO_PASSWORD, newPassword: 'hacked123' }).expect(403);
    expect(pwd.body.code).toBe('demoProtected');
    await request(app).delete('/api/auth/profile').set(auth(userLogin.body.token)).send({ currentPassword: DEMO_PASSWORD }).expect(403);

    // Los usuarios de ejemplo (no demo) no pueden iniciar sesión
    const sample = await prisma.user.findFirst({ where: { email: 'maria.lopez@example.com' } });
    expect(sample).not.toBeNull();
    await request(app).post('/api/auth/login').send({ email: sample.email, password: DEMO_PASSWORD }).expect(401);

    // El reinicio nocturno borra los cambios de los visitantes
    await prisma.tool.create({ data: { name: 'Visitor tool', type: 'X', userId: demoUserId } });
    process.env.CRON_SECRET = 'cron-test';
    await request(app).post('/api/jobs/demo-reset').set('Authorization', 'Bearer cron-test').expect(200);
    expect(await prisma.tool.count({ where: { name: 'Visitor tool' } })).toBe(0);
  });
});
