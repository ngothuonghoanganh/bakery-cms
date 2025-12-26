/**
 * Registration Page Component
 * Handles new user registration
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card, Progress, Space } from 'antd';
import {
  MailOutlined,
  LockOutlined,
  UserOutlined,
  GoogleOutlined,
  FacebookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { validatePassword } from '@/services/auth.service';
import { useOAuth } from '@/hooks/useOAuth';
import { OAuthProvider } from '@/types/api/oauth.api';

const { Title, Text, Link } = Typography;

/**
 * Registration Page Component
 */
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register, isLoading } = useAuthStore();
  const { loginWithOAuth, isLoading: oauthLoading } = useOAuth();
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  /**
   * Handle password input change for validation
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validation = validatePassword(e.target.value);
    setPasswordStrength(validation.score);
    setPasswordErrors(validation.errors);
  };

  /**
   * Handle registration form submission
   */
  const handleRegister = async (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setError(null);
      await register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      navigate('/', { replace: true });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Registration failed. Please try again.';
      setError(errorMessage);
    }
  };

  /**
   * Handle OAuth registration
   */
  const handleOAuthRegister = async (provider: OAuthProvider) => {
    try {
      setError(null);
      await loginWithOAuth(provider, false);
      // OAuth flow will redirect to callback page
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        `${provider} registration failed. Please try again.`;
      setError(errorMessage);
    }
  };

  /**
   * Get password strength color
   */
  const getPasswordStrengthColor = (): string => {
    if (passwordStrength < 40) return '#ff4d4f';
    if (passwordStrength < 60) return '#faad14';
    if (passwordStrength < 80) return '#1890ff';
    return '#52c41a';
  };

  /**
   * Get password strength text
   */
  const getPasswordStrengthText = (): string => {
    if (passwordStrength < 40) return t('auth.register.passwordStrength.weak', 'Weak');
    if (passwordStrength < 60) return t('auth.register.passwordStrength.medium', 'Medium');
    if (passwordStrength < 80) return t('auth.register.passwordStrength.strong', 'Strong');
    return t('auth.register.passwordStrength.veryStrong', 'Very Strong');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          maxWidth: 500,
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          {t('auth.register.title')}
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}>
          {t('auth.register.subtitle')}
        </Text>

        {error && (
          <Alert
            message={t('auth.register.error', 'Registration Failed')}
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        {/* OAuth Buttons */}
        <div style={{ marginBottom: 24 }}>
          <Button
            icon={<GoogleOutlined />}
            block
            size="large"
            loading={oauthLoading}
            onClick={() => handleOAuthRegister(OAuthProvider.GOOGLE)}
            style={{ marginBottom: 12 }}
          >
            {t('auth.register.signUpWithGoogle', 'Sign up with Google')}
          </Button>
          <Button
            icon={<FacebookOutlined />}
            block
            size="large"
            loading={oauthLoading}
            onClick={() => handleOAuthRegister(OAuthProvider.FACEBOOK)}
          >
            {t('auth.register.signUpWithFacebook', 'Sign up with Facebook')}
          </Button>
        </div>

        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          {t('auth.register.orSignUpWithEmail', 'or sign up with email')}
        </Text>

        {/* Registration Form */}
        <Form name="register" onFinish={handleRegister} layout="vertical" size="large">
          <Space direction="horizontal" style={{ width: '100%' }}>
            <Form.Item
              name="firstName"
              rules={[{ required: true, message: t('common.form.required') }]}
              style={{ flex: 1, marginBottom: 16 }}
            >
              <Input prefix={<UserOutlined />} placeholder={t('auth.register.firstName')} disabled={isLoading} />
            </Form.Item>

            <Form.Item
              name="lastName"
              rules={[{ required: true, message: t('common.form.required') }]}
              style={{ flex: 1, marginBottom: 16 }}
            >
              <Input prefix={<UserOutlined />} placeholder={t('auth.register.lastName')} disabled={isLoading} />
            </Form.Item>
          </Space>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('validation.required', { field: t('auth.register.email') }) },
              { type: 'email', message: t('validation.email') },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder={t('auth.register.email')}
              autoComplete="email"
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: t('validation.required', { field: t('auth.register.password') }) },
              { min: 8, message: t('validation.minLength', { field: t('auth.register.password'), min: 8 }) },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.register.password')}
              autoComplete="new-password"
              onChange={handlePasswordChange}
              disabled={isLoading}
            />
          </Form.Item>

          {/* Password Strength Indicator */}
          {passwordStrength > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Progress
                percent={passwordStrength}
                strokeColor={getPasswordStrengthColor()}
                showInfo={false}
                style={{ marginBottom: 4 }}
              />
              <Space direction="vertical" size={0}>
                <Text style={{ fontSize: 12, color: getPasswordStrengthColor() }}>
                  {t('auth.register.passwordStrengthLabel', 'Password Strength')}: {getPasswordStrengthText()}
                </Text>
                {passwordErrors.length > 0 && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t('auth.register.passwordMissing', 'Missing')}: {passwordErrors.join(', ')}
                  </Text>
                )}
              </Space>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: t('validation.required', { field: t('auth.register.confirmPassword') }) },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('validation.passwordMatch')));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.register.confirmPassword')}
              autoComplete="new-password"
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button type="primary" htmlType="submit" block loading={isLoading} size="large">
              {t('auth.register.submit')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            {t('auth.register.hasAccount')} <Link href="/login">{t('auth.register.login')}</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
