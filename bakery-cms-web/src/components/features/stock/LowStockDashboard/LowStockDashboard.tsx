/**
 * LowStockDashboard component
 * Displays low stock items and out of stock items
 */

import React from 'react';
import { Card, Table, Tag, Alert, Empty } from 'antd';
import { WarningOutlined, StopOutlined } from '@ant-design/icons';
import { useStockItems } from '@/hooks/useStockItems';
import { StockItemStatus } from '@/types/models/stock.model';
import type { StockItem } from '@/types/models/stock.model';

const getStatusColor = (status: StockItemStatus): string => {
  switch (status) {
    case StockItemStatus.LOW_STOCK:
      return 'orange';
    case StockItemStatus.OUT_OF_STOCK:
      return 'red';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: StockItemStatus) => {
  switch (status) {
    case StockItemStatus.LOW_STOCK:
      return <WarningOutlined />;
    case StockItemStatus.OUT_OF_STOCK:
      return <StopOutlined />;
    default:
      return null;
  }
};

export const LowStockDashboard: React.FC = () => {
  const { stockItems, loading, error } = useStockItems({
    filters: { lowStockOnly: true },
    pagination: { limit: 50 },
  });

  if (error) {
    return (
      <Card title="Low Stock Alert">
        <Alert
          message="Failed to load stock data"
          description={error.message || 'An error occurred while fetching low stock items.'}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  const columns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Current Quantity',
      key: 'currentQuantity',
      render: (_: unknown, record: StockItem) =>
        `${record.currentQuantity} ${record.unitOfMeasure}`,
    },
    {
      title: 'Reorder Threshold',
      key: 'reorderThreshold',
      render: (_: unknown, record: StockItem) =>
        record.reorderThreshold
          ? `${record.reorderThreshold} ${record.unitOfMeasure}`
          : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StockItemStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
  ];

  const lowStockCount = stockItems?.filter(
    (item) => item.status === StockItemStatus.LOW_STOCK
  ).length || 0;

  const outOfStockCount = stockItems?.filter(
    (item) => item.status === StockItemStatus.OUT_OF_STOCK
  ).length || 0;

  return (
    <Card
      title="Low Stock Alert"
      extra={
        <span>
          {lowStockCount > 0 && (
            <Tag color="orange" icon={<WarningOutlined />}>
              {lowStockCount} Low Stock
            </Tag>
          )}
          {outOfStockCount > 0 && (
            <Tag color="red" icon={<StopOutlined />}>
              {outOfStockCount} Out of Stock
            </Tag>
          )}
        </span>
      }
    >
      {outOfStockCount > 0 && (
        <Alert
          message="Critical: Items Out of Stock"
          description={`${outOfStockCount} item(s) are completely out of stock and need immediate restocking.`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {lowStockCount > 0 && outOfStockCount === 0 && (
        <Alert
          message="Low Stock Warning"
          description={`${lowStockCount} item(s) are running low and should be reordered soon.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!stockItems || stockItems.length === 0 ? (
        <Empty description="All stock items are at healthy levels" />
      ) : (
        <Table
          columns={columns}
          dataSource={stockItems}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      )}
    </Card>
  );
};
