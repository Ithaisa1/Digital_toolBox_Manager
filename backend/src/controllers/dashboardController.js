import prisma from '../config/database.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Get total tools count by status
    const toolsByStatus = await prisma.tool.groupBy({
      by: ['status'],
      where: { userId },
      _count: true,
    });

    // Get total subscriptions and monthly cost
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { tool: true },
    });

    const totalSubscriptions = subscriptions.length;
    const monthlyCost = subscriptions.reduce((sum, sub) => {
      return sum + (sub.billingCycle === 'monthly' ? sub.price : sub.price / 12);
    }, 0);

    // Get tools by category
    const toolsByCategory = await prisma.tool.groupBy({
      by: ['categoryId'],
      where: { userId },
      _count: true,
    });

    // Get upcoming renewals in next 30 days
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const upcomingRenewals = await prisma.subscription.count({
      where: {
        userId,
        status: 'ACTIVE',
        renewalDate: { lte: date },
      },
    });

    // Get most expensive tools
    const expensiveTools = await prisma.tool.findMany({
      where: { userId, price: { not: null } },
      orderBy: { price: 'desc' },
      take: 5,
      include: { category: true },
    });

    res.json({
      tools: {
        total: toolsByStatus.reduce((sum, item) => sum + item._count, 0),
        byStatus: toolsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {}),
      },
      subscriptions: {
        total: totalSubscriptions,
        monthlyCost: Math.round(monthlyCost * 100) / 100,
        upcomingRenewals,
      },
      categories: toolsByCategory.length,
      expensiveTools,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all users
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            tools: true
          }
        }
      }
    });

    // Get all tools
    const tools = await prisma.tool.findMany({
      include: {
        category: true,
        subscriptions: true
      }
    });

    // Get all subscriptions
    const subscriptions = await prisma.subscription.findMany({
      include: {
        tool: true
      }
    });

    // Get all categories
    const categories = await prisma.category.findMany();

    // Calculate stats
    const totalUsers = users.length;
    const activeUsers = users.filter(user => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(user.createdAt) >= thirtyDaysAgo;
    }).length;

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

    // Get recent activity
    const recentActivity = await prisma.movement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        tool: {
          select: { name: true }
        }
      }
    });

    // Get top users
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
        newThisMonth: newUsersThisMonth
      },
      tools: {
        total: totalTools,
        active: activeTools,
        inactive: inactiveTools
      },
      subscriptions: {
        total: totalSubscriptions,
        monthlyRevenue
      },
      categories: {
        total: categories.length
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        createdAt: activity.createdAt,
        tool: activity.tool?.name || 'Unknown'
      })),
      topUsers
    });
  } catch (error) {
    next(error);
  }
};
