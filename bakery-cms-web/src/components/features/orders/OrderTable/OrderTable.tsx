/**
 * OrderTable component
 * Displays orders in a table with sorting, filtering, and actions
 */

import React from 'react';
import { Space, Button, Popconfirm, Tag, Typography } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { DataTable } from '../../../shared/DataTable/DataTable';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import type { OrderTableProps } from './OrderTable.types';
import type { Order, OrderStatusType as OrderStatus } from '../../../../types/models/order.model';

const { Text } = Typography;

// Status color mapping
const getStatusColor = (status: OrderStatus): string => {
  const colorMap: Record<OrderStatus, string> = {
    draft: 'default',
    confirmed: 'processing',
    paid: 'success',
    cancelled: 'error',
  };
  return colorMap[status] || 'default';
};

// Status label mapping
const getStatusLabel = (status: OrderStatus): string => {
  const labelMap: Record<OrderStatus, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    paid: 'Completed',
    cancelled: 'Cancelled',
  };
  return labelMap[status] || status;
};

// Order type label mapping
const getOrderTypeLabel = (orderType: string): string => {
  const labelMap: Record<string, string> = {
    temporary: 'Temporary',
    official: 'Official',
  };
  return labelMap[orderType] || orderType;
};

// Business model label mapping
const getBusinessModelLabel = (businessModel: string): string => {
  const labelMap: Record<string, string> = {
    made_to_order: 'Made to Order',
    ready_to_sell: 'Ready to Sell',
  };
  return labelMap[businessModel] || businessModel;
};

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
}) => {
  const columns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      sorter: true,
      width: 150,
      render: (orderNumber: string) => <Text strong>{orderNumber}</Text>,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: true,
      width: 150,
      render: (customerName: string | null) => customerName || <Text type="secondary">N/A</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'orderType',
      key: 'orderType',
      width: 120,
      render: (orderType: string) => getOrderTypeLabel(orderType),
    },
    {
      title: 'Business Model',
      dataIndex: 'businessModel',
      key: 'businessModel',
      width: 150,
      render: (businessModel: string) => getBusinessModelLabel(businessModel),
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: Order) => <Text>{record.items ? record.items.length : 0}</Text>,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: true,
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 180,
      render: (date: Date) => formatDateTime(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: Order) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onView(record)}>
            View
          </Button>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Confirm Order"
                description="Are you sure you want to confirm this order?"
                onConfirm={() => onConfirm(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" size="small" icon={<CheckOutlined />}>
                  Confirm
                </Button>
              </Popconfirm>
            </>
          )}
          {(record.status === 'draft' || record.status === 'confirmed') && (
            <Popconfirm
              title="Cancel Order"
              description="Are you sure you want to cancel this order?"
              onConfirm={() => onCancel(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger size="small" icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete Order"
            description="Are you sure you want to delete this order?"
            onConfirm={() => onDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      dataSource={orders}
      loading={loading}
      rowKey="id"
      scroll={{ x: 1400 }}
    />
  );
};
