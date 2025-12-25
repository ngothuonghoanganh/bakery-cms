/**
 * useBrands custom hook
 * Manages brands data fetching and state with filters and pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { stockService } from '@/services/stock.service';
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

  // Use refs to avoid infinite loops with object dependencies
  const filtersRef = useRef(filters);
  const paginationRef = useRef(pagination);
  filtersRef.current = filters;
  paginationRef.current = pagination;

  const fetchBrands = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await stockService.getAllBrands({
      ...filtersRef.current,
      ...paginationRef.current,
    });

    if (result.success) {
      setBrands(result.data.brands);
      setTotal(result.data.total);
      setError(null);
    } else {
      setBrands(null);
      setTotal(0);
      setError(result.error);
    }

    setLoading(false);
  }, []);

  // Serialize dependencies for comparison
  const filterKey = JSON.stringify(filters);
  const paginationKey = JSON.stringify(pagination);

  useEffect(() => {
    if (autoFetch) {
      fetchBrands();
    }
  }, [autoFetch, fetchBrands, filterKey, paginationKey]);

  return {
    brands,
    loading,
    error,
    total,
    refetch: fetchBrands,
  };
};
