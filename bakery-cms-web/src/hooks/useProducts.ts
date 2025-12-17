/**
 * useProducts custom hook
 * Manages product data fetching and state
 */

import { useState, useEffect } from 'react';
import { productService } from '@/services';
import type { Product, ProductFilters } from '@/types/models/product.model';
import type { AppError } from '@/types/common/error.types';

export const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<readonly Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      setLoading(true);
      const result = await productService.getAll(filters);
      if (result.success) {
        setProducts(result.data.products);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [filters]);

  return { products, loading, error, refetch: () => setLoading(true) };
};
