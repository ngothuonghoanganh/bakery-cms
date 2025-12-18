/**
 * OAuth Button Component
 * Button for OAuth provider authentication
 */

import React from 'react';
import { Button } from 'antd';
import { GoogleOutlined, FacebookOutlined } from '@ant-design/icons';
import { OAuthProvider } from '../../../types/api/oauth.api';
import './OAuthButton.css';

/**
 * OAuth Button Props
 */
export interface OAuthButtonProps {
  provider: OAuthProvider;
  onClick: (provider: OAuthProvider) => void;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  size?: 'small' | 'middle' | 'large';
  className?: string;
}

/**
 * Get provider display name
 */
const getProviderName = (provider: OAuthProvider): string => {
  switch (provider) {
    case OAuthProvider.GOOGLE:
      return 'Google';
    case OAuthProvider.FACEBOOK:
      return 'Facebook';
    default:
      return provider;
  }
};

/**
 * Get provider icon
 */
const getProviderIcon = (provider: OAuthProvider): React.ReactNode => {
  switch (provider) {
    case OAuthProvider.GOOGLE:
      return <GoogleOutlined />;
    case OAuthProvider.FACEBOOK:
      return <FacebookOutlined />;
    default:
      return null;
  }
};

/**
 * Get provider button class
 */
const getProviderClass = (provider: OAuthProvider): string => {
  switch (provider) {
    case OAuthProvider.GOOGLE:
      return 'oauth-button-google';
    case OAuthProvider.FACEBOOK:
      return 'oauth-button-facebook';
    default:
      return '';
  }
};

/**
 * OAuth Button Component
 */
export const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  onClick,
  loading = false,
  disabled = false,
  block = false,
  size = 'large',
  className = '',
}) => {
  const handleClick = () => {
    if (!loading && !disabled) {
      onClick(provider);
    }
  };

  const providerName = getProviderName(provider);
  const providerIcon = getProviderIcon(provider);
  const providerClass = getProviderClass(provider);

  return (
    <Button
      type="default"
      icon={providerIcon}
      size={size}
      block={block}
      loading={loading}
      disabled={disabled}
      onClick={handleClick}
      className={`oauth-button ${providerClass} ${className}`}
    >
      Continue with {providerName}
    </Button>
  );
};

export default OAuthButton;
