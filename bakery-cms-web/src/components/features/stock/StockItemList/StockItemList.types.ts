/**
 * StockItemList component types
 */

import type {
  StockItem,
  StockItemFilters,
  StockUnitTypeType as StockUnitType,
} from '../../../../types/models/stock.model';

export interface StockItemFormValues {
  name: string;
  description?: string;
  unitType: StockUnitType;
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
  onTableChange: (pagination: { current: number; pageSize: number }, filters: unknown, sorter: unknown) => void;
  onCreateClick: () => void;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}
