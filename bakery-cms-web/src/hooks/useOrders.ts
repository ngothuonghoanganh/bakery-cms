/**
 * useOrders custom hook
 */

import { useState, useEffect } from 'react';
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

export const useOrders = (filters?: OrderFilters) => {
  const [orders, setOrders] = useState<readonly Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchOrders = async (): Promise<void> => {
      setLoading(true);
      const result = await orderService.getAll(mapFiltersToRequest(filters));
      if (result.success) {
        setOrders(result.data.orders);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [filters]);

  return { orders, loading, error };
};
