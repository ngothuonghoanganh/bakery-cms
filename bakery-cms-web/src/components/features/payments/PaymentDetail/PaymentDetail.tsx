/**
 * PaymentDetail Component
 * Displays detailed payment information with VietQR code
 */

import React from 'react';
import { Card, Descriptions, Button, Space, Tag, Image, Alert } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { PaymentMethod, PaymentStatus } from '../../../../types/models/payment.model';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import type { PaymentDetailProps } from './PaymentDetail.types';

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

export const PaymentDetail: React.FC<PaymentDetailProps> = ({
  payment,
  loading = false,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onBack,
}) => {
  const isPending = payment.status === PaymentStatus.PENDING;
  const hasVietQR = payment.method === PaymentMethod.VIETQR && payment.vietqrData;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Back to Payments
        </Button>
      </div>

      <Card
        loading={loading}
        title={`Payment #${payment.id.substring(0, 8)}`}
        extra={
          <Space>
            {isPending && onMarkAsPaid && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={onMarkAsPaid}>
                Mark as Paid
              </Button>
            )}
            {onEdit && (
              <Button icon={<EditOutlined />} onClick={onEdit}>
                Edit
              </Button>
            )}
            {onDelete && (
              <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                Delete
              </Button>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Payment ID" span={2}>
            {payment.id}
          </Descriptions.Item>

          <Descriptions.Item label="Order ID" span={2}>
            {payment.orderId}
          </Descriptions.Item>

          <Descriptions.Item label="Amount" span={1}>
            <strong style={{ fontSize: '16px' }}>{formatCurrency(payment.amount)}</strong>
          </Descriptions.Item>

          <Descriptions.Item label="Status" span={1}>
            <Tag color={getStatusColor(payment.status)}>{getStatusLabel(payment.status)}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Payment Method" span={1}>
            {getMethodLabel(payment.method)}
          </Descriptions.Item>

          <Descriptions.Item label="Transaction ID" span={1}>
            {payment.transactionId || '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Paid At" span={1}>
            {payment.paidAt ? formatDateTime(payment.paidAt) : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="Created At" span={1}>
            {formatDateTime(payment.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label="Updated At" span={2}>
            {formatDateTime(payment.updatedAt)}
          </Descriptions.Item>

          {payment.notes && (
            <Descriptions.Item label="Notes" span={2}>
              {payment.notes}
            </Descriptions.Item>
          )}
        </Descriptions>

        {hasVietQR && (
          <div style={{ marginTop: 24 }}>
            <Card title="VietQR Code" type="inner">
              <Alert
                message="Scan QR code to pay"
                description="Use your banking app to scan this QR code and complete the payment."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Image
                  src={payment.vietqrData}
                  alt="VietQR Code"
                  width={300}
                  height={300}
                  style={{ border: '1px solid #d9d9d9', borderRadius: 4 }}
                />
              </div>
            </Card>
          </div>
        )}

        {isPending && !hasVietQR && (
          <Alert
            message="Payment Pending"
            description="This payment is pending. Mark it as paid once you receive the payment."
            type="warning"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}
      </Card>
    </div>
  );
};
