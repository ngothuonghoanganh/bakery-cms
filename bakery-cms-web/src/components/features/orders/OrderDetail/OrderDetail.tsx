/**
 * OrderDetail component
 * Displays detailed information about a single order
 */

import React from 'react';
import { Card, Descriptions, Button, Space, Tag, Table, Typography, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import type { OrderDetailProps } from './OrderDetail.types';
import type { OrderStatus } from '../../../../types/models/order.model';

const { Title, Text } = Typography;

// Status color mapping
const getStatusColor = (status: OrderStatus): string => {
  const colorMap: Record<OrderStatus, string> = {
    draft: 'default',
    confirmed: 'processing',
    completed: 'success',
    cancelled: 'error',
  };
  return colorMap[status] || 'default';
};

// Status label mapping
const getStatusLabel = (status: OrderStatus): string => {
  const labelMap: Record<OrderStatus, string> = {
    draft: 'Draft',
    confirmed: 'Confirmed',
    completed: 'Completed',
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

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
  onBack,
  loading = false,
}) => {
  // Table columns for order items
  const itemsColumns = [
    {
      title: 'Product ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 120,
      align: 'right' as const,
      render: (subtotal: number) => <Text strong>{formatCurrency(subtotal)}</Text>,
    },
  ];

  // Show action buttons based on order status
  const canEdit = order.status === 'draft';
  const canConfirm = order.status === 'draft';
  const canCancel = order.status === 'draft' || order.status === 'confirmed';

  return (
    <div>
      {/* Header with actions */}
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
        >
          Back to Orders
        </Button>

        <Space>
          {canEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          {canConfirm && (
            <Popconfirm
              title="Confirm Order"
              description="Are you sure you want to confirm this order?"
              onConfirm={onConfirm}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="primary"
                icon={<CheckOutlined />}
              >
                Confirm Order
              </Button>
            </Popconfirm>
          )}
          {canCancel && (
            <Popconfirm
              title="Cancel Order"
              description="Are you sure you want to cancel this order?"
              onConfirm={onCancel}
              okText="Yes"
              cancelText="No"
            >
              <Button
                danger
                icon={<CloseOutlined />}
              >
                Cancel Order
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="Delete Order"
            description="Are you sure you want to delete this order? This action cannot be undone."
            onConfirm={onDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      </Space>

      {/* Order information card */}
      <Card title={<Title level={3}>Order #{order.orderNumber}</Title>} loading={loading}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Order Number">
            <Text strong>{order.orderNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Order Type">
            {getOrderTypeLabel(order.orderType)}
          </Descriptions.Item>
          <Descriptions.Item label="Business Model">
            {getBusinessModelLabel(order.businessModel)}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Name">
            {order.customerName || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Customer Phone">
            {order.customerPhone || <Text type="secondary">N/A</Text>}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount" span={2}>
            <Text strong style={{ fontSize: 18 }}>{formatCurrency(order.totalAmount)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatDateTime(order.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {formatDateTime(order.updatedAt)}
          </Descriptions.Item>
          {order.confirmedAt && (
            <Descriptions.Item label="Confirmed At" span={2}>
              {formatDateTime(order.confirmedAt)}
            </Descriptions.Item>
          )}
          {order.notes && (
            <Descriptions.Item label="Notes" span={2}>
              {order.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Order items card */}
      <Card
        title={<Title level={4}>Order Items</Title>}
        style={{ marginTop: 24 }}
        loading={loading}
      >
        <Table
          columns={itemsColumns}
          dataSource={order.items || []}
          rowKey="id"
          pagination={false}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  <Text strong>Total:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ fontSize: 16 }}>
                    {formatCurrency(order.totalAmount)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};
