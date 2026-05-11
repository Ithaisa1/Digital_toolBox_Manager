import prisma from '../config/database.js';
import { Parser } from 'json2csv';

// Export user data to CSV
export const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { format = 'csv', include = 'all' } = req.query;

    // Get user's tools with subscriptions
    const tools = await prisma.tool.findMany({
      where: { userId },
      include: {
        subscriptions: true,
        category: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    // Get user's subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        tool: {
          include: { category: true }
        }
      }
    });

    // Get user's movements
    const movements = await prisma.movement.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare export data based on include parameter
    let exportData = [];
    
    switch (include) {
      case 'tools':
        exportData = tools.map(tool => ({
          'Tool Name': tool.name,
          'Type': tool.type,
          'URL': tool.url || '',
          'Price': tool.price || 0,
          'Status': tool.status,
          'Category': tool.category?.name || 'Uncategorized',
          'Created At': tool.createdAt.toLocaleDateString(),
          'Updated At': tool.updatedAt.toLocaleDateString()
        }));
        break;
        
      case 'subscriptions':
        exportData = subscriptions.map(sub => ({
          'Tool Name': sub.tool.name,
          'Price': sub.price,
          'Billing Cycle': sub.billingCycle,
          'Status': sub.status,
          'Renewal Date': sub.renewalDate.toLocaleDateString(),
          'Created At': sub.createdAt.toLocaleDateString()
        }));
        break;
        
      case 'movements':
        exportData = movements.map(movement => ({
          'Action': movement.action,
          'Tool Name': movement.toolName || 'N/A',
          'Description': movement.description,
          'Date': movement.createdAt.toLocaleDateString(),
          'IP Address': movement.ipAddress || 'N/A'
        }));
        break;
        
      default: // 'all'
        exportData = [
          ...tools.map(tool => ({
            'Section': 'Tool',
            'Name': tool.name,
            'Type': tool.type,
            'URL': tool.url || '',
            'Price': tool.price || 0,
            'Status': tool.status,
            'Category': tool.category?.name || 'Uncategorized',
            'Created': tool.createdAt.toLocaleDateString()
          })),
          ...subscriptions.map(sub => ({
            'Section': 'Subscription',
            'Tool Name': sub.tool.name,
            'Price': sub.price,
            'Billing Cycle': sub.billingCycle,
            'Status': sub.status,
            'Renewal Date': sub.renewalDate.toLocaleDateString(),
            'Created': sub.createdAt.toLocaleDateString()
          })),
          ...movements.map(movement => ({
            'Section': 'Movement',
            'Action': movement.action,
            'Tool Name': movement.toolName || 'N/A',
            'Description': movement.description,
            'Date': movement.createdAt.toLocaleDateString(),
            'IP Address': movement.ipAddress || 'N/A'
          }))
        ];
    }

    if (format === 'csv') {
      // Convert to CSV
      const csvParser = new Parser();
      const csv = csvParser.parse(exportData);
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="digital-tools-export-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: exportData,
        count: exportData.length,
        exportDate: new Date().toISOString()
      });
    }
  } catch (error) {
    next(error);
  }
};

// Generate analytics report
export const generateAnalyticsReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { period = 'monthly' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const [tools, subscriptions, movements] = await Promise.all([
      prisma.tool.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.subscription.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.movement.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      })
    ]);

    // Calculate analytics
    const analytics = {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      summary: {
        totalTools: tools.length,
        totalSubscriptions: subscriptions.length,
        totalMovements: movements.length,
        newTools: tools.filter(t => t.createdAt >= startDate).length,
        newSubscriptions: subscriptions.filter(s => s.createdAt >= startDate).length,
        totalCost: subscriptions.reduce((sum, s) => sum + (s.price || 0), 0)
      },
      toolsByType: tools.reduce((acc, tool) => {
        acc[tool.type] = (acc[tool.type] || 0) + 1;
        return acc;
      }, {}),
      subscriptionsByStatus: subscriptions.reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {}),
      movementsByAction: movements.reduce((acc, movement) => {
        acc[movement.action] = (acc[movement.action] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};
