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
import { useTranslation } from 'react-i18next';
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

export const PaymentDetail: React.FC<PaymentDetailProps> = ({
  payment,
  loading = false,
  onEdit,
  onDelete,
  onMarkAsPaid,
  onBack,
}) => {
  const { t } = useTranslation();
  const isPending = payment?.status === PaymentStatus.PENDING;
  const hasVietQR = payment?.method === PaymentMethod.VIETQR && payment?.vietqrData;

  if (!payment?.id) {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            {t('payments.detail.backToPayments')}
          </Button>
        </div>
        <Card loading={loading} />
      </div>
    );
  }

  const getStatusLabel = (status: PaymentStatus): string => {
    const labelMap: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: t('payments.status.pending'),
      [PaymentStatus.PAID]: t('payments.status.paid'),
      [PaymentStatus.FAILED]: t('payments.status.failed'),
      [PaymentStatus.CANCELLED]: t('payments.status.cancelled'),
    };
    return labelMap[status] || status;
  };

  const getMethodLabel = (method: PaymentMethod): string => {
    const labelMap: Record<PaymentMethod, string> = {
      [PaymentMethod.CASH]: t('payments.method.cash'),
      [PaymentMethod.VIETQR]: t('payments.method.vietqr'),
      [PaymentMethod.BANK_TRANSFER]: t('payments.method.bankTransfer'),
    };
    return labelMap[method] || method;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('payments.detail.backToPayments')}
        </Button>
      </div>

      <Card
        loading={loading}
        title={`${t('payments.detail.title')} #${payment.id.substring(0, 8)}`}
        extra={
          <Space>
            {isPending && onMarkAsPaid && (
              <Button type="primary" icon={<CheckCircleOutlined />} onClick={onMarkAsPaid}>
                {t('payments.actions.markAsPaid')}
              </Button>
            )}
            {onEdit && (
              <Button icon={<EditOutlined />} onClick={onEdit}>
                {t('payments.actions.edit')}
              </Button>
            )}
            {onDelete && (
              <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
                {t('payments.actions.delete')}
              </Button>
            )}
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('payments.detail.paymentId')} span={2}>
            {payment.id}
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.orderId')} span={2}>
            {payment.orderId}
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.amount')} span={1}>
            <strong style={{ fontSize: '16px' }}>{formatCurrency(payment.amount)}</strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.status')} span={1}>
            <Tag color={getStatusColor(payment.status)}>{getStatusLabel(payment.status)}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.method')} span={1}>
            {getMethodLabel(payment.method)}
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.transactionId')} span={1}>
            {payment.transactionId || '-'}
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.paidAt')} span={1}>
            {payment.paidAt ? formatDateTime(payment.paidAt) : '-'}
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.createdAt')} span={1}>
            {formatDateTime(payment.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label={t('payments.detail.updatedAt')} span={2}>
            {formatDateTime(payment.updatedAt)}
          </Descriptions.Item>

          {payment.notes && (
            <Descriptions.Item label={t('payments.detail.notes')} span={2}>
              {payment.notes}
            </Descriptions.Item>
          )}
        </Descriptions>

        {hasVietQR && (
          <div style={{ marginTop: 24 }}>
            <Card title={t('payments.detail.vietqrTitle')} type="inner">
              <Alert
                message={t('payments.detail.vietqrScanMessage')}
                description={t('payments.detail.vietqrScanDescription')}
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
            message={t('payments.detail.pendingMessage')}
            description={t('payments.detail.pendingDescription')}
            type="warning"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}
      </Card>
    </div>
  );
};
