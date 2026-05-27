/**
 * useBrands custom hook
 * Manages brands data fetching and state with filters and pagination
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { stockService } from '@/services/stock.service';
import { createStableKey } from '@/utils/stable-key.utils';
import type { Brand, PaginationParams } from '@/types/models/stock.model';
import type { BrandFiltersRequest } from '@/types/api/stock.api';
import type { AppError } from '@/types/common/error.types';

interface UseBrandsOptions {
  filters?: BrandFiltersRequest;
  pagination?: PaginationParams;
  autoFetch?: boolean;
}

interface UseBrandsReturn {
  brands: readonly Brand[] | null;
  loading: boolean;
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
}

export const useBrands = (options: UseBrandsOptions = {}): UseBrandsReturn => {
  const { filters, pagination, autoFetch = true } = options;

  const [brands, setBrands] = useState<readonly Brand[] | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<AppError | null>(null);
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

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters, filtersKey]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination, paginationKey]);

  const fetchBrands = useCallback(async (): Promise<void> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setError(null);

    const result = await stockService.getAllBrands({
      ...filtersRef.current,
      ...paginationRef.current,
    });

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (result.success) {
      setBrands(result.data.brands);
      setTotal(result.data.total);
      setError(null);
      hasLoadedOnceRef.current = true;
    } else {
      setBrands(null);
      setTotal(0);
      setError(result.error);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!autoFetch) {
      return;
    }

    if (autoFetchKeyRef.current === requestKey && hasLoadedOnceRef.current) {
      return;
    }

    autoFetchKeyRef.current = requestKey;
    void fetchBrands();
  }, [autoFetch, fetchBrands, requestKey]);

  return {
    brands,
    loading,
    error,
    total,
    refetch: fetchBrands,
  };
};
