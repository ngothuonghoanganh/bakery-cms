/**
 * usePayments custom hook
 * Manages payment data fetching with filters and pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { paymentService } from '@/services';
import type { Payment } from '@/types/models/payment.model';
import type { PaymentFiltersValue } from '@/components/features/payments/PaymentFilters/PaymentFilters.types';
import type { PaymentFiltersRequest } from '@/types/api/payment.api';
import type { AppError } from '@/types/common/error.types';

const mapFiltersToRequest = (filters?: PaymentFiltersValue): PaymentFiltersRequest | undefined => {
  if (!filters) return undefined;
  const startDate = filters.dateFrom?.toISOString();
  const endDate = filters.dateTo?.toISOString();

  return {
    ...filters,
    dateFrom: startDate,
    dateTo: endDate,
    startDate,
    endDate,
  };
};

export type UsePaymentsOptions = {
  filters?: PaymentFiltersValue;
  autoFetch?: boolean;
};

export type UsePaymentsReturn = {
  payments: Payment[];
  loading: boolean;
  refreshing: boolean;
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
};

export const usePayments = (options: UsePaymentsOptions = {}): UsePaymentsReturn => {
  const { filters, autoFetch = true } = options;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [total, setTotal] = useState(0);

  // Use ref to store the latest filters without causing re-renders
  const filtersRef = useRef(filters);
  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  // Update ref when props change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchPayments = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (hasLoadedOnceRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const result = await paymentService.getAll(mapFiltersToRequest(filtersRef.current));

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (result.success) {
      setPayments([...result.data.payments]);
      setTotal(result.data.total);
      hasLoadedOnceRef.current = true;
    } else {
      setError(result.error);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  // Create a stable key from filters for dependency tracking
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (autoFetch) {
      fetchPayments();
    }
  }, [autoFetch, fetchPayments, filtersKey]);

  return {
    payments,
    loading,
    refreshing,
    error,
    total,
    refetch: fetchPayments,
  };
};
