/**
 * Controlador de exportación de datos y generación de informes analíticos.
 * Permite descargar datos del usuario en CSV/JSON y resúmenes por periodo temporal.
 */

import prisma from '../config/database.js';
import { Parser } from 'json2csv';

/**
 * Exporta herramientas, suscripciones y/o movimientos del usuario en CSV o JSON.
 * @param {import('express').Request} req - query: { format?: 'csv'|'json', include?: 'all'|'tools'|'subscriptions'|'movements' }.
 * @param {import('express').Response} res - Archivo CSV adjunto o JSON con datos exportados.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { format = 'csv', include = 'all' } = req.query;

    // Cargar herramientas con relaciones para exportación
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

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        tool: {
          include: { category: true }
        }
      }
    });

    const movements = await prisma.movement.findMany({
      where: { userId },
      include: { tool: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // Construir filas según el tipo de datos solicitado
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
          'Type': movement.type,
          'Tool Name': movement.tool?.name || 'N/A',
          'Description': movement.description,
          'Date': movement.createdAt.toLocaleDateString()
        }));
        break;
        
      default: // 'all' — combinar las tres secciones en un único dataset
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
            'Type': movement.type,
            'Tool Name': movement.tool?.name || 'N/A',
            'Description': movement.description,
            'Date': movement.createdAt.toLocaleDateString()
          }))
        ];
    }

    if (format === 'csv') {
      // Generar CSV y enviar como descarga
      const csvParser = new Parser();
      const csv = csvParser.parse(exportData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="digital-tools-export-${new Date().toISOString().split('T')[0]}.csv"`);
      
      return res.send(csv);
    } else {
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

/**
 * Genera un informe analítico del usuario para un periodo dado (semanal, mensual o anual).
 * @param {import('express').Request} req - query: { period?: 'weekly'|'monthly'|'yearly' }.
 * @param {import('express').Response} res - 200 con resumen, desglose por tipo/estado/acción.
 * @param {import('express').NextFunction} next - Pasa errores al middleware de errores.
 */
export const generateAnalyticsReport = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { period = 'monthly' } = req.query;

    // Calcular fecha de inicio según el periodo solicitado
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

    // Consultas paralelas de entidades creadas en el rango
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

    // Agregar métricas y contadores por dimensión
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
        acc[movement.type] = (acc[movement.type] || 0) + 1;
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
