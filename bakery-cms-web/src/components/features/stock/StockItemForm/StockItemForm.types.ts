/**
 * StockItemForm component types
 */

import type { StockItem } from '../../../../types/models/stock.model';

export interface StockItemFormValues {
  name: string;
  description?: string;
  unitOfMeasure: string;
  currentQuantity?: number;
  reorderThreshold?: number;
}

export interface StockItemFormProps {
  visible: boolean;
  stockItem: StockItem | null;
  onSubmit: (values: StockItemFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
