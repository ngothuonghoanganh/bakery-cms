/**
 * PaymentTable Component
 * Displays payments in a table with sorting, actions, and formatting
 */

import React, { useMemo } from 'react';
import { Space, Button, Tag, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../../shared/DataTable/DataTable';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import { PaymentMethod, PaymentStatus } from '../../../../types/models/payment.model';
import type { Payment } from '../../../../types/models/payment.model';
import type { PaymentTableProps } from './PaymentTable.types';
import type { ColumnsType } from 'antd/es/table';

const getStatusColor = (status: PaymentStatus): string => {
  const colorMap: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'warning',
    [PaymentStatus.PAID]: 'success',
    [PaymentStatus.FAILED]: 'error',
    [PaymentStatus.CANCELLED]: 'default',
  };
  return colorMap[status] || 'default';
};

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
}) => {
  const { t } = useTranslation();

  const getStatusLabel = useMemo(
    () => (status: PaymentStatus): string => {
      const labelMap: Record<PaymentStatus, string> = {
        [PaymentStatus.PENDING]: t('payments.status.pending'),
        [PaymentStatus.PAID]: t('payments.status.paid'),
        [PaymentStatus.FAILED]: t('payments.status.failed'),
        [PaymentStatus.CANCELLED]: t('payments.status.cancelled'),
      };
      return labelMap[status] || status;
    },
    [t]
  );

  const getMethodLabel = useMemo(
    () => (method: PaymentMethod): string => {
      const labelMap: Record<PaymentMethod, string> = {
        [PaymentMethod.CASH]: t('payments.method.cash'),
        [PaymentMethod.VIETQR]: t('payments.method.vietqr'),
        [PaymentMethod.BANK_TRANSFER]: t('payments.method.bankTransfer'),
      };
      return labelMap[method] || method;
    },
    [t]
  );

  const columns: ColumnsType<Payment> = useMemo(
    () => [
      {
        title: t('payments.table.paymentId'),
        dataIndex: 'id',
        key: 'id',
        width: 150,
        ellipsis: true,
      },
      {
        title: t('payments.table.orderId'),
        dataIndex: 'orderId',
        key: 'orderId',
        width: 150,
        ellipsis: true,
      },
      {
        title: t('payments.table.amount'),
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        align: 'right',
        render: (amount: number) => formatCurrency(amount),
        sorter: (a, b) => a.amount - b.amount,
      },
      {
        title: t('payments.table.method'),
        dataIndex: 'method',
        key: 'method',
        width: 130,
        render: (method: PaymentMethod) => getMethodLabel(method),
        filters: [
          { text: t('payments.method.cash'), value: PaymentMethod.CASH },
          { text: t('payments.method.vietqr'), value: PaymentMethod.VIETQR },
          { text: t('payments.method.bankTransfer'), value: PaymentMethod.BANK_TRANSFER },
        ],
        onFilter: (value, record) => record.method === value,
      },
      {
        title: t('payments.table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (status: PaymentStatus) => (
          <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
        ),
        filters: [
          { text: t('payments.status.pending'), value: PaymentStatus.PENDING },
          { text: t('payments.status.paid'), value: PaymentStatus.PAID },
          { text: t('payments.status.failed'), value: PaymentStatus.FAILED },
          { text: t('payments.status.cancelled'), value: PaymentStatus.CANCELLED },
        ],
        onFilter: (value, record) => record.status === value,
      },
      {
        title: t('payments.table.transactionId'),
        dataIndex: 'transactionId',
        key: 'transactionId',
        width: 150,
        ellipsis: true,
        render: (transactionId: string | null) => transactionId || '-',
      },
      {
        title: t('payments.table.paidAt'),
        dataIndex: 'paidAt',
        key: 'paidAt',
        width: 160,
        render: (paidAt: Date | null) => (paidAt ? formatDateTime(paidAt) : '-'),
        sorter: (a, b) => {
          if (!a.paidAt && !b.paidAt) return 0;
          if (!a.paidAt) return 1;
          if (!b.paidAt) return -1;
          return a.paidAt.getTime() - b.paidAt.getTime();
        },
      },
      {
        title: t('payments.table.createdAt'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 160,
        render: (date: Date) => formatDateTime(date),
        sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      },
      {
        title: t('payments.table.actions'),
        key: 'actions',
        width: 200,
        fixed: 'right',
        render: (_, record) => {
          const isPending = record.status === PaymentStatus.PENDING;
          const canMarkAsPaid = isPending && onMarkAsPaid;

          return (
            <Space size="small">
              {onView && (
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onView(record)}
                >
                  {t('payments.actions.view')}
                </Button>
              )}
              {onEdit && (
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                >
                  {t('payments.actions.edit')}
                </Button>
              )}
              {canMarkAsPaid && (
                <Popconfirm
                  title={t('payments.actions.markAsPaidConfirm')}
                  description={t('payments.actions.markAsPaidDescription')}
                  onConfirm={() => onMarkAsPaid(record.id)}
                  okText={t('common.confirm.yes')}
                  cancelText={t('common.confirm.no')}
                >
                  <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                    {t('payments.actions.markAsPaid')}
                  </Button>
                </Popconfirm>
              )}
              {onDelete && (
                <Popconfirm
                  title={t('payments.delete')}
                  description={t('payments.deleteConfirm')}
                  onConfirm={() => onDelete(record.id)}
                  okText={t('common.confirm.yes')}
                  cancelText={t('common.confirm.no')}
                >
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                    {t('payments.actions.delete')}
                  </Button>
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ],
    [t, getStatusLabel, getMethodLabel, onView, onEdit, onDelete, onMarkAsPaid]
  );

  return (
    <DataTable<Payment>
      columns={columns}
      dataSource={payments}
      loading={loading}
      rowKey="id"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => t('payments.table.totalPayments', { total }),
      }}
      scroll={{ x: 1400 }}
    />
  );
};
