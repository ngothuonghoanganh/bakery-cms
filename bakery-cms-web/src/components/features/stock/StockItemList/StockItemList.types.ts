/**
 * StockItemList component types
 */

import type { StockItem, StockItemFilters } from '../../../../types/models/stock.model';

export interface StockItemFormValues {
  name: string;
  description?: string;
  unitOfMeasure: string;
  currentQuantity?: number;
  reorderThreshold?: number;
}

export interface StockItemListProps {
  stockItems: StockItem[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  filters: StockItemFilters;
  onFiltersChange: (filters: StockItemFilters) => void;
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
  onCreate: (values: StockItemFormValues) => Promise<void>;
  onUpdate: (id: string, values: StockItemFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}
