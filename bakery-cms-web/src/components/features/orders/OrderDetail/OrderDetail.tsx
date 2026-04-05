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
  CreditCardOutlined,
  RollbackOutlined,
  PlusCircleOutlined,
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
    refund_pending: 'warning',
    refunded: 'geekblue',
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
  onViewPayments,
  onRefund,
  onManageExtras,
  onBack,
  loading = false,
}) => {
  const { t } = useTranslation();

  // Table columns for order items
  const itemsColumns = [
    {
      title: t('orders.detail.productCode', 'Product Code'),
      dataIndex: 'productCode',
      key: 'productCode',
      width: 170,
      render: (value: string | null) => <Text code>{value || 'UNKNOWN'}</Text>,
    },
    {
      title: t('orders.detail.productName', 'Product Name'),
      dataIndex: 'productName',
      key: 'productName',
      render: (value: string | null) => <Text strong>{value || t('orders.detail.na')}</Text>,
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
    {
      title: t('orders.detail.itemNotes', 'Item Notes'),
      dataIndex: 'notes',
      key: 'notes',
      width: 220,
      render: (value: string | null) =>
        value?.trim() ? value : <Text type="secondary">{t('orders.detail.na')}</Text>,
    },
  ];

  // Show action buttons based on order status
  const canEdit = order.status === 'draft';
  const canConfirm = order.status === 'draft';
  const canCancel = order.status === 'draft' || order.status === 'confirmed';
  const canRefund = order.status === 'paid';
  const canDelete = order.status === 'draft';
  const canManageExtras =
    order.status !== 'cancelled' &&
    order.status !== 'refunded' &&
    order.status !== 'refund_pending';

  return (
    <div>
      {/* Header with actions */}
      <div
        style={{
          marginBottom: 24,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('orders.detail.backToOrders')}
        </Button>

        <Space wrap>
          {onViewPayments && (
            <Button icon={<CreditCardOutlined />} onClick={onViewPayments}>
              {t('orders.actions.viewPayments')}
            </Button>
          )}
          {canManageExtras && onManageExtras && (
            <Button icon={<PlusCircleOutlined />} onClick={onManageExtras}>
              {t('orders.actions.manageExtras', 'Manage Extras')}
            </Button>
          )}
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={onEdit}>
              {t('orders.actions.edit')}
            </Button>
          )}
          {canConfirm && (
            <Button type="primary" icon={<CheckOutlined />} onClick={onConfirm}>
              {t('orders.actions.confirmOrder')}
            </Button>
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
          {canRefund && onRefund && (
            <Button icon={<RollbackOutlined />} onClick={onRefund}>
              {t('orders.actions.refundOrder')}
            </Button>
          )}
          {canDelete && (
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
          )}
        </Space>
      </div>

      {/* Order information card */}
      <Card title={<Title level={3}>{t('orders.detail.orderNumber')} #{order.orderNumber}</Title>} loading={loading}>
        <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered>
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
          <Descriptions.Item label={t('orders.detail.customerAddress')} span={2}>
            {order.customerAddress || <Text type="secondary">{t('orders.detail.na')}</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.totalAmount')} span={2}>
            <Text strong style={{ fontSize: 18 }}>
              {formatCurrency(order.totalAmount)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.extraAmount')}>
            <Text>{formatCurrency(order.extraAmount || 0)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.extraPaymentStatus')}>
            {order.hasPendingExtraPayment ? (
              <Tag color="red">
                {t('orders.detail.pendingExtraPayment', 'Extra payment pending')}
              </Tag>
            ) : (
              <Tag color="green">{t('orders.detail.noPendingExtraPayment', 'No pending extra')}</Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('orders.detail.extraFees')} span={2}>
            {order.extraFees.length > 0 ? (
              <Space wrap>
                {order.extraFees.map((fee) => (
                  <Tag key={fee.id}>
                    {fee.name}: {formatCurrency(fee.amount)}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Text type="secondary">{t('orders.detail.noExtraFees', 'No extra fee')}</Text>
            )}
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
          scroll={{ x: 1040 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5} align="right">
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
