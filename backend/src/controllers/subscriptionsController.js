/**
 * Controlador de suscripciones asociadas a herramientas del usuario.
 * Incluye CRUD, renovaciones próximas y enriquecimiento con logos de producto.
 */

import prisma from '../config/database.js';
import { attachSubscriptionLogo, attachToolLogo } from '../utils/productLogo.js';

/**
 * Lista todas las suscripciones del usuario con filtro opcional por estado.
 * @param {import('express').Request} req - query: { status? }.
 * @param {import('express').Response} res - 200 con array de suscripciones (con logo).
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { userId };

    if (status) {
      where.status = status;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        tool: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { renewalDate: 'asc' },
    });

    res.json(subscriptions.map(attachSubscriptionLogo));
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene una suscripción por ID si pertenece al usuario autenticado.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con la suscripción, o 404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
      include: {
        tool: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(attachSubscriptionLogo(subscription));
  } catch (error) {
    next(error);
  }
};

/**
 * Crea una suscripción vinculada a una herramienta del usuario.
 * @param {import('express').Request} req - body: { toolId, renewalDate, price, billingCycle, plan?, status? }.
 * @param {import('express').Response} res - 201 con la suscripción creada, o 400/404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { toolId, renewalDate, price, billingCycle, plan, status } = req.body;

    if (!toolId || !renewalDate || !price || !billingCycle) {
      return res.status(400).json({ error: 'Tool ID, renewal date, price, and billing cycle are required' });
    }

    // Verificar que la herramienta pertenece al usuario
    const tool = await prisma.tool.findFirst({
      where: { id: toolId, userId },
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found or does not belong to user' });
    }

    const subscription = await prisma.subscription.create({
      data: {
        toolId,
        renewalDate: new Date(renewalDate),
        price: parseFloat(price),
        billingCycle,
        plan: plan || null,
        status: status || 'ACTIVE',
        userId,
      },
      include: {
        tool: {
          include: {
            category: true,
          },
        },
      },
    });

    res.status(201).json(attachSubscriptionLogo(subscription));
  } catch (error) {
    next(error);
  }
};

/**
 * Actualiza campos de una suscripción existente del usuario.
 * @param {import('express').Request} req - params: { id }; body con campos opcionales.
 * @param {import('express').Response} res - 200 con suscripción actualizada, o 404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { renewalDate, price, billingCycle, plan, status } = req.body;

    const existingSubscription = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!existingSubscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        renewalDate: renewalDate ? new Date(renewalDate) : existingSubscription.renewalDate,
        price: price !== undefined ? parseFloat(price) : existingSubscription.price,
        billingCycle: billingCycle || existingSubscription.billingCycle,
        plan: plan !== undefined ? plan : existingSubscription.plan,
        status: status || existingSubscription.status,
      },
      include: {
        tool: {
          include: {
            category: true,
          },
        },
      },
    });

    res.json(attachSubscriptionLogo(subscription));
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina una suscripción del usuario por ID.
 * @param {import('express').Request} req - params: { id }.
 * @param {import('express').Response} res - 200 con mensaje de éxito, o 404.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.subscription.delete({
      where: { id },
    });

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene suscripciones activas con renovación dentro del rango de días indicado.
 * @param {import('express').Request} req - query: { days? } (por defecto 30).
 * @param {import('express').Response} res - 200 con suscripciones próximas a renovar.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        renewalDate: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        tool: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { renewalDate: 'asc' },
    });

    res.json(subscriptions.map(attachSubscriptionLogo));
  } catch (error) {
    next(error);
  }
};
