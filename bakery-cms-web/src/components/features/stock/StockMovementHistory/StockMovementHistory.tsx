/**
 * StockMovementHistory component
 * Displays audit trail of stock movements with filtering
 */

import React, { useState, useCallback } from 'react';
import { Table, Tag, Space, DatePicker, Select, Button, Card } from 'antd';
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
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
 * Movement type label
 */
const getMovementTypeLabel = (type: string): string => {
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
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
  const [filters, setFilters] = useState<StockMovementFiltersRequest>({
    page: 1,
    limit: 10,
    stockItemId,
  });

  const { stockMovements, pagination, loading, fetchStockMovements } = useStockMovements(filters);

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
  const columns: ColumnsType<StockMovement> = [
    ...(showStockItemColumn
      ? [
          {
            title: 'Stock Item',
            dataIndex: 'stockItemName',
            key: 'stockItemName',
            width: 200,
          },
        ]
      : []),
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getMovementTypeColor(type)}>{getMovementTypeLabel(type)}</Tag>
      ),
    },
    {
      title: 'Quantity',
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
      title: 'Previous',
      dataIndex: 'previousQuantity',
      key: 'previousQuantity',
      width: 100,
    },
    {
      title: 'New',
      dataIndex: 'newQuantity',
      key: 'newQuantity',
      width: 100,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string | null) => reason || '-',
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <FilterOutlined />
            Filters
          </Space>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Space wrap>
          <Select
            placeholder="Movement Type"
            allowClear
            style={{ width: 150 }}
            onChange={(value) => handleFilterChange('type', value)}
            value={filters.type}
          >
            <Option value="received">Received</Option>
            <Option value="used">Used</Option>
            <Option value="adjusted">Adjusted</Option>
            <Option value="damaged">Damaged</Option>
            <Option value="expired">Expired</Option>
          </Select>

          <RangePicker
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            style={{ width: 250 }}
          />

          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            Reset
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
          showTotal: (total) => `Total ${total} movements`,
          onChange: handleTableChange,
        }}
      />
    </div>
  );
};
