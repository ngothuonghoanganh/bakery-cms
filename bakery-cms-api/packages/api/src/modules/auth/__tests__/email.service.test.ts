/**
 * Email Service Unit Tests
 * Comprehensive test suite for email service functionality
 */

import nodemailer from 'nodemailer';
import { EmailService, EmailConfig, EmailVerificationData, PasswordResetData, WelcomeEmailData, SecurityAlertData } from '../services/email.service';

// Mock nodemailer
jest.mock('nodemailer');
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

describe('EmailService', () => {
  let emailService: EmailService;
  let mockTransporter: jest.Mocked<any>;

  const mockConfig: EmailConfig = {
    smtp: {
      host: 'smtp.test.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'testpass123',
      },
    },
    defaults: {
      from: {
        name: 'Test Bakery CMS',
        email: 'test@example.com',
      },
    },
    templates: {
      baseUrl: 'http://localhost:3000',
      supportEmail: 'support@example.com',
    },
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
      close: jest.fn(),
    };

    // Mock nodemailer.createTransport
    mockNodemailer.createTransport = jest.fn().mockReturnValue(mockTransporter);

    emailService = new EmailService(mockConfig);
  });

  describe('constructor', () => {
    it('should create EmailService with valid configuration', () => {
      expect(emailService).toBeDefined();
      expect(mockNodemailer.createTransport).toHaveBeenCalledWith({
        host: mockConfig.smtp.host,
        port: mockConfig.smtp.port,
        secure: mockConfig.smtp.secure,
        auth: mockConfig.smtp.auth,
      });
    });
  });

  describe('verifyConnection', () => {
    it('should verify email connection successfully', async () => {
      // Arrange
      mockTransporter.verify.mockResolvedValue(true);

      // Act
      const result = await emailService.verifyConnection();

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should handle verification failure', async () => {
      // Arrange
      const error = new Error('Connection failed');
      mockTransporter.verify.mockRejectedValue(error);

      // Act
      const result = await emailService.verifyConnection();

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to verify email connection');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: EmailVerificationData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify?token=abc123',
        expirationHours: 24,
      };
      
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      // Act
      const result = await emailService.sendVerificationEmail(email, data);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Verify your email address',
        })
      );
    });

    it('should handle send failure', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: EmailVerificationData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify?token=abc123',
        expirationHours: 24,
      };
      
      const error = new Error('Send failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendVerificationEmail(email, data);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to send verification email');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: PasswordResetData = {
        firstName: 'John',
        resetUrl: 'https://example.com/reset?token=xyz789',
        expirationHours: 1,
      };
      
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      // Act
      const result = await emailService.sendPasswordResetEmail(email, data);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Reset your password',
        })
      );
    });

    it('should handle send failure', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: PasswordResetData = {
        firstName: 'John',
        resetUrl: 'https://example.com/reset?token=xyz789',
        expirationHours: 1,
      };
      
      const error = new Error('Send failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendPasswordResetEmail(email, data);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to send password reset email');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: WelcomeEmailData = {
        firstName: 'John',
        dashboardUrl: 'http://localhost:3000/dashboard',
      };
      
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      // Act
      const result = await emailService.sendWelcomeEmail(email, data);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Welcome to Bakery CMS!',
        })
      );
    });

    it('should handle send failure', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: WelcomeEmailData = {
        firstName: 'John',
        dashboardUrl: 'http://localhost:3000/dashboard',
      };
      
      const error = new Error('Send failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendWelcomeEmail(email, data);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to send welcome email');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('sendSecurityAlertEmail', () => {
    it('should send security alert email successfully', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: SecurityAlertData = {
        firstName: 'John',
        action: 'Suspicious login attempt detected',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };
      
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
        accepted: [email],
        rejected: [],
      });

      // Act
      const result = await emailService.sendSecurityAlertEmail(email, data);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Security Alert - Account Activity',
        })
      );
    });

    it('should handle send failure', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: SecurityAlertData = {
        firstName: 'John',
        action: 'Suspicious login attempt detected',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };
      
      const error = new Error('Send failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendSecurityAlertEmail(email, data);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to send security alert email');
        expect(result.error.statusCode).toBe(500);
      }
    });
  });

  describe('HTML Template Generation', () => {
    it('should generate verification email HTML template with proper content', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: EmailVerificationData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify?token=abc123',
        expirationHours: 24,
      };
      
      mockTransporter.sendMail.mockImplementation((mailOptions: any) => {
        // Capture the HTML content for verification
        expect(mailOptions.html).toContain(data.firstName);
        expect(mailOptions.html).toContain('verify');
        return Promise.resolve({ messageId: 'test' });
      });

      // Act
      await emailService.sendVerificationEmail(email, data);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should generate password reset email HTML template with proper content', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: PasswordResetData = {
        firstName: 'John',
        resetUrl: 'https://example.com/reset?token=xyz789',
        expirationHours: 1,
      };
      
      mockTransporter.sendMail.mockImplementation((mailOptions: any) => {
        // Capture the HTML content for verification
        expect(mailOptions.html).toContain(data.firstName);
        expect(mailOptions.html).toContain('reset');
        return Promise.resolve({ messageId: 'test' });
      });

      // Act
      await emailService.sendPasswordResetEmail(email, data);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should generate welcome email HTML template with proper content', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: WelcomeEmailData = {
        firstName: 'John',
        dashboardUrl: 'http://localhost:3000/dashboard',
      };
      
      mockTransporter.sendMail.mockImplementation((mailOptions: any) => {
        // Capture the HTML content for verification
        expect(mailOptions.html).toContain(data.firstName);
        expect(mailOptions.html).toContain('Welcome');
        return Promise.resolve({ messageId: 'test' });
      });

      // Act
      await emailService.sendWelcomeEmail(email, data);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should generate security alert email HTML template with proper content', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: SecurityAlertData = {
        firstName: 'John',
        action: 'Suspicious login attempt',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };
      
      mockTransporter.sendMail.mockImplementation((mailOptions: any) => {
        // Capture the HTML content for verification
        expect(mailOptions.html).toContain(data.firstName);
        expect(mailOptions.html).toContain('Security');
        return Promise.resolve({ messageId: 'test' });
      });

      // Act
      await emailService.sendSecurityAlertEmail(email, data);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('Text Fallback Generation', () => {
    it('should generate verification email text fallback', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: EmailVerificationData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify?token=abc123',
        expirationHours: 24,
      };
      
      mockTransporter.sendMail.mockImplementation((mailOptions: any) => {
        expect(mailOptions.text).toContain(data.firstName);
        expect(mailOptions.text).not.toContain('<');
        return Promise.resolve({ messageId: 'test' });
      });

      // Act
      await emailService.sendVerificationEmail(email, data);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should generate password reset email text fallback', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: PasswordResetData = {
        firstName: 'John',
        resetUrl: 'https://example.com/reset?token=xyz789',
        expirationHours: 1,
      };
      
      mockTransporter.sendMail.mockImplementation((mailOptions: any) => {
        expect(mailOptions.text).toContain(data.firstName);
        expect(mailOptions.text).not.toContain('<');
        return Promise.resolve({ messageId: 'test' });
      });

      // Act
      await emailService.sendPasswordResetEmail(email, data);

      // Assert
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid SMTP configuration', () => {
      // Arrange
      const invalidConfig: EmailConfig = {
        smtp: {
          host: '',
          port: 0,
          secure: false,
          auth: {
            user: '',
            pass: '',
          },
        },
        defaults: {
          from: {
            name: 'Test',
            email: 'invalid-email',
          },
        },
        templates: {
          baseUrl: 'http://localhost:3000',
          supportEmail: 'support@example.com',
        },
      };

      // Act & Assert - Should not throw, but use default config
      expect(() => new EmailService(invalidConfig)).not.toThrow();
    });
  });

  describe('close', () => {
    it('should close email transporter connection', async () => {
      // Act
      await emailService.close();

      // Assert
      expect(mockTransporter.close).toHaveBeenCalled();
    });

    it('should handle close error gracefully', async () => {
      // Arrange
      mockTransporter.close.mockRejectedValue(new Error('Close failed'));

      // Act & Assert - Should not throw
      await expect(emailService.close()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle transporter creation failure', () => {
      // Arrange
      mockNodemailer.createTransport = jest.fn().mockImplementation(() => {
        throw new Error('Transporter creation failed');
      });

      // Act & Assert - Should handle gracefully
      expect(() => new EmailService(mockConfig)).not.toThrow();
    });

    it('should handle malformed email addresses', async () => {
      // Arrange
      const invalidEmail = 'not-an-email';
      const data: EmailVerificationData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify',
        expirationHours: 24,
      };

      const error = new Error('Invalid email address');
      mockTransporter.sendMail.mockRejectedValue(error);

      // Act
      const result = await emailService.sendVerificationEmail(invalidEmail, data);

      // Assert
      expect(result.isErr()).toBe(true);
    });

    it('should handle network timeout errors', async () => {
      // Arrange
      const email = 'user@example.com';
      const data: EmailVerificationData = {
        firstName: 'John',
        verificationUrl: 'https://example.com/verify',
        expirationHours: 24,
      };

      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'ETIMEDOUT';
      mockTransporter.sendMail.mockRejectedValue(timeoutError);

      // Act
      const result = await emailService.sendVerificationEmail(email, data);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Failed to send');
      }
    });
  });
});