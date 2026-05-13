// MVC Views - Template rendering helpers (for future email templates, etc.)

export class BaseView {
  constructor(data = {}) {
    this.data = data;
    this.template = '';
  }

  render() {
    return this.template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.data[key] || '';
    });
  }

  setTemplate(template) {
    this.template = template;
  }

  setData(key, value) {
    this.data[key] = value;
  }
}

export class EmailView extends BaseView {
  constructor(templateName, data = {}) {
    super(data);
    this.templateName = templateName;
    this.loadTemplate();
  }

  loadTemplate() {
    // Email templates
    const templates = {
      welcome: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ToolBox Manager</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>🎉 Welcome to ToolBox Manager!</h1>
              <p>Hi {{name}}, thank you for joining us!</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h3>Get Started with These Features:</h3>
              <ul>
                <li>🧰 Manage all your digital tools in one place</li>
                <li>📊 Track subscriptions and renewal dates</li>
                <li>🔔 Get automatic renewal reminders</li>
                <li>📈 Analyze your tool usage and costs</li>
              </ul>
              <div style="text-align: center; margin-top: 20px;">
                <a href="{{dashboardUrl}}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      
      renewalReminder: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Renewal Reminder</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>🔄 Renewal Reminder</h1>
              <p>Hi {{name}}, your subscription needs attention!</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
                <h3>{{toolName}}</h3>
                <p><strong>Current Price:</strong> €{{price}}</p>
                <p><strong>Billing Cycle:</strong> {{billingCycle}}</p>
                <p><strong>Renewal Date:</strong> {{renewalDate}}</p>
                <p><strong>Days Until Renewal:</strong> <span style="color: #ef4444; font-weight: bold;">{{daysUntilRenewal}} days</span></p>
                {{#toolUrl}}<a href="{{toolUrl}}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Manage Subscription</a>{{/toolUrl}}
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      
      passwordReset: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1>🔐 Password Reset Request</h1>
              <p>Hi {{name}}, we received a request to reset your password.</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <p>Click the button below to reset your password:</p>
                <a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px;">Reset Password</a>
                <p><small>This link will expire in 1 hour for security reasons.</small></p>
                <p><small>If you didn't request this reset, please ignore this email.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    this.setTemplate(templates[this.templateName] || '');
  }

  renderWithConditionals() {
    let result = this.template;
    
    // Handle simple conditionals {{#variable}}content{{/variable}}
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key, content) => {
      return this.data[key] ? content : '';
    });
    
    // Handle regular variables
    return result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.data[key] || '';
    });
  }
}

export class PDFView extends BaseView {
  constructor(templateName, data = {}) {
    super(data);
    this.templateName = templateName;
    this.loadTemplate();
  }

  loadTemplate() {
    // PDF templates for reports
    const templates = {
      toolsReport: `
        <html>
        <head>
          <title>Tools Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { color: #3b82f6; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Digital Tools Report - {{date}}</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {{#tools}}
              <tr>
                <td>{{name}}</td>
                <td>{{type}}</td>
                <td>€{{price}}</td>
                <td>{{status}}</td>
                <td>{{category}}</td>
              </tr>
              {{/tools}}
            </tbody>
          </table>
        </body>
        </html>
      `
    };

    this.setTemplate(templates[this.templateName] || '');
  }
}

export default {
  BaseView,
  EmailView,
  PDFView
};
