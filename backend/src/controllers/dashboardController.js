/**
 * Controlador del panel de control: estadísticas del usuario y métricas globales de administrador.
 * Agrega datos de herramientas, suscripciones, categorías y actividad reciente.
 */

import prisma from '../config/database.js';

/**
 * Devuelve estadísticas resumidas del dashboard del usuario autenticado.
 * Incluye herramientas por estado, coste mensual, renovaciones próximas y agrupación por herramienta.
 * @param {import('express').Request} req - req.user.userId del middleware de autenticación.
 * @param {import('express').Response} res - 200 con objeto tools, subscriptions, categories y expensiveTools.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Conteo de herramientas agrupado por estado
    const toolsByStatus = await prisma.tool.groupBy({
      by: ['status'],
      where: { userId },
      _count: {
        _all: true,
      },
    });

    // Suscripciones activas y cálculo de coste mensual equivalente
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { tool: true },
    });

    const totalSubscriptions = subscriptions.length;
    const monthlyCost = subscriptions.reduce((sum, sub) => {
      return sum + (sub.billingCycle === 'monthly' ? sub.price : sub.price / 12);
    }, 0);

    // Distribución de herramientas por categoría
    const toolsByCategory = await prisma.tool.groupBy({
      by: ['categoryId'],
      where: { userId },
      _count: {
        _all: true,
      },
    });

    // Renovaciones en los próximos 30 días
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const upcomingRenewals = await prisma.subscription.count({
      where: {
        userId,
        status: 'ACTIVE',
        renewalDate: { lte: date },
      },
    });

    // Top 5 herramientas con mayor precio declarado
    const expensiveTools = await prisma.tool.findMany({
      where: { userId, price: { not: null } },
      orderBy: { price: 'desc' },
      take: 5,
      include: { category: true },
    });

    // Todas las suscripciones activas para agrupar por herramienta y plan
    const allSubscriptions = await prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        tool: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { renewalDate: 'asc' },
    });

    // Agrupar suscripciones por nombre de herramienta con detalle de planes
    const subscriptionsByTool = allSubscriptions.reduce((acc, sub) => {
      const toolName = sub.tool.name;
      if (!acc[toolName]) {
        acc[toolName] = {
          toolId: sub.tool.id,
          toolName: sub.tool.name,
          category: sub.tool.category?.name || 'Uncategorized',
          price: sub.tool.price,
          subscriptions: [],
        };
      }
      acc[toolName].subscriptions.push({
        id: sub.id,
        plan: sub.plan || 'Default',
        price: sub.price,
        billingCycle: sub.billingCycle,
        renewalDate: sub.renewalDate,
        status: sub.status,
      });
      return acc;
    }, {});

    // Convertir a array y ordenar por precio de herramienta descendente
    const subscriptionsGrouped = Object.values(subscriptionsByTool).sort(
      (a, b) => b.price - a.price
    );

    res.json({
      tools: {
        total: toolsByStatus.reduce((sum, item) => sum + item._count._all, 0),
        byStatus: toolsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count._all;
          return acc;
        }, {}),
      },
      subscriptions: {
        total: totalSubscriptions,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        upcomingRenewals,
        byTool: subscriptionsGrouped,
      },
      categories: toolsByCategory.length,
      expensiveTools,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Devuelve estadísticas globales de la plataforma (solo rol ADMIN).
 * @param {import('express').Request} req - req.user.role debe ser 'ADMIN'.
 * @param {import('express').Response} res - 200 con métricas de usuarios, herramientas, suscripciones y actividad, o 403.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getAdminStats = async (req, res, next) => {
  try {
    // Comprobar permisos de administrador
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Cargar usuarios con conteo de herramientas
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            tools: true
          }
        }
      }
    });

    const tools = await prisma.tool.findMany({
      include: {
        category: true,
        subscriptions: true
      }
    });

    const subscriptions = await prisma.subscription.findMany({
      include: {
        tool: true
      }
    });

    const categories = await prisma.category.findMany();

    // Métricas agregadas de usuarios y herramientas
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(user.createdAt) >= thirtyDaysAgo;
    }).length;
    const blockedUsers = users.filter((user) => user.isBlocked).length;

    const newUsersThisMonth = users.filter(user => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(user.createdAt) >= thirtyDaysAgo;
    }).length;

    const totalTools = tools.length;
    const activeTools = tools.filter(tool => tool.status === 'ACTIVE').length;
    const inactiveTools = tools.filter(tool => tool.status === 'INACTIVE').length;

    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'ACTIVE');
    const monthlyRevenue = activeSubscriptions.reduce((acc, sub) => acc + (sub.price || 0), 0);

    // Últimos movimientos del sistema
    const recentActivity = await prisma.movement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: { name: true }
        }
      }
    });

    // Usuarios con más herramientas registradas
    const topUsers = users
      .sort((a, b) => (b._count?.tools || 0) - (a._count?.tools || 0))
      .slice(0, 5)
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        _count: user._count
      }));

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers,
        newThisMonth: newUsersThisMonth,
      },
      tools: {
        total: totalTools,
        active: activeTools,
        inactive: inactiveTools,
      },
      subscriptions: {
        total: totalSubscriptions,
        monthlyRevenue,
      },
      categories: {
        total: categories.length,
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        createdAt: activity.createdAt,
        tool: activity.tool?.name || 'Unknown',
      })),
      topUsers,
    });
  } catch (error) {
    next(error);
  }
};
