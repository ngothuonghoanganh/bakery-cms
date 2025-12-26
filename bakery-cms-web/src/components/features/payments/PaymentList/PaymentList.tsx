/**
 * PaymentList Component
 * Orchestrates payment listing with filters, table, and CRUD operations
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared';
import { PaymentTable } from '../PaymentTable/PaymentTable';
import { PaymentForm } from '../PaymentForm/PaymentForm';
import { PaymentFilters } from '../PaymentFilters/PaymentFilters';
import { useModal } from '../../../../hooks/useModal';
import { useNotification } from '../../../../hooks/useNotification';
import type { Payment } from '../../../../types/models/payment.model';
import type { PaymentFormValues } from '../PaymentForm/PaymentForm.types';
import type { PaymentFiltersValue } from '../PaymentFilters/PaymentFilters.types';

export type PaymentListProps = {
  readonly payments: readonly Payment[];
  readonly loading?: boolean;
  readonly filters?: PaymentFiltersValue;
  readonly onFiltersChange?: (filters: PaymentFiltersValue) => void;
  readonly onCreate?: (values: PaymentFormValues) => Promise<void>;
  readonly onUpdate?: (id: string, values: PaymentFormValues) => Promise<void>;
  readonly onDelete?: (id: string) => Promise<void>;
  readonly onMarkAsPaid?: (id: string) => Promise<void>;
};

export const PaymentList: React.FC<PaymentListProps> = ({
  payments,
  loading = false,
  filters,
  onFiltersChange,
  onCreate,
  onUpdate,
  onDelete,
  onMarkAsPaid,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { visible, open, close } = useModal();
  const { success, error } = useNotification();

  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = () => {
    setSelectedPayment(null);
    open();
  };

  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    open();
  };

  const handleView = (payment: Payment) => {
    navigate(`/payments/${payment.id}`);
  };

  const handleFormSubmit = async (values: PaymentFormValues) => {
    setSubmitting(true);
    try {
      if (selectedPayment && onUpdate) {
        await onUpdate(selectedPayment.id, values);
        success(t('payments.notifications.updated', 'Payment Updated'), t('payments.notifications.updatedMessage', 'Payment has been updated successfully'));
      } else if (onCreate) {
        await onCreate(values);
        success(t('payments.notifications.created', 'Payment Created'), t('payments.notifications.createdMessage', 'Payment has been created successfully'));
      }
      close();
      setSelectedPayment(null);
    } catch (err) {
      error(t('payments.notifications.operationFailed', 'Operation Failed'), err instanceof Error ? err.message : t('common.status.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;

    try {
      await onDelete(id);
      success(t('payments.notifications.deleted', 'Payment Deleted'), t('payments.notifications.deletedMessage', 'Payment has been deleted successfully'));
    } catch (err) {
      error(t('payments.notifications.deleteFailed', 'Delete Failed'), err instanceof Error ? err.message : t('payments.notifications.deleteError', 'Failed to delete payment'));
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!onMarkAsPaid) return;

    try {
      await onMarkAsPaid(id);
      success(t('payments.notifications.markedAsPaid', 'Payment Marked as Paid'), t('payments.notifications.markedAsPaidMessage', 'Payment status has been updated to paid'));
    } catch (err) {
      error(t('payments.notifications.updateFailed', 'Update Failed'), err instanceof Error ? err.message : t('payments.notifications.markAsPaidError', 'Failed to mark payment as paid'));
    }
  };

  const getFormInitialValues = (payment: Payment): PaymentFormValues => ({
    orderId: payment.orderId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    transactionId: payment.transactionId || undefined,
    notes: payment.notes || undefined,
  });

  return (
    <div>
      <PageHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('payments.add')}
          </Button>
        }
      />

      <PaymentFilters value={filters} onChange={onFiltersChange} />

      <PaymentTable
        payments={payments}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkAsPaid={handleMarkAsPaid}
      />

      <PaymentForm
        visible={visible}
        initialValues={selectedPayment ? getFormInitialValues(selectedPayment) : undefined}
        onSubmit={handleFormSubmit}
        onCancel={close}
        loading={submitting}
      />
    </div>
  );
};
