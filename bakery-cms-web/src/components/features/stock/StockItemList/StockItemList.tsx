/**
 * StockItemList orchestrator component
 * Coordinates stock item table, form, and filters
 */

import React, { useState, useCallback } from 'react';
import { Button, Table, Tag, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../shared';
import { useNotification } from '../../../../hooks/useNotification';
import { useModal } from '../../../../hooks/useModal';
import { StockItemStatus } from '../../../../types/models/stock.model';
import type { StockItem } from '../../../../types/models/stock.model';
import type { StockItemListProps, StockItemFormValues } from './StockItemList.types';

const getStatusColor = (status: StockItemStatus): string => {
  switch (status) {
    case StockItemStatus.AVAILABLE:
      return 'green';
    case StockItemStatus.LOW_STOCK:
      return 'orange';
    case StockItemStatus.OUT_OF_STOCK:
      return 'red';
    default:
      return 'default';
  }
};

const getStatusLabel = (status: StockItemStatus): string => {
  switch (status) {
    case StockItemStatus.AVAILABLE:
      return 'Available';
    case StockItemStatus.LOW_STOCK:
      return 'Low Stock';
    case StockItemStatus.OUT_OF_STOCK:
      return 'Out of Stock';
    default:
      return status;
  }
};

export const StockItemList: React.FC<StockItemListProps> = ({
  stockItems,
  loading,
  pagination,
  onTableChange,
  onCreate,
  onUpdate,
  onDelete,
  onView,
}) => {
  const { visible, open, close } = useModal();
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const { success, error } = useNotification();

  const handleCreate = useCallback(() => {
    setSelectedStockItem(null);
    open();
  }, [open]);

  const handleEdit = useCallback(
    (stockItem: StockItem) => {
      setSelectedStockItem(stockItem);
      open();
    },
    [open]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
        success('Stock Item Deleted', 'Stock item has been deleted successfully');
      } catch (err) {
        error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete stock item');
      }
    },
    [onDelete, success, error]
  );

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Unit',
      dataIndex: 'unitOfMeasure',
      key: 'unitOfMeasure',
    },
    {
      title: 'Current Quantity',
      dataIndex: 'currentQuantity',
      key: 'currentQuantity',
      render: (quantity: number, record: StockItem) =>
        `${quantity} ${record.unitOfMeasure}`,
    },
    {
      title: 'Reorder Threshold',
      dataIndex: 'reorderThreshold',
      key: 'reorderThreshold',
      render: (threshold: number | null, record: StockItem) =>
        threshold !== null ? `${threshold} ${record.unitOfMeasure}` : 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: StockItemStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: StockItem) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onView(record.id)}
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Stock Item"
            description="Are you sure you want to delete this stock item?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Items"
        subtitle="Manage your stock items and inventory"
        action={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Stock Item
          </Button>
        }
      />

      <Table
        columns={columns}
        dataSource={stockItems}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
        onChange={onTableChange}
      />
    </div>
  );
};
