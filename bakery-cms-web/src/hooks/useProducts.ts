/**
 * useProducts custom hook
 * Manages product data fetching and state with filters, sorting, and pagination
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { productService } from '@/services';
import { createStableKey } from '@/utils/stable-key.utils';
import type { Product, ProductFilters, PaginationParams } from '@/types/models/product.model';
import type { AppError } from '@/types/common/error.types';

interface UseProductsOptions {
  filters?: ProductFilters;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseProductsReturn {
  products: readonly Product[] | null;
  loading: boolean;
  refreshing: boolean;
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const { filters, pagination, autoFetch = true } = options;

  const [products, setProducts] = useState<readonly Product[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Use refs to store the latest filters and pagination without causing re-renders
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  const requestIdRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const autoFetchKeyRef = useRef<string | null>(null);

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

  const fetchProducts = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (hasLoadedOnceRef.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    const result = await productService.getAll({
      ...filtersRef.current,
      ...paginationRef.current,
    });

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (result.success) {
      setProducts(result.data.products);
      setTotal(result.data.total);
      setError(null);
      hasLoadedOnceRef.current = true;
    } else {
      setError(result.error);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    if (autoFetchKeyRef.current === requestKey && hasLoadedOnceRef.current) {
      return;
    }

    autoFetchKeyRef.current = requestKey;
    void fetchProducts();
  }, [autoFetch, fetchProducts, requestKey]);

  return {
    products,
    loading,
    refreshing,
    error,
    total,
    refetch: fetchProducts,
  };
};
