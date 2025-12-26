/**
 * OAuth Callback Page
 * Handles OAuth provider redirect callback
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useOAuth } from '../../hooks/useOAuth';
import './OAuthCallback.css';

/**
 * OAuth Callback Component
 * Displays loading state while processing OAuth callback
 */
export const OAuthCallback: React.FC = () => {
  const { t } = useTranslation();
  const { isLoading, error } = useOAuth();

  useEffect(() => {
    // Callback is automatically handled by useOAuth hook
    // This component just shows the loading/error state
  }, []);

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-content">
        {isLoading && (
          <>
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} size="large" />
            <h2>{t('auth.oauth.completing', 'Completing authentication...')}</h2>
            <p>{t('auth.oauth.pleaseWait', 'Please wait while we log you in.')}</p>
          </>
        )}

        {error && (
          <>
            <div className="oauth-callback-error">
              <h2>{t('auth.oauth.failed', 'Authentication Failed')}</h2>
              <p>{error}</p>
              <p>{t('auth.oauth.redirecting', 'Redirecting to login page...')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
