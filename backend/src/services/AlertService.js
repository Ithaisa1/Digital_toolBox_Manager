/**
 * Lógica de negocio de alertas: renovaciones automáticas, CRUD y estadísticas.
 * Persiste en Prisma; usa el modelo Alert para construir payloads.
 */
import prisma from '../config/database.js';
import Alert from '../models/Alert.js';

class AlertService {
  /** Busca suscripciones que renuevan en 30 días y crea alertas si no existen. */
  static async checkUpcomingRenewals() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingRenewals = await prisma.subscription.findMany({
        where: {
          renewalDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow
          },
          status: 'ACTIVE'
        },
        include: {
          tool: true,
          user: true
        }
      });

      for (const subscription of upcomingRenewals) {
        const daysUntilRenewal = Math.ceil((subscription.renewalDate - new Date()) / (1000 * 60 * 60 * 24));
        
        const existingAlert = await prisma.alert.findFirst({
          where: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            type: Alert.TYPES.RENEWAL_REMINDER,
            isRead: false
          }
        });

        if (!existingAlert) {
          const alertData = Alert.createRenewalAlert(subscription);
          await prisma.alert.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              type: alertData.type,
              message: alertData.message,
              priority: alertData.priority,
              scheduledFor: alertData.scheduledFor,
              isRead: false
            }
          });
        }
      }

      console.log(`Processed ${upcomingRenewals.length} upcoming renewals`);
    } catch (error) {
      console.error('Error checking upcoming renewals:', error);
    }
  }

  /** Crea una alerta manual asociada al usuario. */
  static async createCustomAlert(userId, alertData) {
    try {
      const alert = await prisma.alert.create({
        data: {
          userId,
          ...alertData,
          isRead: false
        }
      });

      return alert;
    } catch (error) {
      console.error('Error creating custom alert:', error);
      throw error;
    }
  }

  /** Lista alertas con filtros opcionales por tipo, no leídas y paginación. */
  static async getUserAlerts(userId, options = {}) {
    try {
      const { type, unreadOnly, limit = 50, offset = 0 } = options;

      const whereClause = { userId };
      
      if (type) {
        whereClause.type = type;
      }
      
      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const alerts = await prisma.alert.findMany({
        where: whereClause,
        include: {
          subscription: {
            include: {
              tool: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      });

      return alerts;
    } catch (error) {
      console.error('Error getting user alerts:', error);
      throw error;
    }
  }

  /** Marca una alerta como leída solo si pertenece al usuario. */
  static async markAsRead(alertId, userId) {
    try {
      const alert = await prisma.alert.updateMany({
        where: {
          id: alertId,
          userId
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });

      return alert;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      throw error;
    }
  }

  /** Elimina una alerta del usuario (deleteMany por seguridad de ownership). */
  static async deleteAlert(alertId, userId) {
    try {
      await prisma.alert.deleteMany({
        where: {
          id: alertId,
          userId
        }
      });

      return true;
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  /** Totales, no leídas y conteo agrupado por tipo de alerta. */
  static async getAlertStats(userId) {
    try {
      const [total, unread, byType] = await Promise.all([
        prisma.alert.count({
          where: { userId }
        }),
        prisma.alert.count({
          where: { userId, isRead: false }
        }),
        prisma.alert.groupBy({
          by: ['type'],
          where: { userId },
          _count: true
        })
      ]);

      return {
        total,
        unread,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = item._count;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting alert stats:', error);
      throw error;
    }
  }

  /** Punto de entrada para tareas programadas (cron) que revisan renovaciones. */
  static async scheduleAlertCheck() {
    console.log('Running scheduled alert check...');
    await this.checkUpcomingRenewals();
  }
}

export default AlertService;
