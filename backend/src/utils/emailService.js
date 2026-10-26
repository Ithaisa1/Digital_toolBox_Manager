/**
 * Envío de correos transaccionales (bienvenida, renovación, restablecimiento de contraseña).
 * Usa nodemailer con credenciales SMTP definidas en variables de entorno.
 */
import nodemailer from "nodemailer";

/** Escapa texto del usuario antes de meterlo en HTML. */
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Textos del email de renovaciones en cada idioma. */
const RENEWAL_COPY = {
  es: {
    subject: (items) =>
      items.length === 1
        ? `🔔 ${items[0].subscription.tool.name} se renueva pronto`
        : `🔔 ${items.length} suscripciones se renuevan pronto`,
    title: "Renovaciones próximas",
    greeting: (name) => `Hola ${name}, estas suscripciones se renuevan pronto:`,
    inDays: (days) => (days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`),
    cycle: { monthly: "Mensual", yearly: "Anual" },
    total: "Total",
    button: "Ver mis suscripciones",
    footer: (url) =>
      `Recibes este aviso porque tienes activados los recordatorios. Puedes desactivarlos en <a href="${url}" style="color:#64748b;">tu perfil</a>.`,
  },
  en: {
    subject: (items) =>
      items.length === 1
        ? `🔔 ${items[0].subscription.tool.name} renews soon`
        : `🔔 ${items.length} subscriptions renew soon`,
    title: "Upcoming renewals",
    greeting: (name) => `Hi ${name}, these subscriptions renew soon:`,
    inDays: (days) => (days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`),
    cycle: { monthly: "Monthly", yearly: "Yearly" },
    total: "Total",
    button: "View my subscriptions",
    footer: (url) =>
      `You get this because renewal reminders are on. You can turn them off in <a href="${url}" style="color:#64748b;">your profile</a>.`,
  },
};

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT, 10) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  /** Envía recordatorio de renovación de suscripción al usuario. */
  async sendRenewalReminder(user, subscription, daysUntilRenewal) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `🔄 Renewal Reminder: ${subscription.tool.name}`,
        html: this.generateRenewalTemplate(
          user,
          subscription,
          daysUntilRenewal,
        ),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(
        `Renewal reminder sent to ${user.email} for ${subscription.tool.name}`,
      );
    } catch (error) {
      console.error("Error sending renewal reminder:", error);
    }
  }

  /** Indica si hay credenciales SMTP configuradas. */
  static isConfigured() {
    return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  }

  /**
   * Envía un único email con todas las renovaciones próximas del usuario.
   * @param {{email: string, name: string, language?: string}} user
   * @param {Array<{subscription: object, nextRenewal: Date, days: number}>} items
   * @returns {Promise<boolean>} true si se envió.
   */
  async sendRenewalDigest(user, items) {
    const lang = user.language === "en" ? "en" : "es";
    const copy = RENEWAL_COPY[lang];

    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: user.email,
        subject: copy.subject(items),
        html: this.generateRenewalDigestTemplate(user, items, lang),
      });
      console.log(`Renewal digest sent to ${user.email} (${items.length} subscriptions)`);
      return true;
    } catch (error) {
      console.error(`Error sending renewal digest to ${user.email}:`, error.message);
      return false;
    }
  }

  /** Plantilla HTML del resumen de renovaciones. */
  generateRenewalDigestTemplate(user, items, lang = "es") {
    const copy = RENEWAL_COPY[lang];
    const locale = lang === "en" ? "en-GB" : "es-ES";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const money = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });
    const dateFormat = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const total = items.reduce((sum, { subscription }) => sum + subscription.price, 0);

    const rows = items
      .map(({ subscription, nextRenewal, days }) => {
        const color = days <= 2 ? "#dc2626" : "#2563eb";
        const plan = subscription.plan ? ` · ${escapeHtml(subscription.plan)}` : "";
        return `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;">
              <strong>${escapeHtml(subscription.tool.name)}</strong>${plan}<br>
              <span style="color:#64748b;font-size:13px;">${dateFormat.format(nextRenewal)} · ${copy.cycle[subscription.billingCycle] || escapeHtml(subscription.billingCycle)}</span>
            </td>
            <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;white-space:nowrap;">
              <strong>${money.format(subscription.price)}</strong><br>
              <span style="color:${color};font-size:13px;font-weight:600;">${copy.inDays(days)}</span>
            </td>
          </tr>`;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html lang="${lang}">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${copy.title}</title></head>
      <body style="margin:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;padding:24px;">
          <div style="background:#2563eb;color:#ffffff;padding:24px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;font-size:22px;">🔔 ${copy.title}</h1>
            <p style="margin:8px 0 0;">${copy.greeting(escapeHtml(user.name))}</p>
          </div>
          <div style="background:#ffffff;padding:24px;border-radius:0 0 12px 12px;">
            <table style="width:100%;border-collapse:collapse;font-size:15px;">${rows}</table>
            <p style="margin:16px 0 0;text-align:right;">${copy.total}: <strong>${money.format(total)}</strong></p>
            <p style="text-align:center;margin:24px 0 0;">
              <a href="${frontendUrl}/subscriptions" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;">${copy.button}</a>
            </p>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:16px;">${copy.footer(`${frontendUrl}/profile`)}</p>
        </div>
      </body>
      </html>
    `;
  }

  /** Envía correo de bienvenida tras el registro. */
  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `🎉 Welcome to ToolBox Manager`,
        html: this.generateWelcomeTemplate(user),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  /** Envía enlace de restablecimiento de contraseña con token temporal. */
  async sendPasswordResetEmail(user, resetToken) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: `🔐 Password Reset Request`,
        html: this.generatePasswordResetTemplate(user, resetToken),
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  }

  /** Plantilla HTML del recordatorio; urgencia visual si faltan ≤7 días. */
  generateRenewalTemplate(user, subscription, daysUntilRenewal) {
    const urgency = daysUntilRenewal <= 7 ? "high" : "normal";
    const urgencyColor = urgency === "high" ? "#ef4444" : "#3b82f6";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Renewal Reminder</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
          .tool-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor}; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Renewal Reminder</h1>
            <p>Hi ${user.name}, your subscription needs attention!</p>
          </div>
          <div class="content">
            <div class="tool-info">
              <h3>${subscription.tool.name}</h3>
              <p><strong>Current Price:</strong> €${subscription.price}</p>
              <p><strong>Billing Cycle:</strong> ${subscription.billingCycle}</p>
              <p><strong>Renewal Date:</strong> ${subscription.renewalDate.toLocaleDateString()}</p>
              <p><strong>Days Until Renewal:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${daysUntilRenewal} days</span></p>
              ${subscription.tool.url ? `<a href="${subscription.tool.url}" class="btn">Manage Subscription</a>` : ""}
            </div>
          </div>
          <div class="footer">
            <p>This is an automated reminder from ToolBox Manager. You can manage your notification preferences in your profile settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /** Plantilla HTML de bienvenida con enlaces al frontend. */
  generateWelcomeTemplate(user) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ToolBox Manager</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
          .feature-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .feature-list li { margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to ToolBox Manager!</h1>
            <p>Hi ${user.name}, thank you for joining us!</p>
          </div>
          <div class="content">
            <h3>Get Started with These Features:</h3>
            <div class="feature-list">
              <ul>
                <li>🧰 Manage all your digital tools in one place</li>
                <li>📊 Track subscriptions and renewal dates</li>
                <li>🔔 Get automatic renewal reminders</li>
                <li>📈 Analyze your tool usage and costs</li>
                <li>🌙 Dark/Light theme support</li>
              </ul>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" class="btn">Go to Dashboard</a>
              <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/profile" class="btn">Manage Profile</a>
            </div>
          </div>
          <div class="footer">
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /** Plantilla HTML con URL de reset que incluye el token en query string. */
  generatePasswordResetTemplate(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 10px; }
          .reset-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
            <p>Hi ${user.name}, we received a request to reset your password.</p>
          </div>
          <div class="content">
            <div class="reset-box">
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="btn">Reset Password</a>
              <p><small>This link will expire in 1 hour for security reasons.</small></p>
              <p><small>If you didn't request this reset, please ignore this email.</small></p>
            </div>
          </div>
          <div class="footer">
            <p>If you have any issues, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /** Verifica que el transporte SMTP esté configurado correctamente. */
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready to send messages");
      return true;
    } catch (error) {
      console.error("Email service configuration error:", error);
      return false;
    }
  }
}

export default EmailService;
