/**
 * Login Page Component
 * Handles user authentication with email/password and OAuth
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, Divider, Typography, Alert, Card } from 'antd';
import { MailOutlined, LockOutlined, GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/authStore';
import { useOAuth } from '@/hooks/useOAuth';
import { OAuthProvider } from '@/types/api/oauth.api';

const { Title, Text, Link } = Typography;

interface LocationState {
  from?: { pathname: string };
}

/**
 * Login Page Component
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const { loginWithOAuth, isLoading: oauthLoading } = useOAuth();
  const [error, setError] = useState<string | null>(null);

  // Get redirect path from location state
  const from = (location.state as LocationState)?.from?.pathname || '/';

  /**
   * Handle email/password login
   */
  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      setError(null);
      await login({
        email: values.email,
        password: values.password,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        'Login failed. Please check your credentials.';
      setError(errorMessage);
    }
  };

  /**
   * Handle OAuth login
   */
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    try {
      setError(null);
      await loginWithOAuth(provider, false);
      // OAuth flow will redirect to callback page
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        `${provider} login failed. Please try again.`;
      setError(errorMessage);
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
        <Title level={2} style={{ textAlign: 'center', marginBottom: 8 }}>
          Welcome Back
        </Title>
        <Text
          type="secondary"
          style={{ display: 'block', textAlign: 'center', marginBottom: 32 }}
        >
          Sign in to your Bakery CMS account
        </Text>

        {error && (
          <Alert
            message="Login Failed"
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
            onClick={() => handleOAuthLogin(OAuthProvider.GOOGLE)}
            style={{ marginBottom: 12 }}
          >
            Continue with Google
          </Button>
          <Button
            icon={<FacebookOutlined />}
            block
            size="large"
            loading={oauthLoading}
            onClick={() => handleOAuthLogin(OAuthProvider.FACEBOOK)}
          >
            Continue with Facebook
          </Button>
        </div>

        <Divider>
          <Text type="secondary">or sign in with email</Text>
        </Divider>

        {/* Email/Password Login Form */}
        <Form name="login" onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              autoComplete="email"
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/forgot-password">Forgot password?</Link>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={isLoading}
              size="large"
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Don't have an account? <Link href="/register">Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
