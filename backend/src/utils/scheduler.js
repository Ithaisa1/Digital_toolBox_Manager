import cron from 'node-cron';
import AlertService from '../services/AlertService.js';
import EmailService from '../utils/emailService.js';

class SchedulerService {
  constructor() {
    this.jobs = new Map();
  }

  // Initialize all scheduled jobs
  initialize() {
    console.log('🕐 Initializing scheduler service...');
    
    // Schedule alert checking (runs daily at 9 AM)
    this.scheduleAlertCheck();
    
    // Schedule email reminders (runs every 6 hours)
    this.scheduleEmailReminders();
    
    // Schedule cleanup tasks (runs weekly on Sundays at 2 AM)
    this.scheduleCleanupTasks();
    
    console.log('✅ Scheduler service initialized successfully');
  }

  // Schedule alert checking for upcoming renewals
  scheduleAlertCheck() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('🔄 Running daily alert check...');
      try {
        await AlertService.checkUpcomingRenewals();
      } catch (error) {
        console.error('❌ Error in alert check:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Madrid'
    });
    
    this.jobs.set('alertCheck', job);
    console.log('⏰ Alert check scheduled: Daily at 9:00 AM');
  }

  // Schedule email reminders
  scheduleEmailReminders() {
    const job = cron.schedule('0 */6 * * *', async () => {
      console.log('📧 Checking for email reminders to send...');
      try {
        await this.checkAndSendEmailReminders();
      } catch (error) {
        console.error('❌ Error in email reminder check:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Madrid'
    });
    
    this.jobs.set('emailReminders', job);
    console.log('⏰ Email reminders scheduled: Every 6 hours');
  }

  // Schedule cleanup tasks
  scheduleCleanupTasks() {
    const job = cron.schedule('0 2 * * 0', async () => {
      console.log('🧹 Running weekly cleanup tasks...');
      try {
        await this.performCleanupTasks();
      } catch (error) {
        console.error('❌ Error in cleanup tasks:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Madrid'
    });
    
    this.jobs.set('cleanup', job);
    console.log('⏰ Cleanup tasks scheduled: Weekly on Sundays at 2:00 AM');
  }

  // Check and send email reminders
  async checkAndSendEmailReminders() {
    const prisma = (await import('../config/database.js')).default;
    
    // Get subscriptions renewing in next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const upcomingRenewals = await prisma.subscription.findMany({
      where: {
        renewalDate: {
          gte: new Date(),
          lte: sevenDaysFromNow
        },
        status: 'ACTIVE'
      },
      include: {
        tool: true,
        user: true
      }
    });

    const emailService = new EmailService();
    
    for (const subscription of upcomingRenewals) {
      const daysUntilRenewal = Math.ceil((subscription.renewalDate - new Date()) / (1000 * 60 * 60 * 24));
      
      // Check if email reminder should be sent (3 days before, 1 day before)
      if (daysUntilRenewal === 3 || daysUntilRenewal === 1) {
        await emailService.sendRenewalReminder(
          subscription.user,
          subscription,
          daysUntilRenewal
        );
      }
    }
  }

  // Perform cleanup tasks
  async performCleanupTasks() {
    const prisma = (await import('../config/database.js')).default;
    
    // Clean up old read alerts (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedAlerts = await prisma.alert.deleteMany({
      where: {
        isRead: true,
        createdAt: {
          lt: thirtyDaysAgo
        }
      }
    });

    // Clean up old movements (keep only last 1000 per user)
    // This is a soft cleanup - you might want to implement this differently
    // based on your specific requirements
    
    console.log(`🧹 Cleanup completed: ${deletedAlerts.count} old alerts deleted`);
  }

  // Schedule custom job
  scheduleCustomJob(name, cronExpression, callback, options = {}) {
    try {
      const job = cron.schedule(cronExpression, callback, {
        scheduled: true,
        timezone: options.timezone || 'Europe/Madrid',
        ...options
      });
      
      this.jobs.set(name, job);
      console.log(`⏰ Custom job '${name}' scheduled with expression: ${cronExpression}`);
      
      return job;
    } catch (error) {
      console.error(`❌ Error scheduling custom job '${name}':`, error);
      throw error;
    }
  }

  // Cancel a scheduled job
  cancelJob(name) {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`⏹ Job '${name}' cancelled`);
      return true;
    }
    
    console.log(`⚠️ Job '${name}' not found`);
    return false;
  }

  // Get status of all jobs
  getJobsStatus() {
    const status = {};
    
    for (const [name, job] of this.jobs) {
      status[name] = {
        running: job.running || false,
        scheduled: job.scheduled || false,
        nextDate: job.nextDate()?.toISOString() || null,
        lastDate: job.lastDate()?.toISOString() || null
      };
    }
    
    return status;
  }

  // Graceful shutdown
  shutdown() {
    console.log('🛑 Shutting down scheduler service...');
    
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`⏹ Job '${name}' stopped`);
    }
    
    this.jobs.clear();
    console.log('✅ Scheduler service shut down successfully');
  }
}

export default SchedulerService;
