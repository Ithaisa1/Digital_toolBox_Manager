/**
 * Tests de paginación y búsqueda en los endpoints de listas.
 */
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { parsePagination, parseSearch, MAX_LIMIT } from '../src/utils/pagination.js';

describe('parsePagination / parseSearch', () => {
  it('returns null when no page or limit is sent', () => {
    expect(parsePagination({})).toBeNull();
  });

  it('applies defaults and limits', () => {
    expect(parsePagination({ page: '2' })).toEqual({ page: 2, limit: 20, skip: 20 });
    expect(parsePagination({ page: '-3', limit: '0' })).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination({ limit: '5000' }).limit).toBe(MAX_LIMIT);
    expect(parsePagination({ page: 'abc', limit: '5' })).toEqual({ page: 1, limit: 5, skip: 0 });
  });

  it('cleans the search text', () => {
    expect(parseSearch({ q: '  figma ' })).toBe('figma');
    expect(parseSearch({ q: '   ' })).toBeNull();
    expect(parseSearch({ q: ['a', 'b'] })).toBeNull();
  });
});

describe('List endpoints', () => {
  let token;
  let userId;

  const register = async (email, name = 'User') => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password: 'Password123' });
    return res.body;
  };

  beforeEach(async () => {
    await prisma.movement.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.tool.deleteMany();
    await prisma.user.deleteMany();

    const body = await register('owner@example.com', 'Owner');
    token = body.token;
    userId = body.user.id;

    await prisma.tool.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        name: i === 7 ? 'Figma' : `Tool ${String(i).padStart(2, '0')}`,
        type: 'SaaS',
        userId,
      })),
    });
  });

  it('keeps returning a plain array when not paginating', async () => {
    const res = await request(app).get('/api/tools').set('Authorization', `Bearer ${token}`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(25);
  });

  it('returns a page with totals', async () => {
    const res = await request(app)
      .get('/api/tools?page=3&limit=10')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.items).toHaveLength(5);
    expect(res.body).toMatchObject({ total: 25, page: 3, limit: 10, totalPages: 3 });
  });

  it('searches without caring about upper/lower case', async () => {
    const res = await request(app)
      .get('/api/tools?q=FIG')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.map((tool) => tool.name)).toEqual(['Figma']);
  });

  it('never returns tools from other users', async () => {
    const other = await register('other@example.com');
    const res = await request(app)
      .get('/api/tools?page=1&limit=50')
      .set('Authorization', `Bearer ${other.token}`)
      .expect(200);

    expect(res.body.total).toBe(0);
  });

  it('paginates and searches subscriptions by tool name', async () => {
    const tools = await prisma.tool.findMany({ where: { userId }, take: 3, orderBy: { name: 'asc' } });
    for (const tool of tools) {
      await prisma.subscription.create({
        data: { toolId: tool.id, userId, renewalDate: new Date('2027-01-01'), price: 5, billingCycle: 'monthly' },
      });
    }

    const page = await request(app)
      .get('/api/subscriptions?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(page.body).toMatchObject({ total: 3, totalPages: 2 });
    expect(page.body.items).toHaveLength(2);

    const search = await request(app)
      .get(`/api/subscriptions?q=${encodeURIComponent(tools[0].name)}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(search.body).toHaveLength(1);
  });

  it('lets admins search and paginate users', async () => {
    await register('ana@example.com', 'Ana García');
    await register('bob@example.com', 'Bob');
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'Password123' });
    const adminToken = login.body.token;

    const search = await request(app)
      .get(`/api/admin/users?q=${encodeURIComponent('garcía')}&page=1&limit=10`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(search.body.total).toBe(1);
    expect(search.body.items[0].email).toBe('ana@example.com');

    const page = await request(app)
      .get('/api/admin/users?page=2&limit=2')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(page.body).toMatchObject({ total: 3, totalPages: 2 });
    expect(page.body.items).toHaveLength(1);
  });

  it('blocks non-admins from the users list', async () => {
    await request(app).get('/api/admin/users').set('Authorization', `Bearer ${token}`).expect(403);
  });
});
