import React from 'react';
import { Card, Statistic, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { StatCardProps } from './StatCard.types';

const { Text } = Typography;

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel = 'vs last month',
  color = '#1890ff',
  loading = false,
  className,
}) => {
  return (
    <Card loading={loading} bordered={false} className={className}>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div className="dashboard-stat-card__header">
          <Text type="secondary">{title}</Text>
          <div className="dashboard-stat-card__icon" style={{ color }}>
            {icon}
          </div>
        </div>

        <Statistic value={value} valueStyle={{ fontSize: 24, fontWeight: 600 }} />

        {trend && (
          <Space size={4}>
            {trend.isPositive ? (
              <ArrowUpOutlined style={{ color: '#52c41a' }} />
            ) : (
              <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
            )}
            <Text
              style={{
                color: trend.isPositive ? '#52c41a' : '#ff4d4f',
                fontSize: 12,
              }}
            >
              {Math.abs(trend.value)}%
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {trendLabel}
            </Text>
          </Space>
        )}
      </Space>
    </Card>
  );
};
