/**
 * StockItemForm component types
 */

import type { StockItem } from '../../../../types/models/stock.model';
import type { StockUnitTypeType as StockUnitType } from '../../../../types/models/stock.model';

export interface StockItemFormValues {
  name: string;
  description?: string;
  unitType: StockUnitType;
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
