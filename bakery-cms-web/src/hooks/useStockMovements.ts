/**
 * useStockMovements hook
 * Custom hook for managing stock movements with caching and loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { stockService } from '@/services/stock.service';
import type { StockMovement } from '@/types/models/stock.model';
import type { StockMovementFiltersRequest } from '@/types/api/stock.api';
import { message } from 'antd';

/**
 * Hook return type
 */
export interface UseStockMovementsReturn {
  stockMovements: StockMovement[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
  fetchStockMovements: (filters?: StockMovementFiltersRequest) => Promise<void>;
  getStockMovementById: (id: string) => Promise<StockMovement | null>;
}

/**
 * Custom hook for stock movements management
 */
export const useStockMovements = (initialFilters?: StockMovementFiltersRequest): UseStockMovementsReturn => {
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [pagination, setPagination] = useState({
    current: initialFilters?.page || 1,
    pageSize: initialFilters?.limit || 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to store the latest filters without causing re-renders
  const filtersRef = useRef(initialFilters);

  // Update ref when props change
  useEffect(() => {
    filtersRef.current = initialFilters;
  }, [initialFilters]);

  /**
   * Fetch stock movements with filters
   */
  const fetchStockMovements = useCallback(async (filters?: StockMovementFiltersRequest) => {
    setLoading(true);
    setError(null);

    // Use provided filters or fall back to ref
    const filtersToUse = filters ?? filtersRef.current;
    const result = await stockService.getStockMovements(filtersToUse);

    if (result.success) {
      const data = result.data;
      setStockMovements([...data.stockMovements]);
      setPagination({
        current: data.page,
        pageSize: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } else {
      const errorMessage = result.error.message || 'Failed to fetch stock movements';
      setError(errorMessage);
      message.error(errorMessage);
    }

    setLoading(false);
  }, []);

  /**
   * Get stock movement by ID
   */
  const getStockMovementById = useCallback(async (id: string): Promise<StockMovement | null> => {
    setLoading(true);
    setError(null);

    const result = await stockService.getStockMovementById(id);

    setLoading(false);

    if (result.success) {
      return result.data;
    } else {
      const errorMessage = result.error.message || 'Failed to fetch stock movement';
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    }
  }, []);

  // Create a stable key from initialFilters for dependency tracking
  const filtersKey = JSON.stringify(initialFilters);

  // Fetch on mount with initial filters
  useEffect(() => {
    fetchStockMovements();
  }, [fetchStockMovements, filtersKey]);

  return {
    stockMovements,
    pagination,
    loading,
    error,
    fetchStockMovements,
    getStockMovementById,
  };
};
