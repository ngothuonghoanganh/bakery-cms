/**
 * Stock domain models
 * Represents stock data in the frontend domain layer
 */

import { StockItemStatus, MovementType } from '@bakery-cms/common';

// Re-export for backward compatibility
export { StockItemStatus, MovementType };
export type {
  StockItemStatus as StockItemStatusType,
  MovementType as MovementTypeType,
} from '@bakery-cms/common';

// Stock Item
export type StockItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly unitOfMeasure: string;
  readonly currentQuantity: number;
  readonly reorderThreshold: number | null;
  readonly status: StockItemStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly brands?: readonly StockItemBrand[];
};

export type StockItemBrand = {
  readonly id: string;
  readonly stockItemId: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly isPreferred: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type StockItemFilters = {
  readonly status?: StockItemStatus;
  readonly search?: string;
  readonly lowStockOnly?: boolean;
};

export type PaginationParams = {
  readonly page?: number;
  readonly limit?: number;
};

export type PaginatedStockItems = {
  readonly stockItems: readonly StockItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

// Brand
export type Brand = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type BrandFilters = {
  readonly search?: string;
  readonly isActive?: boolean;
};

export type PaginatedBrands = {
  readonly brands: readonly Brand[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

// Stock Movement
export type StockMovement = {
  readonly id: string;
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly type: MovementType;
  readonly quantity: number;
  readonly previousQuantity: number;
  readonly newQuantity: number;
  readonly reason: string | null;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly userId: string;
  readonly userName: string;
  readonly createdAt: Date;
};

export type StockMovementFilters = {
  readonly stockItemId?: string;
  readonly type?: MovementType;
  readonly userId?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
};

export type PaginatedStockMovements = {
  readonly stockMovements: readonly StockMovement[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

// Product Stock Item (Recipe/BOM)
export type ProductStockItem = {
  readonly id: string;
  readonly productId: string;
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly unitOfMeasure: string;
  readonly quantity: number;
  readonly preferredBrandId: string | null;
  readonly preferredBrandName: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProductRecipe = {
  readonly productId: string;
  readonly productName: string;
  readonly stockItems: readonly ProductStockItem[];
};

export type ProductCost = {
  readonly productId: string;
  readonly productName: string;
  readonly totalCost: number;
  readonly costBreakdown: readonly ProductCostBreakdownItem[];
};

export type ProductCostBreakdownItem = {
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly quantity: number;
  readonly unitOfMeasure: string;
  readonly brandId: string | null;
  readonly brandName: string | null;
  readonly unitPrice: number;
  readonly totalCost: number;
};
