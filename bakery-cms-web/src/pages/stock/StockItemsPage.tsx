/**
 * Stock Items Page
 * Container page for stock item management
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockItemList } from '@/components/features/stock/StockItemList/StockItemList';
import { StockItemForm } from '@/components/features/stock/StockItemForm/StockItemForm';
import { useStockItems } from '@/hooks/useStockItems';
import {
  createStockItem,
  updateStockItem,
  deleteStockItem,
} from '@/services/stock.service';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/hooks/useNotification';
import type { StockItemFilters } from '@/types/models/stock.model';
import type { StockItemFormValues } from '@/components/features/stock/StockItemList/StockItemList.types';
import type { StockItem } from '@/types/models/stock.model';

export const StockItemsPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const { visible, open, close } = useModal();
  const { success, error: notifyError } = useNotification();

  // Filters state (immediate updates for UI)
  const [filters, setFilters] = useState<StockItemFilters>({});
  // Debounced filters state (delayed updates for API)
  const [debouncedFilters, setDebouncedFilters] = useState<StockItemFilters>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Debounce search input - wait 500ms after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Memoize debounced filters to prevent unnecessary re-renders and API calls
  const memoizedFilters = useMemo(
    () => debouncedFilters,
    [
      debouncedFilters.search,
      debouncedFilters.status,
      debouncedFilters.lowStockOnly,
      debouncedFilters.sortBy,
      debouncedFilters.sortOrder,
    ]
  );

  // Memoize pagination params
  const memoizedPagination = useMemo(
    () => ({
      page: pagination.current,
      limit: pagination.pageSize,
    }),
    [pagination.current, pagination.pageSize]
  );

  // Use the useStockItems hook with filters and pagination
  const { stockItems, loading, error, total, refetch } = useStockItems({
    filters: memoizedFilters,
    pagination: memoizedPagination,
    autoFetch: true,
  });

  // Update pagination total when the API total changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total,
    }));
  }, [total]);

  const handleFiltersChange = useCallback((newFilters: StockItemFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change (except for sorting)
    if (
      newFilters.search !== filters.search ||
      newFilters.status !== filters.status ||
      newFilters.lowStockOnly !== filters.lowStockOnly
    ) {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  }, [filters]);

  const handleTableChange = useCallback((pag: { current: number; pageSize: number }) => {
    setPagination((prev) => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize,
    }));
  }, []);

  const handleCreate = useCallback(
    async (values: StockItemFormValues) => {
      setFormLoading(true);
      try {
        const result = await createStockItem({
          name: values.name,
          description: values.description,
          unitOfMeasure: values.unitOfMeasure,
          currentQuantity: values.currentQuantity,
          reorderThreshold: values.reorderThreshold,
        });

        if (result.success) {
          success('Stock Item Created', 'Stock item has been created successfully');
          refetch();
          close();
          setSelectedStockItem(null);
        } else {
          throw new Error(result.error.message);
        }
      } catch (err) {
        notifyError('Operation Failed', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setFormLoading(false);
      }
    },
    [refetch, close, success, notifyError]
  );

  const handleUpdate = useCallback(
    async (id: string, values: StockItemFormValues) => {
      setFormLoading(true);
      try {
        const result = await updateStockItem(id, {
          name: values.name,
          description: values.description,
          unitOfMeasure: values.unitOfMeasure,
          reorderThreshold: values.reorderThreshold,
        });

        if (result.success) {
          success('Stock Item Updated', 'Stock item has been updated successfully');
          refetch();
          close();
          setSelectedStockItem(null);
        } else {
          throw new Error(result.error.message);
        }
      } catch (err) {
        notifyError('Operation Failed', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setFormLoading(false);
      }
    },
    [refetch, close, success, notifyError]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteStockItem(id);

      if (result.success) {
        refetch();
      } else {
        throw new Error(result.error.message);
      }
    },
    [refetch]
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/stock/items/${id}`);
    },
    [navigate]
  );

  const handleFormSubmit = useCallback(
    async (values: StockItemFormValues) => {
      if (selectedStockItem) {
        await handleUpdate(selectedStockItem.id, values);
      } else {
        await handleCreate(values);
      }
    },
    [selectedStockItem, handleCreate, handleUpdate]
  );

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <>
      <StockItemList
        stockItems={stockItems ? [...stockItems] : []}
        loading={loading}
        pagination={pagination}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onTableChange={handleTableChange}
        onCreateClick={open}
        onDelete={handleDelete}
        onView={handleView}
      />
      <StockItemForm
        visible={visible}
        stockItem={selectedStockItem}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          close();
          setSelectedStockItem(null);
        }}
        loading={formLoading}
      />
    </>
  );
};
