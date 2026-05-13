import nodemailer from "nodemailer";

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

  // Send renewal reminder email
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

  // Send welcome email
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

  // Send password reset email
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

  // Generate renewal reminder email template
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

  // Generate welcome email template
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

  // Generate password reset email template
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

  // Test email configuration
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
