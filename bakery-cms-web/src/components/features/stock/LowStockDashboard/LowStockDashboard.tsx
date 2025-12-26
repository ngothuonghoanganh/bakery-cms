/**
 * LowStockDashboard component
 * Displays low stock items and out of stock items
 */

import React, { useMemo } from 'react';
import { Card, Table, Tag, Alert, Empty } from 'antd';
import { WarningOutlined, StopOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { stockItems, loading, error } = useStockItems({
    filters: { lowStockOnly: true },
    pagination: { limit: 50 },
  });

  const getStatusLabel = useMemo(
    () => (status: StockItemStatus): string => {
      const labelMap: Record<StockItemStatus, string> = {
        [StockItemStatus.AVAILABLE]: t('stock.status.inStock'),
        [StockItemStatus.LOW_STOCK]: t('stock.status.lowStock'),
        [StockItemStatus.OUT_OF_STOCK]: t('stock.status.outOfStock'),
      };
      return labelMap[status] || status;
    },
    [t]
  );

  const columns = useMemo(
    () => [
      {
        title: t('stock.lowStockDashboard.item'),
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: t('stock.lowStockDashboard.currentQuantity'),
        key: 'currentQuantity',
        render: (_: unknown, record: StockItem) =>
          `${record.currentQuantity} ${record.unitOfMeasure}`,
      },
      {
        title: t('stock.lowStockDashboard.reorderThreshold'),
        key: 'reorderThreshold',
        render: (_: unknown, record: StockItem) =>
          record.reorderThreshold
            ? `${record.reorderThreshold} ${record.unitOfMeasure}`
            : '-',
      },
      {
        title: t('common.status.label'),
        dataIndex: 'status',
        key: 'status',
        render: (status: StockItemStatus) => (
          <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
            {getStatusLabel(status)}
          </Tag>
        ),
      },
    ],
    [t, getStatusLabel]
  );

  const lowStockCount = stockItems?.filter(
    (item) => item.status === StockItemStatus.LOW_STOCK
  ).length || 0;

  const outOfStockCount = stockItems?.filter(
    (item) => item.status === StockItemStatus.OUT_OF_STOCK
  ).length || 0;

  if (error) {
    return (
      <Card title={t('stock.lowStockDashboard.title')}>
        <Alert
          message={t('stock.lowStockDashboard.loadFailed')}
          description={error.message || t('stock.lowStockDashboard.loadError')}
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card
      title={t('stock.lowStockDashboard.title')}
      extra={
        <span>
          {lowStockCount > 0 && (
            <Tag color="orange" icon={<WarningOutlined />}>
              {lowStockCount} {t('stock.status.lowStock')}
            </Tag>
          )}
          {outOfStockCount > 0 && (
            <Tag color="red" icon={<StopOutlined />}>
              {outOfStockCount} {t('stock.status.outOfStock')}
            </Tag>
          )}
        </span>
      }
    >
      {outOfStockCount > 0 && (
        <Alert
          message={t('stock.lowStockDashboard.criticalTitle')}
          description={t('stock.lowStockDashboard.criticalDescription', { count: outOfStockCount })}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {lowStockCount > 0 && outOfStockCount === 0 && (
        <Alert
          message={t('stock.lowStockDashboard.warningTitle')}
          description={t('stock.lowStockDashboard.warningDescription', { count: lowStockCount })}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!stockItems || stockItems.length === 0 ? (
        <Empty description={t('stock.lowStockDashboard.allHealthy')} />
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
