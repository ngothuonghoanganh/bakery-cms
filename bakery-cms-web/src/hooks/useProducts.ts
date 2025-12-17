/**
 * useProducts custom hook
 * Manages product data fetching and state with filters, sorting, and pagination
 */

import { useState, useEffect, useCallback } from 'react';
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

  const fetchProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    const result = await productService.getAll({
      ...filters,
      ...pagination,
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
  }, [filters, pagination]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    products,
    loading,
    error,
    total,
    refetch: fetchProducts,
  };
};
