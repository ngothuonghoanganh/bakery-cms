import React from 'react';
import { Spin } from 'antd';
import type { LoadingSpinnerProps } from './LoadingSpinner.types';

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  tip = 'Loading...',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100%',
        }}
      >
        <Spin size="large" tip={tip} />
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <Spin size="large" tip={tip} />
    </div>
  );
};
