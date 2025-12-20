import React from 'react';
import { Card, List, Space, Typography, Avatar } from 'antd';
import { ShoppingCartOutlined, DollarOutlined, AppstoreOutlined } from '@ant-design/icons';
import { StatusBadge } from '../../../shared';
import { formatRelativeTime } from '../../../../utils/format.utils';
import type { RecentActivityProps, ActivityItem } from './RecentActivity.types';

const { Text } = Typography;

const getIcon = (type: ActivityItem['type']) => {
  const iconMap = {
    order: <ShoppingCartOutlined />,
    payment: <DollarOutlined />,
    product: <AppstoreOutlined />,
  };
  return iconMap[type];
};

const getColor = (type: ActivityItem['type']) => {
  const colorMap = {
    order: '#1890ff',
    payment: '#52c41a',
    product: '#fa8c16',
  };
  return colorMap[type];
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  items,
  loading = false,
  onItemClick,
}) => {
  return (
    <Card title="Recent Activity" bordered={false} style={{ height: '100%' }}>
      <List
        loading={loading}
        dataSource={items}
        renderItem={(item) => (
          <List.Item
            style={{ cursor: onItemClick ? 'pointer' : 'default' }}
            onClick={() => onItemClick?.(item)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: getColor(item.type) }}
                  icon={getIcon(item.type)}
                />
              }
              title={
                <Space>
                  <span>{item.title}</span>
                  {item.status && (
                    <StatusBadge status={item.status} text={item.status.toUpperCase()} />
                  )}
                </Space>
              }
              description={
                <Space direction="vertical" size={0}>
                  <Text type="secondary">{item.description}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatRelativeTime(item.timestamp)}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};
