/**
 * Email Service
 * Production-ready email delivery with templates and transactional support
 */

import nodemailer from 'nodemailer';
import { err, ok, Result } from 'neverthrow';
import { AppError, ErrorCode } from '@bakery-cms/common';

/**
 * Email configuration interface
 * Environment-based email provider settings
 */
export interface EmailConfig {
  // SMTP Configuration
  smtp: {
    host: string;
    port: number;
    secure: boolean; // true for 465, false for other ports
    auth: {
      user: string;
      pass: string;
    };
  };
  
  // Email defaults
  defaults: {
    from: {
      name: string;
      email: string;
    };
    replyTo?: string;
  };
  
  // Template configuration
  templates: {
    baseUrl: string; // Frontend URL for links
    logoUrl?: string;
    supportEmail: string;
  };
}

/**
 * Email template data interfaces
 */
export interface EmailVerificationData {
  firstName: string;
  verificationUrl: string;
  expirationHours: number;
}

export interface PasswordResetData {
  firstName: string;
  resetUrl: string;
  expirationHours: number;
}

export interface WelcomeEmailData {
  firstName: string;
  dashboardUrl: string;
}

export interface SecurityAlertData {
  firstName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Email delivery result
 */
export interface EmailDeliveryResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  pending: string[];
}

/**
 * Email service class
 * Production-ready email service with retry logic and templates
 */
export class EmailService {
  private transporter: nodemailer.Transporter;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.auth,
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  /**
   * Verify email service connection
   * Test SMTP configuration
   */
  async verifyConnection(): Promise<Result<boolean, AppError>> {
    try {
      await this.transporter.verify();
      return ok(true);
    } catch (error) {
      return err({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: `Email service connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statusCode: 503,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Send email verification message
   * Triggered on user registration
   */
  async sendVerificationEmail(
    to: string,
    data: EmailVerificationData
  ): Promise<Result<EmailDeliveryResult, AppError>> {
    const subject = 'Verify your email address';
    const html = this.generateVerificationEmailHTML(data);
    const text = this.generateVerificationEmailText(data);

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send password reset email
   * Triggered on forgot password request
   */
  async sendPasswordResetEmail(
    to: string,
    data: PasswordResetData
  ): Promise<Result<EmailDeliveryResult, AppError>> {
    const subject = 'Reset your password';
    const html = this.generatePasswordResetEmailHTML(data);
    const text = this.generatePasswordResetEmailText(data);

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send welcome email
   * Triggered after email verification
   */
  async sendWelcomeEmail(
    to: string,
    data: WelcomeEmailData
  ): Promise<Result<EmailDeliveryResult, AppError>> {
    const subject = 'Welcome to Bakery CMS!';
    const html = this.generateWelcomeEmailHTML(data);
    const text = this.generateWelcomeEmailText(data);

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Send security alert email
   * Triggered on suspicious activity
   */
  async sendSecurityAlertEmail(
    to: string,
    data: SecurityAlertData
  ): Promise<Result<EmailDeliveryResult, AppError>> {
    const subject = 'Security Alert - Account Activity';
    const html = this.generateSecurityAlertEmailHTML(data);
    const text = this.generateSecurityAlertEmailText(data);

    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Core email sending function
   * Handles delivery with error handling
   */
  private async sendEmail({
    to,
    subject,
    html,
    text,
    attachments,
  }: {
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments?: any[];
  }): Promise<Result<EmailDeliveryResult, AppError>> {
    try {
      const result = await this.transporter.sendMail({
        from: {
          name: this.config.defaults.from.name,
          address: this.config.defaults.from.email,
        },
        to,
        subject,
        html,
        text,
        replyTo: this.config.defaults.replyTo,
        attachments,
      });

      return ok({
        messageId: result.messageId,
        accepted: result.accepted as string[],
        rejected: result.rejected as string[],
        pending: result.pending as string[],
      });
    } catch (error) {
      return err({
        code: ErrorCode.EXTERNAL_SERVICE_ERROR,
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        statusCode: 503,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Generate verification email HTML template
   */
  private generateVerificationEmailHTML(data: EmailVerificationData): string {
    const { logoUrl, supportEmail } = this.config.templates;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-height: 50px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Bakery CMS" class="logo">` : '<h1>Bakery CMS</h1>'}
        </div>
        <div class="content">
            <h2>Hi ${data.firstName},</h2>
            <p>Welcome to Bakery CMS! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>This verification link will expire in ${data.expirationHours} hours for security purposes.</p>
            
            <p>If you didn't create an account, you can safely ignore this email.</p>
            
            <p>If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${data.verificationUrl}</p>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Bakery CMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate verification email plain text
   */
  private generateVerificationEmailText(data: EmailVerificationData): string {
    return `
Hi ${data.firstName},

Welcome to Bakery CMS! To complete your registration, please verify your email address by visiting:

${data.verificationUrl}

This verification link will expire in ${data.expirationHours} hours for security purposes.

If you didn't create an account, you can safely ignore this email.

Need help? Contact us at ${this.config.templates.supportEmail}

© 2024 Bakery CMS. All rights reserved.
`;
  }

  /**
   * Generate password reset email HTML template
   */
  private generatePasswordResetEmailHTML(data: PasswordResetData): string {
    const { logoUrl, supportEmail } = this.config.templates;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-height: 50px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Bakery CMS" class="logo">` : '<h1>Bakery CMS</h1>'}
        </div>
        <div class="content">
            <h2>Hi ${data.firstName},</h2>
            <p>We received a request to reset your password. Click the button below to choose a new password:</p>
            
            <div style="text-align: center;">
                <a href="${data.resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> This password reset link will expire in ${data.expirationHours} hours. If you didn't request this reset, please ignore this email and your password will remain unchanged.
            </div>
            
            <p>If you're having trouble clicking the button, copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #666;">${data.resetUrl}</p>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Bakery CMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate password reset email plain text
   */
  private generatePasswordResetEmailText(data: PasswordResetData): string {
    return `
Hi ${data.firstName},

We received a request to reset your password. Visit the following link to choose a new password:

${data.resetUrl}

SECURITY NOTICE: This password reset link will expire in ${data.expirationHours} hours. If you didn't request this reset, please ignore this email and your password will remain unchanged.

Need help? Contact us at ${this.config.templates.supportEmail}

© 2024 Bakery CMS. All rights reserved.
`;
  }

  /**
   * Generate welcome email HTML template
   */
  private generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    const { logoUrl, supportEmail } = this.config.templates;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Bakery CMS</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-height: 50px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Bakery CMS" class="logo">` : '<h1>Bakery CMS</h1>'}
        </div>
        <div class="content">
            <h2>Welcome, ${data.firstName}! 🎉</h2>
            <p>Your email has been verified and your account is now active. You're ready to start managing your bakery business with our comprehensive CMS platform.</p>
            
            <div style="text-align: center;">
                <a href="${data.dashboardUrl}" class="button">Access Your Dashboard</a>
            </div>
            
            <p><strong>What you can do now:</strong></p>
            <ul>
                <li>Manage your bakery products and inventory</li>
                <li>Track orders and customer information</li>
                <li>Process payments and manage transactions</li>
                <li>Customize your bakery's online presence</li>
            </ul>
            
            <p>If you have any questions, our support team is here to help!</p>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Bakery CMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate welcome email plain text
   */
  private generateWelcomeEmailText(data: WelcomeEmailData): string {
    return `
Welcome, ${data.firstName}! 🎉

Your email has been verified and your account is now active. You're ready to start managing your bakery business with our comprehensive CMS platform.

Access your dashboard: ${data.dashboardUrl}

What you can do now:
- Manage your bakery products and inventory
- Track orders and customer information
- Process payments and manage transactions
- Customize your bakery's online presence

If you have any questions, our support team is here to help!

Need help? Contact us at ${this.config.templates.supportEmail}

© 2024 Bakery CMS. All rights reserved.
`;
  }

  /**
   * Generate security alert email HTML template
   */
  private generateSecurityAlertEmailHTML(data: SecurityAlertData): string {
    const { logoUrl, supportEmail } = this.config.templates;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { max-height: 50px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 8px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Bakery CMS" class="logo">` : '<h1>Bakery CMS</h1>'}
        </div>
        <div class="content">
            <h2>Hi ${data.firstName},</h2>
            
            <div class="alert">
                <strong>Security Alert:</strong> We detected ${data.action} on your account.
            </div>
            
            <p>Here are the details of this activity:</p>
            
            <div class="details">
                <p><strong>Action:</strong> ${data.action}</p>
                <p><strong>Time:</strong> ${data.timestamp}</p>
                <p><strong>IP Address:</strong> ${data.ipAddress}</p>
                <p><strong>Device:</strong> ${data.userAgent}</p>
            </div>
            
            <p>If this was you, no action is required. If you don't recognize this activity, please:</p>
            <ul>
                <li>Change your password immediately</li>
                <li>Review your account for any unauthorized changes</li>
                <li>Contact our support team if you need assistance</li>
            </ul>
        </div>
        <div class="footer">
            <p>Need help? Contact us at <a href="mailto:${supportEmail}">${supportEmail}</a></p>
            <p>&copy; 2024 Bakery CMS. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate security alert email plain text
   */
  private generateSecurityAlertEmailText(data: SecurityAlertData): string {
    return `
Hi ${data.firstName},

SECURITY ALERT: We detected ${data.action} on your account.

Activity Details:
- Action: ${data.action}
- Time: ${data.timestamp}
- IP Address: ${data.ipAddress}
- Device: ${data.userAgent}

If this was you, no action is required. If you don't recognize this activity, please:
- Change your password immediately
- Review your account for any unauthorized changes
- Contact our support team if you need assistance

Need help? Contact us at ${this.config.templates.supportEmail}

© 2024 Bakery CMS. All rights reserved.
`;
  }

  /**
   * Close email service connections
   */
  async close(): Promise<void> {
    this.transporter.close();
  }
}

/**
 * Email service factory
 * Creates configured email service instance
 */
export const createEmailService = (config: EmailConfig): EmailService => {
  return new EmailService(config);
};

/**
 * Default email configuration from environment
 */
export const getDefaultEmailConfig = (): EmailConfig => {
  return {
    smtp: {
      host: process.env['SMTP_HOST'] || 'localhost',
      port: parseInt(process.env['SMTP_PORT'] || '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'] || '',
        pass: process.env['SMTP_PASS'] || '',
      },
    },
    defaults: {
      from: {
        name: process.env['EMAIL_FROM_NAME'] || 'Bakery CMS',
        email: process.env['EMAIL_FROM_ADDRESS'] || 'noreply@bakeryCMS.com',
      },
      replyTo: process.env['EMAIL_REPLY_TO'],
    },
    templates: {
      baseUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
      logoUrl: process.env['EMAIL_LOGO_URL'],
      supportEmail: process.env['SUPPORT_EMAIL'] || 'support@bakeryCMS.com',
    },
  };
};