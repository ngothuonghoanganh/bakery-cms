/**
 * OAuth Callback Page
 * Handles OAuth provider redirect callback
 */

import React, { useEffect } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useOAuth } from '../../hooks/useOAuth';
import './OAuthCallback.css';

/**
 * OAuth Callback Component
 * Displays loading state while processing OAuth callback
 */
export const OAuthCallback: React.FC = () => {
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
            <h2>Completing authentication...</h2>
            <p>Please wait while we log you in.</p>
          </>
        )}

        {error && (
          <>
            <div className="oauth-callback-error">
              <h2>Authentication Failed</h2>
              <p>{error}</p>
              <p>Redirecting to login page...</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
