/**
 * Panel de control del administrador: resumen, usuarios, herramientas, actividad y sistema.
 * Todas las rutas exigen rol ADMIN (ver routes/admin.js).
 */

import prisma from '../config/database.js';
import { contains, findPage, parsePagination, parseSearch } from '../utils/pagination.js';
import { monthlyEquivalent } from '../utils/dashboardCharts.js';
import { isDemoMode, isProtectedDemoAccount } from '../config/demo.js';
import EmailService from '../utils/emailService.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const round2 = (value) => Math.round(value * 100) / 100;

/** Últimos N meses (incluido el actual) como claves YYYY-MM. */
const lastMonths = (count, now = new Date()) =>
  Array.from({ length: count }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  });

const monthKeyOf = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ */
/* Resumen                                                              */
/* ------------------------------------------------------------------ */

/** KPIs y gráficos globales de la plataforma. */
export const getOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * DAY_MS);
    const since365 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

    const [
      usersTotal, usersBlocked, admins, usersNew30, activeUserIds,
      toolsByStatus, subsByStatus, activeSubs, categoriesTotal, movements30,
      signups, recentActivity, toolGroups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      prisma.movement.findMany({ where: { createdAt: { gte: since30 } }, distinct: ['userId'], select: { userId: true } }),
      prisma.tool.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { price: true, billingCycle: true, tool: { select: { category: { select: { name: true } } } } },
      }),
      prisma.category.count(),
      prisma.movement.count({ where: { createdAt: { gte: since30 } } }),
      prisma.user.findMany({ where: { createdAt: { gte: since365 } }, select: { createdAt: true } }),
      prisma.movement.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { tool: { select: { name: true } }, user: { select: { name: true, email: true } } },
      }),
      prisma.tool.groupBy({ by: ['name'], _count: { _all: true }, orderBy: { _count: { name: 'desc' } }, take: 8 }),
    ]);

    const countBy = (groups) =>
      groups.reduce((acc, g) => ({ ...acc, [g.status]: g._count._all }), {});

    const mrr = activeSubs.reduce((sum, s) => sum + monthlyEquivalent(s), 0);

    const byCategory = new Map();
    for (const s of activeSubs) {
      const name = s.tool?.category?.name || 'Uncategorized';
      byCategory.set(name, (byCategory.get(name) || 0) + monthlyEquivalent(s));
    }

    const months = lastMonths(12, now);
    const signupCounts = Object.fromEntries(months.map((m) => [m, 0]));
    for (const { createdAt } of signups) {
      const key = monthKeyOf(createdAt);
      if (key in signupCounts) signupCounts[key] += 1;
    }

    res.json({
      users: {
        total: usersTotal,
        admins,
        blocked: usersBlocked,
        new30d: usersNew30,
        active30d: activeUserIds.length,
      },
      tools: { total: Object.values(countBy(toolsByStatus)).reduce((a, b) => a + b, 0), byStatus: countBy(toolsByStatus) },
      subscriptions: {
        total: Object.values(countBy(subsByStatus)).reduce((a, b) => a + b, 0),
        byStatus: countBy(subsByStatus),
        monthlySpend: round2(mrr),
        yearlySpend: round2(mrr * 12),
        averagePerUser: usersTotal ? round2(mrr / usersTotal) : 0,
      },
      categories: categoriesTotal,
      activity30d: movements30,
      charts: {
        signupsByMonth: months.map((month) => ({ month, count: signupCounts[month] })),
        spendByCategory: [...byCategory.entries()]
          .map(([category, monthlyCost]) => ({ category, monthlyCost: round2(monthlyCost) }))
          .sort((a, b) => b.monthlyCost - a.monthlyCost),
        topTools: toolGroups.map((g) => ({ name: g.name, users: g._count._all })),
      },
      recentActivity: recentActivity.map(serializeMovement),
    });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* Usuarios                                                             */
/* ------------------------------------------------------------------ */

const USER_SORTS = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  name: { name: 'asc' },
  email: { email: 'asc' },
};

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isBlocked: user.isBlocked,
  language: user.language,
  renewalReminders: user.renewalReminders,
  createdAt: user.createdAt,
  toolsCount: user._count?.tools ?? 0,
  subscriptionsCount: user._count?.subscriptions ?? 0,
  isProtected: isProtectedDemoAccount(user.email),
});

/**
 * Lista de usuarios.
 * Query: q (nombre o email), role (ADMIN|USER), status (active|blocked), sort (newest|oldest|name|email), page, limit.
 */
export const getAdminUsers = async (req, res, next) => {
  try {
    const search = parseSearch(req.query);
    const where = {};
    if (search) where.OR = [{ name: contains(search) }, { email: contains(search) }];
    if (['ADMIN', 'USER'].includes(req.query.role)) where.role = req.query.role;
    if (req.query.status === 'blocked') where.isBlocked = true;
    if (req.query.status === 'active') where.isBlocked = false;

    const result = await findPage(prisma.user, {
      where,
      orderBy: USER_SORTS[req.query.sort] || USER_SORTS.newest,
      include: { _count: { select: { tools: true, subscriptions: true } } },
    }, parsePagination(req.query), serializeUser);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/** Detalle de un usuario con sus herramientas, suscripciones y últimos movimientos. */
export const getAdminUserDetail = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { tools: true, subscriptions: true, movements: true } },
        tools: { orderBy: { createdAt: 'desc' }, take: 50, include: { category: { select: { name: true } } } },
        subscriptions: { orderBy: { renewalDate: 'asc' }, include: { tool: { select: { name: true } } } },
        movements: { orderBy: { createdAt: 'desc' }, take: 10, include: { tool: { select: { name: true } } } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const active = user.subscriptions.filter((s) => s.status === 'ACTIVE');
    res.json({
      ...serializeUser(user),
      movementsCount: user._count.movements,
      monthlySpend: round2(active.reduce((sum, s) => sum + monthlyEquivalent(s), 0)),
      tools: user.tools.map((t) => ({ id: t.id, name: t.name, type: t.type, price: t.price, status: t.status, category: t.category?.name || null })),
      subscriptions: user.subscriptions.map((s) => ({
        id: s.id, tool: s.tool?.name, plan: s.plan, price: s.price, billingCycle: s.billingCycle, status: s.status, renewalDate: s.renewalDate,
      })),
      recentActivity: user.movements.map(serializeMovement),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Comprueba si el admin puede modificar a otro usuario.
 * @returns {string|null} Código de error o null si se permite.
 */
const checkCanModify = async (actor, target, { removesAdmin = false } = {}) => {
  if (actor.userId === target.id) return 'self';
  if (isProtectedDemoAccount(target.email)) return 'demoProtected';
  if (removesAdmin && target.role === 'ADMIN') {
    const otherActiveAdmins = await prisma.user.count({
      where: { role: 'ADMIN', isBlocked: false, id: { not: target.id } },
    });
    if (otherActiveAdmins === 0) return 'lastAdmin';
  }
  return null;
};

const MODIFY_ERRORS = {
  self: 'You cannot do this to your own account',
  demoProtected: 'Demo accounts cannot be modified',
  lastAdmin: 'There must be at least one active admin',
};

const rejectModify = (res, code) => res.status(400).json({ error: MODIFY_ERRORS[code], code });

/** Bloquea o desbloquea a un usuario. */
export const toggleUserBlock = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = await checkCanModify(req.user, user, { removesAdmin: !user.isBlocked });
    if (code) return rejectModify(res, code);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isBlocked: !user.isBlocked },
      include: { _count: { select: { tools: true, subscriptions: true } } },
    });
    res.json(serializeUser(updated));
  } catch (error) {
    next(error);
  }
};

/** Cambia el rol (ADMIN | USER). */
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body || {};
    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be ADMIN or USER' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === role) return res.json(serializeUser({ ...user, _count: undefined }));

    const code = await checkCanModify(req.user, user, { removesAdmin: role === 'USER' });
    if (code) return rejectModify(res, code);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role },
      include: { _count: { select: { tools: true, subscriptions: true } } },
    });
    res.json(serializeUser(updated));
  } catch (error) {
    next(error);
  }
};

/** Elimina un usuario y todos sus datos. */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const code = await checkCanModify(req.user, user, { removesAdmin: true });
    if (code) return rejectModify(res, code);

    await prisma.user.delete({ where: { id: user.id } });
    res.json({ message: 'User deleted', id: user.id });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* Herramientas de todos los usuarios                                   */
/* ------------------------------------------------------------------ */

/** Query: q (herramienta o dueño), categoryId, status, page, limit. */
export const getAdminTools = async (req, res, next) => {
  try {
    const search = parseSearch(req.query);
    const where = {};
    if (search) {
      where.OR = [
        { name: contains(search) },
        { type: contains(search) },
        { user: { name: contains(search) } },
        { user: { email: contains(search) } },
      ];
    }
    if (req.query.categoryId === 'none') where.categoryId = null;
    else if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(req.query.status)) where.status = req.query.status;

    const result = await findPage(prisma.tool, {
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { subscriptions: true } },
      },
    }, parsePagination(req.query), (t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      price: t.price,
      status: t.status,
      category: t.category?.name || null,
      owner: t.user,
      subscriptionsCount: t._count.subscriptions,
      createdAt: t.createdAt,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* Actividad                                                            */
/* ------------------------------------------------------------------ */

const MOVEMENT_TYPES = ['CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGE', 'PRICE_CHANGE'];

function serializeMovement(m) {
  return {
    id: m.id,
    type: m.type,
    description: m.description,
    createdAt: m.createdAt,
    tool: m.tool?.name || null,
    user: m.user ? { name: m.user.name, email: m.user.email } : undefined,
  };
}

/** Registro de actividad de toda la plataforma. Query: q, type, page, limit. */
export const getAdminActivity = async (req, res, next) => {
  try {
    const search = parseSearch(req.query);
    const where = {};
    if (search) {
      where.OR = [
        { description: contains(search) },
        { user: { name: contains(search) } },
        { user: { email: contains(search) } },
      ];
    }
    if (MOVEMENT_TYPES.includes(req.query.type)) where.type = req.query.type;

    const result = await findPage(prisma.movement, {
      where,
      orderBy: { createdAt: 'desc' },
      include: { tool: { select: { name: true } }, user: { select: { name: true, email: true } } },
    }, parsePagination(req.query) || { page: 1, limit: 50, skip: 0 }, serializeMovement);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ */
/* Sistema                                                              */
/* ------------------------------------------------------------------ */

/** Estado del sistema: base de datos, configuración y versión. */
export const getSystemStatus = async (req, res, next) => {
  try {
    const started = Date.now();
    let database = { connected: false, latencyMs: null, lastMigration: null };
    try {
      const rows = await prisma.$queryRaw`
        SELECT migration_name, finished_at FROM _prisma_migrations
        WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1`;
      database = {
        connected: true,
        latencyMs: Date.now() - started,
        lastMigration: rows[0]?.migration_name || null,
      };
    } catch {
      database.latencyMs = Date.now() - started;
    }

    const [users, tools, subscriptions, movements, categories] = await Promise.all([
      prisma.user.count(), prisma.tool.count(), prisma.subscription.count(),
      prisma.movement.count(), prisma.category.count(),
    ]).catch(() => [null, null, null, null, null]);

    res.json({
      database,
      records: { users, tools, subscriptions, movements, categories },
      config: {
        environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
        hosting: process.env.VERCEL ? 'Vercel' : 'Local',
        region: process.env.VERCEL_REGION || null,
        demoMode: isDemoMode(),
        emailConfigured: EmailService.isConfigured(),
        cronConfigured: Boolean(process.env.CRON_SECRET),
        reminderDays: Number(process.env.REMINDER_DAYS) || 7,
      },
      version: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : null,
        branch: process.env.VERCEL_GIT_COMMIT_REF || null,
        node: process.version,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
