/**
 * Tests de integración: importación de herramientas desde CSV.
 */
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

describe('POST /api/tools/import', () => {
  let token;
  let userId;

  const register = (email) =>
    request(app).post('/api/auth/register').send({ name: 'User', email, password: 'Password123' }).then((r) => r.body);

  const importCsv = (csv, dryRun, auth = token) =>
    request(app).post('/api/tools/import').set('Authorization', `Bearer ${auth}`).send({ csv, dryRun });

  beforeEach(async () => {
    await prisma.movement.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.tool.deleteMany();
    await prisma.user.deleteMany();
    const body = await register('importer@example.com');
    token = body.token;
    userId = body.user.id;
    await prisma.tool.create({ data: { name: 'Figma', type: 'Design', userId } });
  });

  const csv = 'name,type,price,url\nFigma,Design,15,figma.com\nNotion,Docs,"8,50",notion.so\nBad,,abc,';

  it('previews without creating anything', async () => {
    const res = await importCsv(csv, true).expect(200);

    expect(res.body.summary).toEqual({ total: 3, valid: 1, duplicates: 1, invalid: 1 });
    expect(res.body.created).toBeUndefined();
    expect(await prisma.tool.count({ where: { userId } })).toBe(1);
  });

  it('creates only the valid new rows and logs a movement for each', async () => {
    const res = await importCsv(csv, false).expect(200);
    expect(res.body.created).toBe(1);

    const notion = await prisma.tool.findFirst({ where: { userId, name: 'Notion' } });
    expect(notion).toMatchObject({ type: 'Docs', price: 8.5, url: 'https://notion.so/' });
    expect(await prisma.movement.count({ where: { toolId: notion.id, type: 'CREATED' } })).toBe(1);
    expect(await prisma.tool.count({ where: { userId } })).toBe(2);
  });

  it('does not duplicate when importing the same file twice', async () => {
    await importCsv(csv, false).expect(200);
    const second = await importCsv(csv, false).expect(200);
    expect(second.body.created).toBe(0);
    expect(await prisma.tool.count({ where: { userId } })).toBe(2);
  });

  it('round-trips the app own CSV export into another account', async () => {
    const exported = await request(app)
      .get('/api/export/data?format=csv&include=tools')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const other = await register('other@example.com');
    const res = await importCsv(exported.text, false, other.token).expect(200);

    expect(res.body.created).toBe(1);
    expect(await prisma.tool.findFirst({ where: { userId: other.user.id } })).toMatchObject({ name: 'Figma' });
  });

  it('rejects empty or unusable files', async () => {
    expect((await importCsv('', true).expect(400)).body.code).toBe('emptyFile');
    expect((await importCsv('foo,bar\n1,2', true).expect(400)).body.code).toBe('missingNameColumn');
  });

  it('requires authentication', async () => {
    await request(app).post('/api/tools/import').send({ csv }).expect(401);
  });
});
