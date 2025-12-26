/**
 * useOrders custom hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { orderService } from '@/services';
import type { Order, OrderFilters } from '@/types/models/order.model';
import type { OrderFiltersRequest } from '@/types/api/order.api';
import type { AppError } from '@/types/common/error.types';

const mapFiltersToRequest = (filters?: OrderFilters): OrderFiltersRequest | undefined => {
  if (!filters) return undefined;
  return {
    ...filters,
    dateFrom: filters.dateFrom?.toISOString(),
    dateTo: filters.dateTo?.toISOString(),
  };
};

export type UseOrdersOptions = {
  filters?: OrderFilters;
  autoFetch?: boolean;
};

export type UseOrdersReturn = {
  orders: Order[];
  loading: boolean;
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
};

export const useOrders = (options: UseOrdersOptions = {}): UseOrdersReturn => {
  const { filters, autoFetch = true } = options;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const [total, setTotal] = useState(0);

  // Use ref to store the latest filters without causing re-renders
  const filtersRef = useRef(filters);

  // Update ref when props change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchOrders = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await orderService.getAll(mapFiltersToRequest(filtersRef.current));

    if (result.success) {
      setOrders([...result.data.orders]);
      setTotal(result.data.total);
    } else {
      setError(result.error);
      setOrders([]);
      setTotal(0);
    }

    setLoading(false);
  }, []);

  // Create a stable key from filters for dependency tracking
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    if (autoFetch) {
      fetchOrders();
    }
  }, [autoFetch, fetchOrders, filtersKey]);

  return {
    orders,
    loading,
    error,
    total,
    refetch: fetchOrders,
  };
};
