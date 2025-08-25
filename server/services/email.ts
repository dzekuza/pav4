import { Resend } from "resend";

// Initialize Resend with API key only if it exists
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
}

export class EmailService {
  private static instance: EmailService;
  private resend: Resend | null;
  private defaultFrom: string;

  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    // Use Resend's default domain until custom domain is verified
    this.defaultFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send a simple email
   */
  async sendEmail(
    options: EmailOptions,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!this.resend) {
        console.warn("RESEND_API_KEY is not configured, email sending is disabled");
        return { success: false, error: "Email service not configured" };
      }

      const result = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      console.log("Email sent successfully:", result);
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      console.error("Failed to send email:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Send welcome email to new business
   */
  async sendWelcomeEmail(
    businessName: string,
    businessEmail: string,
    domain: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const subject = `Welcome to ${process.env.APP_NAME || "Our Platform"}!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${process.env.APP_NAME || "Our Platform"}!</h1>
          </div>
          <div class="content">
            <h2>Hello ${businessName}!</h2>
            <p>Thank you for registering your business with us. We're excited to help you grow your online presence and track your success.</p>
            
            <h3>Your Business Details:</h3>
            <ul>
              <li><strong>Business Name:</strong> ${businessName}</li>
              <li><strong>Domain:</strong> ${domain}</li>
              <li><strong>Email:</strong> ${businessEmail}</li>
            </ul>

            <p>Here's what you can do next:</p>
            <ol>
              <li>Complete your business profile setup</li>
              <li>Integrate tracking scripts on your website</li>
              <li>Start monitoring your analytics and conversions</li>
            </ol>

            <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/business/dashboard" class="button">Go to Dashboard</a>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Our Platform"}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: businessEmail,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    businessName?: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;
    const subject = "Password Reset Request";
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello${businessName ? ` ${businessName}` : ""}!</h2>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            
            <p>To reset your password, click the button below:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Our Platform"}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send domain verification email
   */
  async sendDomainVerificationEmail(
    businessEmail: string,
    businessName: string,
    domain: string,
    verificationToken: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const subject = `Verify Your Domain: ${domain}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Domain Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 16px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Domain Verification Required</h1>
          </div>
          <div class="content">
            <h2>Hello ${businessName}!</h2>
            <p>To complete your domain verification for <strong>${domain}</strong>, please add the following verification token to your website.</p>
            
            <h3>Verification Token:</h3>
            <div class="code">${verificationToken}</div>
            
            <h3>How to add this token:</h3>
            <ol>
              <li>Add a meta tag to your website's HTML head section:</li>
              <div class="code">&lt;meta name="domain-verification" content="${verificationToken}"&gt;</div>
              <li>Or add it to your robots.txt file:</li>
              <div class="code">User-agent: *<br>Disallow: /<br>Domain-Verification: ${verificationToken}</div>
              <li>Once added, return to your dashboard and click "Verify Domain"</li>
            </ol>
            
            <p><strong>Note:</strong> This verification token will expire in 24 hours.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Our Platform"}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: businessEmail,
      subject,
      html,
    });
  }

  /**
   * Send notification email for new sales/conversions
   */
  async sendSalesNotificationEmail(
    businessEmail: string,
    businessName: string,
    saleData: {
      orderId: string;
      amount: number;
      commission: number;
      productUrl?: string;
    },
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const subject = `New Sale! Order #${saleData.orderId}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Sale Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .sale-info { background: #e8f5e8; border: 1px solid #28a745; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Sale!</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${businessName}!</h2>
            <p>You've just made a new sale! Here are the details:</p>
            
            <div class="sale-info">
              <p><strong>Order ID:</strong> ${saleData.orderId}</p>
              <p><strong>Sale Amount:</strong> <span class="amount">$${saleData.amount.toFixed(2)}</span></p>
              <p><strong>Your Commission:</strong> <span class="amount">$${saleData.commission.toFixed(2)}</span></p>
              ${saleData.productUrl ? `<p><strong>Product:</strong> <a href="${saleData.productUrl}">View Product</a></p>` : ""}
            </div>
            
            <p>Keep up the great work! Your tracking is working perfectly.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Our Platform"}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: businessEmail,
      subject,
      html,
    });
  }

  /**
   * Send weekly/monthly analytics report
   */
  async sendAnalyticsReportEmail(
    businessEmail: string,
    businessName: string,
    reportData: {
      period: string;
      totalVisits: number;
      totalSales: number;
      totalRevenue: number;
      totalCommission: number;
      conversionRate: number;
    },
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const subject = `${reportData.period} Analytics Report - ${businessName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .metric { background: white; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px; margin: 10px 0; text-align: center; }
          .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 ${reportData.period} Analytics Report</h1>
          </div>
          <div class="content">
            <h2>Hello ${businessName}!</h2>
            <p>Here's your ${reportData.period.toLowerCase()} performance summary:</p>
            
            <div class="metric">
              <div class="metric-value">${reportData.totalVisits.toLocaleString()}</div>
              <div>Total Visits</div>
            </div>
            
            <div class="metric">
              <div class="metric-value">${reportData.totalSales.toLocaleString()}</div>
              <div>Total Sales</div>
            </div>
            
            <div class="metric">
              <div class="metric-value">$${reportData.totalRevenue.toFixed(2)}</div>
              <div>Total Revenue</div>
            </div>
            
            <div class="metric">
              <div class="metric-value">$${reportData.totalCommission.toFixed(2)}</div>
              <div>Your Commission</div>
            </div>
            
            <div class="metric">
              <div class="metric-value">${reportData.conversionRate.toFixed(2)}%</div>
              <div>Conversion Rate</div>
            </div>
            
            <p>Keep up the great work! 🚀</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || "Our Platform"}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: businessEmail,
      subject,
      html,
    });
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
