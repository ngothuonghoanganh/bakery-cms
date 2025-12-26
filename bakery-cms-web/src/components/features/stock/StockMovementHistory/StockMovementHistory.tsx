/**
 * StockMovementHistory component
 * Displays audit trail of stock movements with filtering
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Table, Tag, Space, DatePicker, Select, Button, Card, Alert } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useStockMovements } from '../../../../hooks/useStockMovements';
import type { StockMovement } from '../../../../types/models/stock.model';
import type { StockMovementFiltersRequest } from '../../../../types/api/stock.api';

const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * Movement type color mapping
 */
const getMovementTypeColor = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'received':
      return 'green';
    case 'used':
      return 'blue';
    case 'adjusted':
      return 'orange';
    case 'damaged':
      return 'red';
    case 'expired':
      return 'volcano';
    default:
      return 'default';
  }
};

/**
 * StockMovementHistory component props
 */
export interface StockMovementHistoryProps {
  stockItemId?: string;
  showStockItemColumn?: boolean;
}

/**
 * StockMovementHistory component
 */
export const StockMovementHistory: React.FC<StockMovementHistoryProps> = ({
  stockItemId,
  showStockItemColumn = true,
}) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<StockMovementFiltersRequest>({
    page: 1,
    limit: 10,
    stockItemId,
  });

  const { stockMovements, pagination, loading, error, fetchStockMovements } = useStockMovements(filters);

  const getMovementTypeLabel = useMemo(
    () => (type: string): string => {
      const typeKey = type.toLowerCase();
      const labelMap: Record<string, string> = {
        received: t('stock.movementTypes.received'),
        used: t('stock.movementTypes.used'),
        adjusted: t('stock.movementTypes.adjusted'),
        damaged: t('stock.movementTypes.damaged'),
        expired: t('stock.movementTypes.expired'),
      };
      return labelMap[typeKey] || type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
    },
    [t]
  );

  const movementTypeOptions = useMemo(
    () => [
      { value: 'received', label: t('stock.movementTypes.received') },
      { value: 'used', label: t('stock.movementTypes.used') },
      { value: 'adjusted', label: t('stock.movementTypes.adjusted') },
      { value: 'damaged', label: t('stock.movementTypes.damaged') },
      { value: 'expired', label: t('stock.movementTypes.expired') },
    ],
    [t]
  );

  /**
   * Handle filter changes
   */
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filtering
    }));
  }, []);

  /**
   * Handle table pagination change
   */
  const handleTableChange = useCallback((page: number, pageSize: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize,
    }));
    fetchStockMovements({ ...filters, page, limit: pageSize });
  }, [filters, fetchStockMovements]);

  /**
   * Handle date range change
   */
  const handleDateRangeChange = useCallback((dates: any) => {
    if (dates && dates.length === 2) {
      handleFilterChange('startDate', dates[0].toISOString());
      handleFilterChange('endDate', dates[1].toISOString());
    } else {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters.startDate;
        delete newFilters.endDate;
        return newFilters;
      });
    }
  }, [handleFilterChange]);

  /**
   * Reset filters
   */
  const handleResetFilters = useCallback(() => {
    const resetFilters: StockMovementFiltersRequest = {
      page: 1,
      limit: 10,
      stockItemId,
    };
    setFilters(resetFilters);
    fetchStockMovements(resetFilters);
  }, [stockItemId, fetchStockMovements]);

  /**
   * Table columns
   */
  const columns: ColumnsType<StockMovement> = useMemo(
    () => [
      ...(showStockItemColumn
        ? [
            {
              title: t('stock.movementHistory.stockItem'),
              dataIndex: 'stockItemName',
              key: 'stockItemName',
              width: 200,
            },
          ]
        : []),
      {
        title: t('stock.movementHistory.type'),
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type: string) => (
          <Tag color={getMovementTypeColor(type)}>{getMovementTypeLabel(type)}</Tag>
        ),
      },
      {
        title: t('stock.movementHistory.quantity'),
        dataIndex: 'quantity',
        key: 'quantity',
        width: 100,
        render: (quantity: number) => {
          const isPositive = quantity > 0;
          return (
            <span style={{ color: isPositive ? 'green' : 'red', fontWeight: 'bold' }}>
              {isPositive ? '+' : ''}
              {quantity}
            </span>
          );
        },
      },
      {
        title: t('stock.movementHistory.previous'),
        dataIndex: 'previousQuantity',
        key: 'previousQuantity',
        width: 100,
      },
      {
        title: t('stock.movementHistory.new'),
        dataIndex: 'newQuantity',
        key: 'newQuantity',
        width: 100,
      },
      {
        title: t('stock.movementHistory.reason'),
        dataIndex: 'reason',
        key: 'reason',
        ellipsis: true,
        render: (reason: string | null) => reason || '-',
      },
      {
        title: t('stock.movementHistory.user'),
        dataIndex: 'userName',
        key: 'userName',
        width: 150,
      },
      {
        title: t('stock.movementHistory.date'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      },
    ],
    [t, showStockItemColumn, getMovementTypeLabel]
  );

  return (
    <div>
      {error && (
        <Alert
          message={t('stock.movementHistory.loadFailed')}
          description={error.message || t('stock.movementHistory.loadError')}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={
          <Space>
            <FilterOutlined />
            {t('common.filters')}
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Space wrap>
          <Select
            placeholder={t('stock.movementHistory.movementType')}
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('type', value)}
            value={filters.type}
            options={movementTypeOptions}
          />

          <RangePicker
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            style={{ width: 250 }}
          />

          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            {t('common.actions.reset')}
          </Button>
        </Space>
      </Card>

      <Table<StockMovement>
        columns={columns}
        dataSource={stockMovements}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => t('stock.movementHistory.totalMovements', { total }),
          onChange: handleTableChange,
        }}
      />
    </div>
  );
};
