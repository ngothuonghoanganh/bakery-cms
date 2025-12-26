/**
 * PaymentsPage
 * Main container page for payments list with filters and CRUD operations
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PaymentList } from '../components/features/payments/PaymentList/PaymentList';
import { usePayments } from '../hooks/usePayments';
import {
  createPayment,
  updatePayment,
  deletePayment,
  markPaymentAsPaid,
} from '../services/payment.service';
import { useNotification } from '../hooks/useNotification';
import type { PaymentFormValues } from '../components/features/payments/PaymentForm/PaymentForm.types';
import type { PaymentFiltersValue } from '../components/features/payments/PaymentFilters/PaymentFilters.types';

export const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { error } = useNotification();
  // Filters state (immediate updates for UI)
  const [filters, setFilters] = useState<PaymentFiltersValue>({});
  // Debounced filters state (delayed updates for API)
  const [debouncedFilters, setDebouncedFilters] = useState<PaymentFiltersValue>({});

  // Debounce search input - wait 2s after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Memoize debounced filters to prevent unnecessary re-renders and API calls
  const memoizedFilters = useMemo(
    () => ({
      ...debouncedFilters,
      dateFrom: debouncedFilters.dateFrom ? new Date(debouncedFilters.dateFrom) : undefined,
      dateTo: debouncedFilters.dateTo ? new Date(debouncedFilters.dateTo) : undefined,
    }),
    [
      debouncedFilters.status,
      debouncedFilters.method,
      debouncedFilters.search,
      debouncedFilters.dateFrom,
      debouncedFilters.dateTo,
    ]
  );

  const { payments, loading, refetch } = usePayments({
    filters: memoizedFilters,
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
      error(t('payments.notifications.operationFailed', 'Create Failed'), result.error.message);
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
      error(t('payments.notifications.updateFailed', 'Update Failed'), result.error.message);
      throw new Error(result.error.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deletePayment(id);

    if (result.success) {
      await refetch();
    } else {
      error(t('payments.notifications.deleteFailed', 'Delete Failed'), result.error.message);
      throw new Error(result.error.message);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const result = await markPaymentAsPaid(id);

    if (result.success) {
      await refetch();
    } else {
      error(t('payments.notifications.updateFailed', 'Update Failed'), result.error.message);
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
