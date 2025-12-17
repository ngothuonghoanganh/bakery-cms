/**
 * PaymentsPage
 * Main container page for payments list with filters and CRUD operations
 */

import React, { useState } from 'react';
import { PaymentList } from '../components/features/payments/PaymentList/PaymentList';
import { usePayments } from '../hooks/usePayments';
import { createPayment, updatePayment, deletePayment, markPaymentAsPaid } from '../services/payment.service';
import { useNotification } from '../hooks/useNotification';
import type { PaymentFormValues } from '../components/features/payments/PaymentForm/PaymentForm.types';
import type { PaymentFiltersValue } from '../components/features/payments/PaymentFilters/PaymentFilters.types';

export const PaymentsPage: React.FC = () => {
  const { error } = useNotification();
  const [filters, setFilters] = useState<PaymentFiltersValue>({});

  const { payments, loading, refetch } = usePayments({
    filters: {
      ...filters,
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    },
    autoFetch: true,
  });

  const handleCreate = async (values: PaymentFormValues) => {
    const result = await createPayment({
      orderId: values.orderId,
      amount: values.amount,
      method: values.method,
      notes: values.notes,
    });

    if (result.success) {
      await refetch();
    } else {
      error('Create Failed', result.error.message);
      throw new Error(result.error.message);
    }
  };

  const handleUpdate = async (id: string, values: PaymentFormValues) => {
    const result = await updatePayment(id, {
      amount: values.amount,
      method: values.method,
      status: values.status,
      transactionId: values.transactionId,
      notes: values.notes,
    });

    if (result.success) {
      await refetch();
    } else {
      error('Update Failed', result.error.message);
      throw new Error(result.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deletePayment(id);

    if (result.success) {
      await refetch();
    } else {
      error('Delete Failed', result.error.message);
      throw new Error(result.error.message);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const result = await markPaymentAsPaid(id);

    if (result.success) {
      await refetch();
    } else {
      error('Update Failed', result.error.message);
      throw new Error(result.error.message);
    }
  };

  return (
    <PaymentList
      payments={payments}
      loading={loading}
      filters={filters}
      onFiltersChange={setFilters}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onMarkAsPaid={handleMarkAsPaid}
    />
  );
};
