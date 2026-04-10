/**
 * PaymentDetailPage
 * Container page for payment detail with CRUD operations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { PaymentDetail } from '../../components/features/payments/PaymentDetail/PaymentDetail';
import { PaymentForm } from '../../components/features/payments/PaymentForm/PaymentForm';
import { LoadingSpinner, EmptyState } from '../../components/shared';
import { useNotification } from '../../hooks/useNotification';
import { useModal } from '../../hooks/useModal';
import { useCrudErrorNotification } from '../../hooks/useCrudErrorNotification';
import {
  getPaymentById,
  updatePayment,
  deletePayment,
  markPaymentAsPaid,
  regeneratePaymentVietQR,
} from '../../services/payment.service';
import { PaymentMethod } from '../../types/models/payment.model';
import type { Payment } from '../../types/models/payment.model';
import type { PaymentFormValues } from '../../components/features/payments/PaymentForm/PaymentForm.types';

export const PaymentDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const { visible, open, close } = useModal();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regeneratingVietQR, setRegeneratingVietQR] = useState(false);

  const fetchPayment = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const result = await getPaymentById(id);

    if (result.success) {
      setPayment(result.data);
    } else {
      showCrudError(result.error);
    }
    setLoading(false);
  }, [id, showCrudError]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleEdit = useCallback(() => {
    open();
  }, [open]);

  const handleFormSubmit = useCallback(
    async (values: PaymentFormValues) => {
      if (!id) return;

      setSubmitting(true);
      const result = await updatePayment(id, {
        amount: values.amount,
        method: values.method,
        status: values.status,
        transactionId: values.transactionId,
        notes: values.notes,
      });

      if (result.success) {
        setPayment(result.data);
        success(t('payments.notifications.updated', 'Payment Updated'), t('payments.notifications.updatedMessage', 'Payment has been updated successfully'));
        close();
      } else {
        showCrudError(result.error);
      }
      setSubmitting(false);
    },
    [close, id, showCrudError, success, t]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;

    const result = await deletePayment(id);

    if (result.success) {
      success(t('payments.notifications.deleted', 'Payment Deleted'), t('payments.notifications.deletedMessage', 'Payment has been deleted successfully'));
      navigate('/payments');
    } else {
      showCrudError(result.error);
    }
  }, [id, navigate, showCrudError, success, t]);

  const handleMarkAsPaid = useCallback(async () => {
    if (!id) return;

    const result = await markPaymentAsPaid(id);

    if (result.success) {
      await fetchPayment();
      success(t('payments.notifications.markedAsPaid', 'Payment Marked as Paid'), t('payments.notifications.markedAsPaidMessage', 'Payment status has been updated to paid'));
    } else {
      showCrudError(result.error);
    }
  }, [fetchPayment, id, showCrudError, success, t]);

  const handleRegenerateVietQR = useCallback(async () => {
    if (!payment || payment.method !== PaymentMethod.VIETQR) {
      return;
    }

    setRegeneratingVietQR(true);

    const result = await regeneratePaymentVietQR(payment.orderId);

    if (result.success) {
      await fetchPayment();
      success(
        t('payments.notifications.regenerateVietQRSuccess', 'VietQR Regenerated'),
        t(
          'payments.notifications.regenerateVietQRSuccessMessage',
          'Payment QR code has been regenerated successfully'
        )
      );
    } else {
      showCrudError(result.error);
    }

    setRegeneratingVietQR(false);
  }, [payment, fetchPayment, showCrudError, success, t]);

  const handleBack = useCallback(() => {
    navigate('/payments');
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!payment) {
    return <EmptyState description={t('payments.list.noPayments', 'Payment not found')} />;
  }

  const getFormInitialValues = (): PaymentFormValues => ({
    orderId: payment.orderId,
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    transactionId: payment.transactionId || undefined,
    notes: payment.notes || undefined,
  });

  return (
    <>
      <PaymentDetail
        payment={payment}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMarkAsPaid={handleMarkAsPaid}
        onRegenerateVietQR={handleRegenerateVietQR}
        regeneratingVietQR={regeneratingVietQR}
        onBack={handleBack}
      />

      <PaymentForm
        visible={visible}
        initialValues={getFormInitialValues()}
        onSubmit={handleFormSubmit}
        onCancel={close}
        loading={submitting}
      />
    </>
  );
};
