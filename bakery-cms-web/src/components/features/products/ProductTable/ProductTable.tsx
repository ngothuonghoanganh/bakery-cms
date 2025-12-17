import React, { useMemo } from 'react';
import { Space, Button, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { DataTable } from '../../../shared';
import { ProductStatus, BusinessType } from '../../../../types/models/product.model';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import type { ProductTableProps, ProductColumn } from './ProductTable.types';
import type { Product } from '../../../../types/models/product.model';

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    [ProductStatus.ACTIVE]: 'success',
    [ProductStatus.INACTIVE]: 'default',
    [ProductStatus.OUT_OF_STOCK]: 'error',
  };
  return colorMap[status] || 'default';
};

const getBusinessTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    [BusinessType.MADE_TO_ORDER]: 'Made to Order',
    [BusinessType.READY_TO_SELL]: 'Ready to Sell',
  };
  return labelMap[type] || type;
};

const ProductTableComponent: React.FC<ProductTableProps> = ({
  products,
  loading = false,
  pagination,
  onEdit,
  onDelete,
  onView,
  onTableChange,
}) => {
  // Memoize columns to prevent recreation on every render
  const columns: ProductColumn = useMemo(() => [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 200,
      fixed: 'left',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: true,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Business Type',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 150,
      render: (type: string) => (
        <Tag color="blue">{getBusinessTypeLabel(type)}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: true,
      render: (date: Date) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record.id)}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title="Delete Product"
            description="Are you sure you want to delete this product?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [onView, onEdit, onDelete]); // Dependencies: callback props

  return (
    <DataTable
      columns={columns}
      dataSource={products}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onTableChange}
    />
  );
};

// Memoize component to prevent unnecessary re-renders
export const ProductTable = React.memo(ProductTableComponent);
