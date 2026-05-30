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
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
      }}
    >
      <Space direction="vertical" size={0}>
        <Title level={2} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </Space>
      {extra && <Space wrap style={{ justifyContent: 'flex-end' }}>{extra}</Space>}
    </div>
  );
};
