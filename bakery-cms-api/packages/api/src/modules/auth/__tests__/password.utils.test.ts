/**
 * Password Utils Unit Tests
 * Comprehensive test suite for password utility functions
 */

import {
  hashPassword,
  verifyPassword,
  validatePassword,
  generateSecurePassword,
  isCommonPassword,
  validatePasswordMatch,
  PASSWORD_CONFIG,
} from '../utils/password.utils';

describe('PasswordUtils', () => {
  describe('hashPassword', () => {
    it('should successfully hash a valid password', async () => {
      // Arrange
      const password = 'testPassword123!';

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeDefined();
        expect(result.value).not.toBe(password);
        expect(result.value.length).toBeGreaterThan(30); // bcrypt hashes are long
        expect(result.value.startsWith('$2b$')).toBe(true); // bcrypt format
      }
    });

    it('should fail to hash empty password', async () => {
      // Arrange
      const password = '';

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Password is required');
        expect(result.error.statusCode).toBe(400);
      }
    });

    it('should fail to hash password that exceeds max length', async () => {
      // Arrange
      const password = 'a'.repeat(PASSWORD_CONFIG.MAX_LENGTH + 1);

      // Act
      const result = await hashPassword(password);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain(`Password cannot exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
        expect(result.error.statusCode).toBe(400);
      }
    });
  });

  describe('verifyPassword', () => {
    let hashedPassword: string;

    beforeAll(async () => {
      const hashResult = await hashPassword('testPassword123!');
      if (hashResult.isOk()) {
        hashedPassword = hashResult.value;
      }
    });

    it('should verify correct password', async () => {
      // Arrange
      const password = 'testPassword123!';

      // Act
      const result = await verifyPassword(password, hashedPassword);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should reject incorrect password', async () => {
      // Arrange
      const password = 'wrongPassword';

      // Act
      const result = await verifyPassword(password, hashedPassword);

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it('should fail with empty password', async () => {
      // Arrange
      const password = '';

      // Act
      const result = await verifyPassword(password, hashedPassword);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Password and hash are required');
        expect(result.error.statusCode).toBe(400);
      }
    });

    it('should fail with empty hash', async () => {
      // Arrange
      const password = 'testPassword123!';

      // Act
      const result = await verifyPassword(password, '');

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Password and hash are required');
        expect(result.error.statusCode).toBe(400);
      }
    });
  });

  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      // Arrange
      const password = 'MyS3cure!P@ssw0rd'; // Strong password without common patterns

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.strength).toBe('strong');
      expect(result.score).toBeGreaterThanOrEqual(5);
    });

    it('should reject password that is too short', () => {
      // Arrange
      const password = 'Sh0rt!';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
    });

    it('should reject password without uppercase letters', () => {
      // Arrange
      const password = 'lowercase123!';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase letters', () => {
      // Arrange
      const password = 'UPPERCASE123!';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
      // Arrange
      const password = 'NoNumbersHere!';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special characters', () => {
      // Arrange
      const password = 'NoSpecialChars123';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;\':".,<>?/)');
    });

    it('should reject password with too many repeated characters', () => {
      // Arrange
      const password = 'Passwooood123!'; // Has 4 consecutive 'o's which exceeds MAX_REPEATED_CHARS (3)

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(`Password cannot have more than ${PASSWORD_CONFIG.MAX_REPEATED_CHARS} consecutive repeated characters`);
    });

    it('should reject password with common patterns', () => {
      // Arrange
      const passwords = ['Password123456!', 'TestQwerty123!', 'AdminPassword123!'];

      passwords.forEach(password => {
        // Act
        const result = validatePassword(password);

        // Assert
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password contains common patterns (123456, abcdef, qwerty, etc.)');
      });
    });

    it('should handle empty password', () => {
      // Arrange
      const password = '';

      // Act
      const result = validatePassword(password);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
      expect(result.score).toBe(0);
    });

    it('should give bonus points for longer passwords', () => {
      // Arrange
      const shortPassword = 'Strong1!';
      const longPassword = 'VeryLongStrongPassword123!WithExtraLength';

      // Act
      const shortResult = validatePassword(shortPassword);
      const longResult = validatePassword(longPassword);

      // Assert
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });
  });

  describe('generateSecurePassword', () => {
    it('should generate a password with default length', () => {
      // Act
      const password = generateSecurePassword();

      // Assert
      expect(password).toBeDefined();
      expect(password.length).toBe(16); // Default length
      expect(validatePassword(password).isValid).toBe(true);
    });

    it('should generate a password with specified length', () => {
      // Arrange
      const length = 20;

      // Act
      const password = generateSecurePassword(length);

      // Assert
      expect(password.length).toBe(length);
      expect(validatePassword(password).isValid).toBe(true);
    });

    it('should generate passwords with required character types', () => {
      // Act
      const password = generateSecurePassword(16);

      // Assert
      expect(/[A-Z]/.test(password)).toBe(true); // Contains uppercase
      expect(/[a-z]/.test(password)).toBe(true); // Contains lowercase
      expect(/\d/.test(password)).toBe(true); // Contains numbers
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true); // Contains special chars
    });

    it('should generate different passwords on multiple calls', () => {
      // Act
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();

      // Assert
      expect(password1).not.toBe(password2);
    });

    it('should enforce minimum length of 12 characters', () => {
      // Act
      const password = generateSecurePassword(8); // Try to generate shorter than minimum

      // Assert
      expect(password.length).toBeGreaterThanOrEqual(12); // Should be at least 12
    });
  });

  describe('validatePasswordMatch', () => {
    it('should validate matching passwords', () => {
      // Arrange
      const password = 'password123';
      const confirmPassword = 'password123';

      // Act
      const result = validatePasswordMatch(password, confirmPassword);

      // Assert
      expect(result.isOk()).toBe(true);
    });

    it('should reject non-matching passwords', () => {
      // Arrange
      const password = 'password123';
      const confirmPassword = 'differentPassword';

      // Act
      const result = validatePasswordMatch(password, confirmPassword);

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Passwords do not match');
        expect(result.error.statusCode).toBe(400);
      }
    });
  });

  describe('isCommonPassword', () => {
    it('should identify common passwords', () => {
      // Arrange
      const commonPasswords = [
        '123456',
        'password',
        'qwerty',
        'admin',
        'welcome',
        'monkey',
        'login',
        '12345678',
      ];

      commonPasswords.forEach(password => {
        // Act
        const result = isCommonPassword(password);

        // Assert
        expect(result).toBe(true);
      });
    });

    it('should not identify strong passwords as common', () => {
      // Arrange
      const strongPasswords = [
        'StrongPassword123!',
        'UniquePassphrase456#',
        'MySecretKey789$',
        'ComplexPassword000%',
      ];

      strongPasswords.forEach(password => {
        // Act
        const result = isCommonPassword(password);

        // Assert
        expect(result).toBe(false);
      });
    });

    it('should be case insensitive', () => {
      // Arrange
      const password = 'PASSWORD'; // Common password in uppercase

      // Act
      const result = isCommonPassword(password);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('PASSWORD_CONFIG', () => {
    it('should have sensible default values', () => {
      expect(PASSWORD_CONFIG.MIN_LENGTH).toBeGreaterThan(6);
      expect(PASSWORD_CONFIG.MAX_LENGTH).toBeGreaterThan(PASSWORD_CONFIG.MIN_LENGTH);
      expect(PASSWORD_CONFIG.REQUIRE_UPPERCASE).toBe(true);
      expect(PASSWORD_CONFIG.REQUIRE_LOWERCASE).toBe(true);
      expect(PASSWORD_CONFIG.REQUIRE_NUMBERS).toBe(true);
      expect(PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS).toBe(true);
      expect(PASSWORD_CONFIG.SALT_ROUNDS).toBeGreaterThanOrEqual(10);
    });
  });
});