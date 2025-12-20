import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreOutlined,
  TeamOutlined,
  PlusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/shared';
import { StatCard } from '../../components/features/dashboard/StatCard/StatCard';
import { RecentActivity } from '../../components/features/dashboard/RecentActivity/RecentActivity';
import { QuickActions } from '../../components/features/dashboard/QuickActions/QuickActions';
import type { QuickAction } from '../../components/features/dashboard/QuickActions/QuickActions.types';
import type { ActivityItem } from '../../components/features/dashboard/RecentActivity/RecentActivity.types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock statistics data
  const stats = [
    {
      title: 'Total Orders',
      value: 1234,
      icon: <ShoppingCartOutlined />,
      trend: { value: 12.5, isPositive: true },
      color: '#1890ff',
    },
    {
      title: 'Total Revenue',
      value: '$45,678',
      icon: <DollarOutlined />,
      trend: { value: 8.3, isPositive: true },
      color: '#52c41a',
    },
    {
      title: 'Total Products',
      value: 156,
      icon: <AppstoreOutlined />,
      trend: { value: 3.2, isPositive: false },
      color: '#fa8c16',
    },
    {
      title: 'Active Customers',
      value: 892,
      icon: <TeamOutlined />,
      trend: { value: 15.7, isPositive: true },
      color: '#722ed1',
    },
  ];

  // Mock recent activity data
  const recentActivities: ActivityItem[] = useMemo(
    () => [
      {
        id: '1',
        type: 'order',
        title: 'New Order #ORD-20251217-0001',
        description: 'Customer ordered 3 items',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'success',
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        description: 'Payment for order #ORD-20251217-0002',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        status: 'success',
      },
      {
        id: '3',
        type: 'product',
        title: 'Product Stock Low',
        description: 'Chocolate Chip Cookie - Only 5 left',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'warning',
      },
      {
        id: '4',
        type: 'order',
        title: 'Order Confirmed',
        description: 'Order #ORD-20251217-0003 confirmed',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'info',
      },
      {
        id: '5',
        type: 'payment',
        title: 'Payment Pending',
        description: 'Waiting for payment confirmation',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        status: 'warning',
      },
    ],
    []
  );

  // Quick actions configuration
  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        key: 'new-order',
        title: 'New Order',
        description: 'Create a new order',
        icon: <PlusOutlined />,
        color: '#1890ff',
        onClick: () => navigate('/orders'),
      },
      {
        key: 'new-product',
        title: 'New Product',
        description: 'Add a new product',
        icon: <AppstoreOutlined />,
        color: '#52c41a',
        onClick: () => navigate('/products'),
      },
      {
        key: 'view-orders',
        title: 'View Orders',
        description: 'Manage all orders',
        icon: <FileTextOutlined />,
        color: '#fa8c16',
        onClick: () => navigate('/orders'),
      },
      {
        key: 'view-payments',
        title: 'View Payments',
        description: 'Check payment status',
        icon: <DollarOutlined />,
        color: '#722ed1',
        onClick: () => navigate('/payments'),
      },
    ],
    [navigate]
  );

  const handleActivityClick = (item: ActivityItem) => {
    // Navigate based on activity type
    if (item.type === 'order') {
      navigate('/orders');
    } else if (item.type === 'payment') {
      navigate('/payments');
    } else if (item.type === 'product') {
      navigate('/products');
    }
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your bakery."
      />

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <QuickActions actions={quickActions} />
      </div>

      {/* Recent Activity */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <RecentActivity items={recentActivities} onItemClick={handleActivityClick} />
        </Col>
      </Row>
    </div>
  );
};
