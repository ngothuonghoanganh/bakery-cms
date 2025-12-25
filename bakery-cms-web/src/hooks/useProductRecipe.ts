/**
 * useProductRecipe custom hook
 * Manages product recipe data fetching and state
 */

import { useState, useEffect, useCallback } from 'react';
import { stockService } from '@/services/stock.service';
import type { ProductRecipe, ProductCost } from '@/types/models/stock.model';
import type { AppError } from '@/types/common/error.types';

interface UseProductRecipeOptions {
  productId: string;
  autoFetch?: boolean;
}

interface UseProductRecipeReturn {
  recipe: ProductRecipe | null;
  cost: ProductCost | null;
  loading: boolean;
  error: AppError | null;
  refetchRecipe: () => Promise<void>;
  refetchCost: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

export const useProductRecipe = (
  options: UseProductRecipeOptions
): UseProductRecipeReturn => {
  const { productId, autoFetch = true } = options;

  const [recipe, setRecipe] = useState<ProductRecipe | null>(null);
  const [cost, setCost] = useState<ProductCost | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<AppError | null>(null);

  const fetchRecipe = useCallback(async (): Promise<void> => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    const result = await stockService.getProductRecipe(productId);

    if (result.success) {
      setRecipe(result.data);
      setError(null);
    } else {
      setRecipe(null);
      setError(result.error);
    }

    setLoading(false);
  }, [productId]);

  const fetchCost = useCallback(async (): Promise<void> => {
    if (!productId) return;

    const result = await stockService.getProductCost(productId);

    if (result.success) {
      setCost(result.data);
    } else {
      setCost(null);
      // Don't set error for cost - it's supplementary data
    }
  }, [productId]);

  const fetchAll = useCallback(async (): Promise<void> => {
    await Promise.all([fetchRecipe(), fetchCost()]);
  }, [fetchRecipe, fetchCost]);

  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [autoFetch, fetchAll]);

  return {
    recipe,
    cost,
    loading,
    error,
    refetchRecipe: fetchRecipe,
    refetchCost: fetchCost,
    refetchAll: fetchAll,
  };
};
