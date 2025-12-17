/**
 * PaymentDetailPage
 * Container page for payment detail with CRUD operations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
import { PaymentDetail } from '../../components/features/payments/PaymentDetail/PaymentDetail';
import { PaymentForm } from '../../components/features/payments/PaymentForm/PaymentForm';
import { LoadingSpinner, EmptyState } from '../../components/shared';
import { useNotification } from '../../hooks/useNotification';
import { useModal } from '../../hooks/useModal';
import {
  getPaymentById,
  updatePayment,
  deletePayment,
  markPaymentAsPaid,
} from '../../services/payment.service';
import type { Payment } from '../../types/models/payment.model';
import type { PaymentFormValues } from '../../components/features/payments/PaymentForm/PaymentForm.types';

export const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const { visible, open, close } = useModal();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchPayment = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const result = await getPaymentById(id);

    if (result.success) {
      setPayment(result.data);
    } else {
      error('Failed to Load', result.error.message);
    }
    setLoading(false);
  }, [id, error]);

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
        success('Payment Updated', 'Payment has been updated successfully');
        close();
      } else {
        error('Update Failed', result.error.message);
      }
      setSubmitting(false);
    },
    [id, success, error, close]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;

    const result = await deletePayment(id);

    if (result.success) {
      success('Payment Deleted', 'Payment has been deleted successfully');
      navigate('/payments');
    } else {
      error('Delete Failed', result.error.message);
    }
  }, [id, success, error, navigate]);

  const handleMarkAsPaid = useCallback(async () => {
    if (!id) return;

    const result = await markPaymentAsPaid(id);

    if (result.success) {
      setPayment(result.data);
      success('Payment Marked as Paid', 'Payment status has been updated to paid');
    } else {
      error('Update Failed', result.error.message);
    }
  }, [id, success, error]);

  const handleBack = useCallback(() => {
    navigate('/payments');
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!payment) {
    return (
      <EmptyState
        description="Payment not found"
      />
    );
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
      <Popconfirm
        title="Delete Payment"
        description="Are you sure you want to delete this payment?"
        onConfirm={handleDelete}
        okText="Yes"
        cancelText="No"
      >
        <PaymentDetail
          payment={payment}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMarkAsPaid={handleMarkAsPaid}
          onBack={handleBack}
        />
      </Popconfirm>

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
