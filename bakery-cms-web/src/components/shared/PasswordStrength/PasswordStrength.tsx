/**
 * Password Strength Component
 * Real-time password validation and strength indicator
 */

import React from 'react';
import { Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './PasswordStrength.css';

/**
 * Password requirements (matches backend BR-005)
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Password strength levels
 */
const PasswordStrengthLevel = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
  VERY_STRONG: 'very_strong',
} as const;

type PasswordStrengthType = typeof PasswordStrengthLevel[keyof typeof PasswordStrengthLevel];

/**
 * Validation result
 */
type ValidationResult = {
  isValid: boolean;
  strength: PasswordStrengthType;
  errors: string[];
  score: number;
};

/**
 * Component props
 */
interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
  className?: string;
}

/**
 * Validate password
 */
const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  let score = 0;

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  } else {
    score += 20;
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
    errors.push('One number');
  } else if (/[0-9]/.test(password)) {
    score += 20;
  }

  const specialCharRegex = new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
  if (PASSWORD_REQUIREMENTS.requireSpecialChar && !specialCharRegex.test(password)) {
    errors.push('One special character');
  } else if (specialCharRegex.test(password)) {
    score += 20;
  }

  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  let strength: PasswordStrengthType;
  if (score < 40) {
    strength = PasswordStrengthLevel.WEAK;
  } else if (score < 60) {
    strength = PasswordStrengthLevel.MEDIUM;
  } else if (score < 80) {
    strength = PasswordStrengthLevel.STRONG;
  } else {
    strength = PasswordStrengthLevel.VERY_STRONG;
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
    score: Math.min(score, 100),
  };
};

/**
 * Get strength color
 */
const getStrengthColor = (strength: PasswordStrengthType): string => {
  switch (strength) {
    case PasswordStrengthLevel.WEAK:
      return '#ff4d4f';
    case PasswordStrengthLevel.MEDIUM:
      return '#faad14';
    case PasswordStrengthLevel.STRONG:
      return '#52c41a';
    case PasswordStrengthLevel.VERY_STRONG:
      return '#1890ff';
    default:
      return '#d9d9d9';
  }
};

/**
 * Get strength label
 */
const getStrengthLabel = (strength: PasswordStrengthType): string => {
  switch (strength) {
    case PasswordStrengthLevel.WEAK:
      return 'Weak';
    case PasswordStrengthLevel.MEDIUM:
      return 'Medium';
    case PasswordStrengthLevel.STRONG:
      return 'Strong';
    case PasswordStrengthLevel.VERY_STRONG:
      return 'Very Strong';
    default:
      return '';
  }
};

/**
 * Password Strength Component
 */
export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showRequirements = true,
  className = '',
}) => {
  if (!password) {
    return null;
  }

  const result = validatePassword(password);

  return (
    <div className={`password-strength ${className}`}>
      {/* Strength meter */}
      <div className="password-strength-meter">
        <Progress
          percent={result.score}
          strokeColor={getStrengthColor(result.strength)}
          showInfo={false}
          size="small"
        />
        <span
          className="password-strength-label"
          style={{ color: getStrengthColor(result.strength) }}
        >
          {getStrengthLabel(result.strength)}
        </span>
      </div>

      {/* Requirements list */}
      {showRequirements && (
        <ul className="password-requirements">
          <li className={password.length >= PASSWORD_REQUIREMENTS.minLength ? 'met' : ''}>
            {password.length >= PASSWORD_REQUIREMENTS.minLength ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
            )}
            <span>At least {PASSWORD_REQUIREMENTS.minLength} characters</span>
          </li>
          <li className={/[A-Z]/.test(password) ? 'met' : ''}>
            {/[A-Z]/.test(password) ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
            )}
            <span>One uppercase letter (A-Z)</span>
          </li>
          <li className={/[a-z]/.test(password) ? 'met' : ''}>
            {/[a-z]/.test(password) ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
            )}
            <span>One lowercase letter (a-z)</span>
          </li>
          <li className={/[0-9]/.test(password) ? 'met' : ''}>
            {/[0-9]/.test(password) ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
            )}
            <span>One number (0-9)</span>
          </li>
          <li className={new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password) ? 'met' : ''}>
            {new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password) ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#d9d9d9' }} />
            )}
            <span>One special character ({PASSWORD_REQUIREMENTS.specialChars})</span>
          </li>
        </ul>
      )}
    </div>
  );
};

export default PasswordStrength;
