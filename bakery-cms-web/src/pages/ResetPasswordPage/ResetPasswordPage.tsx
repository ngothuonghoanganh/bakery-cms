/**
 * Reset Password Page Component
 * Handles password reset with token from email
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card, Progress, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { validatePassword } from '@/services/auth.service';
import * as authService from '@/services/auth.service';

const { Title, Text } = Typography;

/**
 * Reset Password Page Component
 */
export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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
   * Handle reset password form submission
   */
  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError(null);
      setIsLoading(true);
      await authService.resetPassword({
        token,
        newPassword: values.password,
      });
      setSuccess(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to reset password. The link may have expired.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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

  if (!token) {
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
            maxWidth: 450,
            width: '100%',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          }}
        >
          <Result
            status="error"
            title={t('auth.resetPassword.invalidLinkTitle', 'Invalid Reset Link')}
            subTitle={t('auth.resetPassword.invalidLinkMessage', 'This password reset link is invalid or has expired. Please request a new one.')}
            extra={
              <Button type="primary" onClick={() => navigate('/forgot-password')}>
                {t('auth.resetPassword.requestNewLink', 'Request New Link')}
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

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
          maxWidth: 450,
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {!success ? (
          <>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
              {t('auth.resetPassword.title')}
            </Title>
            <Text
              type="secondary"
              style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}
            >
              {t('auth.resetPassword.subtitle')}
            </Text>

            {error && (
              <Alert
                message={t('common.status.error')}
                description={error}
                type="error"
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form name="reset-password" onFinish={handleSubmit} layout="vertical" size="large">
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t('validation.required', { field: t('auth.resetPassword.password') }) },
                  { min: 8, message: t('validation.minLength', { field: t('auth.resetPassword.password'), min: 8 }) },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder={t('auth.resetPassword.password')}
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                />
              </Form.Item>

              {passwordStrength > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Progress
                    percent={passwordStrength}
                    strokeColor={getPasswordStrengthColor()}
                    showInfo={false}
                    size="small"
                  />
                  {passwordErrors.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('auth.resetPassword.passwordMustInclude', 'Password must include:')}
                      </Text>
                      <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 12 }}>
                        {passwordErrors.map((err, idx) => (
                          <li key={idx} style={{ color: '#ff4d4f' }}>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <Form.Item
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('validation.required', { field: t('auth.resetPassword.confirmPassword') }) },
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
                  placeholder={t('auth.resetPassword.confirmPassword')}
                  disabled={isLoading}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block loading={isLoading} size="large">
                  {t('auth.resetPassword.submit')}
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <Result
            status="success"
            title={t('auth.resetPassword.successTitle', 'Password Reset Successful!')}
            subTitle={t('auth.resetPassword.successMessage', 'Your password has been successfully reset. You can now login with your new password.')}
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                {t('auth.resetPassword.goToLogin', 'Go to Login')}
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
