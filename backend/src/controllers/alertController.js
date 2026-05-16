/**
 * Controlador de alertas y renovaciones próximas.
 * Gestiona notificaciones de suscripciones, CRUD de alertas y marcado de lectura.
 */

import prisma from '../config/database.js';

/**
 * Lista suscripciones activas con renovación en los próximos 30 días.
 * Incluye días restantes hasta la renovación por cada suscripción.
 * @param {import('express').Request} req - req.user.userId del middleware de autenticación.
 * @param {import('express').Response} res - 200 con data (array formateado) y count.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = await prisma.subscription.findMany({
      where: {
        userId: userId,
        renewalDate: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        status: 'ACTIVE'
      },
      include: {
        tool: {
          select: {
            name: true,
            url: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        renewalDate: 'asc'
      }
    });

    // Formatear respuesta con metadatos útiles para la UI
    const formattedRenewals = upcomingRenewals.map(sub => ({
      id: sub.id,
      toolName: sub.tool.name,
      toolUrl: sub.tool.url,
      categoryName: sub.tool.category?.name || 'Uncategorized',
      renewalDate: sub.renewalDate,
      price: sub.price,
      billingCycle: sub.billingCycle,
      daysUntilRenewal: Math.ceil((sub.renewalDate - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      data: formattedRenewals,
      count: formattedRenewals.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una alerta asociada a una suscripción del usuario.
 * @param {import('express').Request} req - body: { subscriptionId, type, message, scheduledFor? }.
 * @param {import('express').Response} res - 201 con la alerta creada.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const createAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { subscriptionId, type, message, scheduledFor } = req.body;

    const alert = await prisma.alert.create({
      data: {
        userId,
        subscriptionId,
        type,
        message,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        isRead: false
      }
    });

    res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene las alertas del usuario, opcionalmente solo las no leídas.
 * @param {import('express').Request} req - query: { unreadOnly?: boolean }.
 * @param {import('express').Response} res - 200 con data (alertas) y count.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getUserAlerts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { unreadOnly = false } = req.query;

    const alerts = await prisma.alert.findMany({
      where: {
        userId,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marca una alerta como leída si pertenece al usuario autenticado.
 * @param {import('express').Request} req - params: { alertId }.
 * @param {import('express').Response} res - 200 con resultado de updateMany.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const markAlertAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    const alert = await prisma.alert.updateMany({
      where: {
        id: alertId,
        userId
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una alerta del usuario por ID.
 * @param {import('express').Request} req - params: { alertId }.
 * @param {import('express').Response} res - 200 con mensaje de éxito.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const deleteAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    await prisma.alert.deleteMany({
      where: {
        id: alertId,
        userId
      }
    });

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
