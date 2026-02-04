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
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import type { OrderDetailProps } from './OrderDetail.types';
import type { OrderStatus } from '../../../../types/models/order.model';

const { Title, Text } = Typography;

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

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
  onBack,
  loading = false,
}) => {
  const { t } = useTranslation();

  // Table columns for order items
  const itemsColumns = [
    {
      title: t('orders.detail.productId'),
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
    },
    {
      title: t('orders.detail.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'center' as const,
    },
    {
      title: t('orders.detail.unitPrice'),
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: t('orders.detail.subtotal'),
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
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('orders.detail.backToOrders')}
        </Button>

        <Space>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={onEdit}>
              {t('orders.actions.edit')}
            </Button>
          )}
          {canConfirm && (
            <Popconfirm
              title={t('orders.confirm.confirmTitle')}
              description={t('orders.confirm.confirmDescription')}
              onConfirm={onConfirm}
              okText={t('orders.confirm.yes')}
              cancelText={t('orders.confirm.no')}
            >
              <Button type="primary" icon={<CheckOutlined />}>
                {t('orders.actions.confirmOrder')}
              </Button>
            </Popconfirm>
          )}
          {canCancel && (
            <Popconfirm
              title={t('orders.confirm.cancelTitle')}
              description={t('orders.confirm.cancelDescription')}
              onConfirm={onCancel}
              okText={t('orders.confirm.yes')}
              cancelText={t('orders.confirm.no')}
            >
              <Button danger icon={<CloseOutlined />}>
                {t('orders.actions.cancelOrder')}
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={t('orders.confirm.deleteTitle')}
            description={t('orders.confirm.deleteDescription')}
            onConfirm={onDelete}
            okText={t('orders.confirm.yes')}
            cancelText={t('orders.confirm.no')}
          >
            <Button danger icon={<DeleteOutlined />}>
              {t('orders.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      </Space>

      {/* Order information card */}
      <Card title={<Title level={3}>{t('orders.detail.orderNumber')} #{order.orderNumber}</Title>} loading={loading}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('orders.detail.orderNumber')}>
            <Text strong>{order.orderNumber}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.status')}>
            <Tag color={getStatusColor(order.status)}>{t(`orders.status.${order.status}`)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.orderType')}>
            {t(`orders.orderType.${order.orderType}`)}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.businessModel')}>
            {t(`orders.businessModel.${order.businessModel === 'made-to-order' ? 'madeToOrder' : 'readyToSell'}`)}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.customerName')}>
            {order.customerName || <Text type="secondary">{t('orders.detail.na')}</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.customerPhone')}>
            {order.customerPhone || <Text type="secondary">{t('orders.detail.na')}</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.totalAmount')} span={2}>
            <Text strong style={{ fontSize: 18 }}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.createdAt')}>
            {formatDateTime(order.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.updatedAt')}>
            {formatDateTime(order.updatedAt)}
          </Descriptions.Item>
          {order.confirmedAt && (
            <Descriptions.Item label={t('orders.detail.confirmedAt')} span={2}>
              {formatDateTime(order.confirmedAt)}
            </Descriptions.Item>
          )}
          {order.notes && (
            <Descriptions.Item label={t('orders.detail.notes')} span={2}>
              {order.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Order items card */}
      <Card
        title={<Title level={4}>{t('orders.detail.orderItems')}</Title>}
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
                  <Text strong>{t('orders.detail.total')}:</Text>
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
