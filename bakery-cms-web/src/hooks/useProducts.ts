/**
 * useProducts custom hook
 * Manages product data fetching and state with filters, sorting, and pagination
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { productService } from '@/services';
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
  error: AppError | null;
  total: number;
  refetch: () => Promise<void>;
}

export const useProducts = (options: UseProductsOptions = {}): UseProductsReturn => {
  const { filters, pagination, autoFetch = true } = options;

  const [products, setProducts] = useState<readonly Product[] | null>(null);
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

  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    const result = await productService.getAll({
      ...filtersRef.current,
      ...paginationRef.current,
    });

    if (result.success) {
      setProducts(result.data.products);
      setTotal(result.data.total);
      setError(null);
    } else {
      setProducts(null);
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
      fetchProducts();
    }
  }, [autoFetch, fetchProducts, filtersKey, paginationKey]);

  return {
    products,
    loading,
    error,
    total,
    refetch: fetchProducts,
  };
};
