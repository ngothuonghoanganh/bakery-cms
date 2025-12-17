import React from 'react';
import { Empty } from 'antd';
import type { EmptyStateProps } from './EmptyState.types';

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  description = 'No data available',
  action,
}) => {
  return (
    <Empty
      description={description}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      style={{ padding: '48px 0' }}
    >
      {action}
    </Empty>
  );
};
