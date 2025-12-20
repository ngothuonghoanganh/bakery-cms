/**
 * Login Page with OAuth Integration
 * Example implementation showing how to use OAuth buttons
 */

import React, { useState } from 'react';
import { Form, Input, Button, Divider, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { OAuthProvider } from '../../types/api/oauth.api';
import { OAuthButton } from '../../components/shared/OAuthButton/OAuthButton';
import { useOAuth } from '../../hooks/useOAuth';

const { Title, Text } = Typography;

/**
 * Login Page Component with OAuth
 */
export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithOAuth, isLoading: oauthLoading } = useOAuth();

  /**
   * Handle regular email/password login
   */
  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      // TODO: Implement regular login
      console.log('Login:', values);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OAuth login button click
   */
  const handleOAuthLogin = async (provider: OAuthProvider) => {
    await loginWithOAuth(provider, false); // false = redirect, true = popup
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '20px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
        Sign In
      </Title>

      {/* OAuth Buttons */}
      <div style={{ marginBottom: 24 }}>
        <OAuthButton
          provider={OAuthProvider.GOOGLE}
          onClick={handleOAuthLogin}
          loading={oauthLoading}
          block
        />
        <OAuthButton
          provider={OAuthProvider.FACEBOOK}
          onClick={handleOAuthLogin}
          loading={oauthLoading}
          block
        />
      </div>

      <Divider>
        <Text type="secondary">or sign in with email</Text>
      </Divider>

      {/* Regular Login Form */}
      <Form name="login" onFinish={handleLogin} layout="vertical" size="large">
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Email" autoComplete="email" />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading} size="large">
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary">
          Don't have an account? <a href="/auth/register">Sign up</a>
        </Text>
      </div>
    </div>
  );
};

export default LoginPage;
