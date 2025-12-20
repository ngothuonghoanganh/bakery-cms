/**
 * PaymentTable Component
 * Displays payments in a table with sorting, actions, and formatting
 */

import React from 'react';
import { Space, Button, Tag, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
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

const getStatusLabel = (status: PaymentStatus): string => {
  const labelMap: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.PAID]: 'Paid',
    [PaymentStatus.FAILED]: 'Failed',
    [PaymentStatus.CANCELLED]: 'Cancelled',
  };
  return labelMap[status] || status;
};

const getMethodLabel = (method: PaymentMethod): string => {
  const labelMap: Record<PaymentMethod, string> = {
    [PaymentMethod.CASH]: 'Cash',
    [PaymentMethod.VIETQR]: 'VietQR',
    [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  };
  return labelMap[method] || method;
};

export const PaymentTable: React.FC<PaymentTableProps> = ({
  payments,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onMarkAsPaid,
}) => {
  const columns: ColumnsType<Payment> = [
    {
      title: 'Payment ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Order ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right',
      render: (amount: number) => formatCurrency(amount),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      width: 130,
      render: (method: PaymentMethod) => getMethodLabel(method),
      filters: [
        { text: 'Cash', value: PaymentMethod.CASH },
        { text: 'VietQR', value: PaymentMethod.VIETQR },
        { text: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER },
      ],
      onFilter: (value, record) => record.method === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: PaymentStatus) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
      filters: [
        { text: 'Pending', value: PaymentStatus.PENDING },
        { text: 'Paid', value: PaymentStatus.PAID },
        { text: 'Failed', value: PaymentStatus.FAILED },
        { text: 'Cancelled', value: PaymentStatus.CANCELLED },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 150,
      ellipsis: true,
      render: (transactionId: string | null) => transactionId || '-',
    },
    {
      title: 'Paid At',
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
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: Date) => formatDateTime(date),
      sorter: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    },
    {
      title: 'Actions',
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
                View
              </Button>
            )}
            {onEdit && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              >
                Edit
              </Button>
            )}
            {canMarkAsPaid && (
              <Popconfirm
                title="Mark as Paid"
                description="Are you sure you want to mark this payment as paid?"
                onConfirm={() => onMarkAsPaid(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />}>
                  Mark as Paid
                </Button>
              </Popconfirm>
            )}
            {onDelete && (
              <Popconfirm
                title="Delete Payment"
                description="Are you sure you want to delete this payment?"
                onConfirm={() => onDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <DataTable<Payment>
      columns={columns}
      dataSource={payments}
      loading={loading}
      rowKey="id"
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} payments`,
      }}
      scroll={{ x: 1400 }}
    />
  );
};
