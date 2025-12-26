/**
 * useStockItems custom hook
 * Manages stock items data fetching and state with filters, sorting, and pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { stockService } from '@/services/stock.service';
import type {
  StockItem,
  StockItemFilters,
  PaginationParams,
} from '@/types/models/stock.model';
import type { AppError } from '@/types/common/error.types';

interface UseStockItemsOptions {
  filters?: StockItemFilters;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseStockItemsReturn {
  stockItems: readonly StockItem[] | null;
  loading: boolean;
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
}

export const useStockItems = (options: UseStockItemsOptions = {}): UseStockItemsReturn => {
  const { filters, pagination, autoFetch = true } = options;

  const [stockItems, setStockItems] = useState<readonly StockItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<AppError | null>(null);

  // Use refs to store the latest filters and pagination without causing re-renders
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);

  // Update refs when props change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  const fetchStockItems = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await stockService.getAllStockItems({
      ...filtersRef.current,
      ...paginationRef.current,
    });

    if (result.success) {
      setStockItems(result.data.stockItems);
      setTotal(result.data.total);
      setError(null);
    } else {
      setStockItems(null);
      setTotal(0);
      setError(result.error);
    }

    setLoading(false);
  }, []);

  // Create a stable key from filters and pagination for dependency tracking
  const filtersKey = JSON.stringify(filters);
  const paginationKey = JSON.stringify(pagination);

  useEffect(() => {
    if (autoFetch) {
      fetchStockItems();
    }
  }, [autoFetch, fetchStockItems, filtersKey, paginationKey]);

  return {
    stockItems,
    loading,
    error,
    total,
    refetch: fetchStockItems,
  };
};
