/**
 * useStockItems custom hook
 * Manages stock items data fetching and state with filters, sorting, and pagination
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { stockService } from '@/services/stock.service';
import { createStableKey } from '@/utils/stable-key.utils';
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
  refreshing: boolean;
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
}

export const useStockItems = (options: UseStockItemsOptions = {}): UseStockItemsReturn => {
  const { filters, pagination, autoFetch = true } = options;

  const [stockItems, setStockItems] = useState<readonly StockItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Use refs to store the latest filters and pagination without causing re-renders
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const requestIdRef = useRef(0);
  const requestKeyRef = useRef<string>('');
  const stockItemsRef = useRef<readonly StockItem[] | null>(null);
  const autoFetchKeyRef = useRef<string | null>(null);
  const successfulRequestKeysRef = useRef<Set<string>>(new Set());
  const failedRequestKeysRef = useRef<Set<string>>(new Set());
  const inFlightRequestRef = useRef<Promise<void> | null>(null);
  const inFlightRequestKeyRef = useRef<string | null>(null);

  const filtersKey = useMemo(() => createStableKey(filters), [filters]);
  const paginationKey = useMemo(() => createStableKey(pagination), [pagination]);
  const requestKey = useMemo(
    () => `${filtersKey}:${paginationKey}`,
    [filtersKey, paginationKey]
  );

  // Update refs when props change
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters, filtersKey]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination, paginationKey]);

  useEffect(() => {
    requestKeyRef.current = requestKey;
  }, [requestKey]);

  useEffect(() => {
    stockItemsRef.current = stockItems;
  }, [stockItems]);

  const fetchStockItems = useCallback(async (): Promise<void> => {
    const currentRequestKey = requestKeyRef.current;
    if (
      inFlightRequestRef.current &&
      inFlightRequestKeyRef.current === currentRequestKey
    ) {
      return inFlightRequestRef.current;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const hasLoadedSuccessForKey =
      successfulRequestKeysRef.current.has(currentRequestKey);

    if (hasLoadedSuccessForKey && stockItemsRef.current !== null) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const request = (async (): Promise<void> => {
      const result = await stockService.getAllStockItems({
        ...filtersRef.current,
        ...paginationRef.current,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (result.success) {
        setStockItems(result.data.stockItems);
        setTotal(result.data.total);
        setError(null);
        successfulRequestKeysRef.current.add(currentRequestKey);
        failedRequestKeysRef.current.delete(currentRequestKey);
        return;
      }

      setError(result.error);
      failedRequestKeysRef.current.add(currentRequestKey);
    })().finally(() => {
      if (inFlightRequestKeyRef.current === currentRequestKey) {
        inFlightRequestRef.current = null;
        inFlightRequestKeyRef.current = null;
      }

      setLoading(false);
      setRefreshing(false);
    });

    inFlightRequestRef.current = request;
    inFlightRequestKeyRef.current = currentRequestKey;
    return request;
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    const hasLoadedSuccessForKey =
      successfulRequestKeysRef.current.has(requestKey);
    const hasData = stockItems !== null;
    const hasFailedForKey = failedRequestKeysRef.current.has(requestKey);

    if (
      autoFetchKeyRef.current === requestKey &&
      hasLoadedSuccessForKey &&
      hasData &&
      !hasFailedForKey
    ) {
      return;
    }

    autoFetchKeyRef.current = requestKey;
    void fetchStockItems();
  }, [autoFetch, fetchStockItems, requestKey, stockItems]);

  return {
    stockItems,
    loading,
    refreshing,
    error,
    total,
    refetch: fetchStockItems,
  };
};
