import React from 'react';
import { Space, Typography } from 'antd';
import type { PageHeaderProps } from './PageHeader.types';

const { Title, Text } = Typography;

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
      }}
    >
      <Space direction="vertical" size={0}>
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </Space>
      {extra && <Space>{extra}</Space>}
    </div>
  );
};
