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
import { useTranslation } from 'react-i18next';
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

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  const columns = [
    {
      title: t('orders.table.orderNumber'),
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      sorter: true,
      width: 150,
      render: (orderNumber: string) => <Text strong>{orderNumber}</Text>,
    },
    {
      title: t('orders.table.customer'),
      dataIndex: 'customerName',
      key: 'customerName',
      sorter: true,
      width: 150,
      render: (customerName: string | null) => customerName || <Text type="secondary">{t('orders.detail.na')}</Text>,
    },
    {
      title: t('orders.table.type'),
      dataIndex: 'orderType',
      key: 'orderType',
      width: 120,
      render: (orderType: string): React.ReactNode => t(`orders.orderType.${orderType}` as any) as string,
    },
    {
      title: t('orders.table.businessModel'),
      dataIndex: 'businessModel',
      key: 'businessModel',
      width: 150,
      render: (businessModel: string): React.ReactNode => t(`orders.businessModel.${businessModel === 'made-to-order' ? 'madeToOrder' : 'readyToSell'}` as any) as string,
    },
    {
      title: t('orders.table.items'),
      key: 'items',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: Order) => <Text>{record.items ? record.items.length : 0}</Text>,
    },
    {
      title: t('orders.table.totalAmount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      sorter: true,
      width: 120,
      align: 'right' as const,
      render: (amount: number) => <Text strong>{formatCurrency(amount)}</Text>,
    },
    {
      title: t('orders.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => (
        <Tag color={getStatusColor(status)}>{t(`orders.status.${status}`)}</Tag>
      ),
    },
    {
      title: t('orders.table.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 180,
      render: (date: Date) => formatDateTime(date),
    },
    {
      title: t('orders.table.actions'),
      key: 'actions',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: Order) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => onView(record)}>
            {t('orders.actions.view')}
          </Button>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                {t('orders.actions.edit')}
              </Button>
              <Popconfirm
                title={t('orders.confirm.confirmTitle')}
                description={t('orders.confirm.confirmDescription')}
                onConfirm={() => onConfirm(record.id)}
                okText={t('orders.confirm.yes')}
                cancelText={t('orders.confirm.no')}
              >
                <Button type="link" size="small" icon={<CheckOutlined />}>
                  {t('orders.actions.confirm')}
                </Button>
              </Popconfirm>
            </>
          )}
          {(record.status === 'draft' || record.status === 'confirmed') && (
            <Popconfirm
              title={t('orders.confirm.cancelTitle')}
              description={t('orders.confirm.cancelDescription')}
              onConfirm={() => onCancel(record.id)}
              okText={t('orders.confirm.yes')}
              cancelText={t('orders.confirm.no')}
            >
              <Button type="link" danger size="small" icon={<CloseOutlined />}>
                {t('orders.actions.cancel')}
              </Button>
            </Popconfirm>
          )}
          <Popconfirm
            title={t('orders.confirm.deleteTitle')}
            description={t('orders.confirm.deleteDescription')}
            onConfirm={() => onDelete(record.id)}
            okText={t('orders.confirm.yes')}
            cancelText={t('orders.confirm.no')}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              {t('orders.actions.delete')}
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
