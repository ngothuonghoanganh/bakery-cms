/**
 * Forgot Password Page Component
 * Handles password reset email request
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Alert, Card, Result } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import * as authService from '@/services/auth.service';

const { Title, Text, Link } = Typography;

/**
 * Forgot Password Page Component
 */
export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  /**
   * Handle forgot password form submission
   */
  const handleSubmit = async (values: { email: string }) => {
    try {
      setError(null);
      setIsLoading(true);
      setEmail(values.email);
      await authService.forgotPassword({ email: values.email });
      setEmailSent(true);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Failed to send reset email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
          maxWidth: 450,
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {!emailSent ? (
          <>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
              {t('auth.forgotPassword.title')}
            </Title>
            <Text
              type="secondary"
              style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}
            >
              {t('auth.forgotPassword.subtitle')}
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

            <Form name="forgot-password" onFinish={handleSubmit} layout="vertical" size="large">
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: t('validation.required', { field: t('auth.forgotPassword.email') }) },
                  { type: 'email', message: t('validation.email') },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder={t('auth.forgotPassword.email')}
                  autoComplete="email"
                  disabled={isLoading}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button type="primary" htmlType="submit" block loading={isLoading} size="large">
                  {t('auth.forgotPassword.submit')}
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate('/login')}>
                {t('auth.forgotPassword.backToLogin')}
              </Button>
            </div>
          </>
        ) : (
          <Result
            status="success"
            title={t('auth.forgotPassword.emailSentTitle', 'Email Sent!')}
            subTitle={
              <>
                <p>
                  {t('auth.forgotPassword.emailSentMessage', { email, defaultValue: `We've sent a password reset link to {{email}}` })}
                </p>
                <p>{t('auth.forgotPassword.checkEmailInstructions', 'Please check your email and follow the instructions to reset your password.')}</p>
                <p style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '16px' }}>
                  {t('auth.forgotPassword.didntReceive', "Didn't receive the email? Check your spam folder or")}{' '}
                  <Link onClick={() => setEmailSent(false)}>{t('auth.forgotPassword.tryAgain', 'try again')}</Link>
                </p>
              </>
            }
            extra={
              <Button type="primary" onClick={() => navigate('/login')}>
                {t('auth.forgotPassword.backToLogin')}
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
