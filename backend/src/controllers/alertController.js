import prisma from '../config/database.js';

// Get upcoming renewals
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

// Create alert notification
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

// Get user alerts
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

// Mark alert as read
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

// Delete alert
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
