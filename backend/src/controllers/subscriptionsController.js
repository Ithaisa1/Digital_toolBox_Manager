import prisma from '../config/database.js';

export const getAllSubscriptions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { userId };
    if (status) where.status = status;

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        tool: true,
      },
      orderBy: { renewalDate: 'asc' },
    });

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const subscription = await prisma.subscription.findFirst({
      where: { id, userId },
      include: {
        tool: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { toolId, renewalDate, price, billingCycle, status } = req.body;

    if (!toolId || !renewalDate || !price || !billingCycle) {
      return res.status(400).json({ error: 'Tool ID, renewal date, price, and billing cycle are required' });
    }

    // Verify tool belongs to user
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
        status: status || 'ACTIVE',
        userId,
      },
      include: {
        tool: true,
      },
    });

    res.status(201).json(subscription);
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { renewalDate, price, billingCycle, status } = req.body;

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
        status: status || existingSubscription.status,
      },
      include: {
        tool: true,
      },
    });

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

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

export const getUpcomingRenewals = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;

    const date = new Date();
    date.setDate(date.getDate() + days);

    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        renewalDate: {
          lte: date,
        },
      },
      include: {
        tool: true,
      },
      orderBy: { renewalDate: 'asc' },
    });

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};
