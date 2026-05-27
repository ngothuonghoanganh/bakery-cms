/**
 * Stock domain models
 * Represents stock data in the frontend domain layer
 */

import {
  StockItemStatus,
  MovementType,
  StockUnitType,
  StockPurchaseUnit,
} from '@bakery-cms/common';
import type { FileModel } from './file.model';

// Re-export for backward compatibility
export { StockItemStatus, MovementType, StockUnitType, StockPurchaseUnit };
export type {
  StockItemStatus as StockItemStatusType,
  MovementType as MovementTypeType,
  StockUnitType as StockUnitTypeType,
  StockPurchaseUnit as StockPurchaseUnitType,
} from '@bakery-cms/common';

// Stock Item
export type StockItem = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly unitType: StockUnitType;
  readonly unitOfMeasure: string;
  readonly baseUnit: StockPurchaseUnit;
  readonly currentQuantity: number;
  readonly reorderThreshold: number | null;
  readonly status: StockItemStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly brands?: readonly StockItemBrand[];
  readonly priceSummary?: StockItemPriceSummary;
  readonly latestReceivingLot?: StockReceivingLot | null;
};

export type StockItemPriceSummary = {
  readonly preferredBrandId: string | null;
  readonly preferredBrandName: string | null;
  readonly latestPriceBrandId: string | null;
  readonly latestPriceBrandName: string | null;
  readonly latestUnitPriceBeforeTax: number | null;
  readonly latestUnitPriceAfterTax: number | null;
  readonly latestReceivedAt: Date | null;
  readonly hasPrice: boolean;
};

export type StockReceivingLot = {
  readonly id: string;
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly receivedQuantity: number;
  readonly receivedUnit: StockPurchaseUnit;
  readonly receivedQuantityBase: number;
  readonly baseUnit: StockPurchaseUnit;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly unitPriceBeforeTax: number;
  readonly unitPriceAfterTax: number;
  readonly remainingQuantityBase: number;
  readonly receivedAt: Date;
  readonly supplierName: string | null;
  readonly invoiceCode: string | null;
  readonly note: string | null;
};

export type StockReceivingLotsList = {
  readonly lots: readonly StockReceivingLot[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
};

export type StockItemBrand = {
  readonly id: string;
  readonly stockItemId: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly purchaseQuantity: number;
  readonly purchaseUnit: StockPurchaseUnit;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly unitPriceBeforeTax: number;
  readonly unitPriceAfterTax: number;
  readonly isPreferred: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type StockItemSortBy = 'name' | 'currentQuantity' | 'status' | 'createdAt' | 'updatedAt';
export type SortOrder = 'ASC' | 'DESC';

export type StockItemFilters = {
  readonly status?: StockItemStatus;
  readonly search?: string;
  readonly lowStockOnly?: boolean;
  readonly sortBy?: StockItemSortBy;
  readonly sortOrder?: SortOrder;
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
  readonly imageFileId: string | null;
  readonly imageFile: FileModel | null;
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
  readonly brandId: string | null;
  readonly brandName: string | null;
  readonly type: MovementType;
  readonly quantity: number;
  readonly previousQuantity: number;
  readonly newQuantity: number;
  readonly reason: string | null;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
  readonly unitCostSnapshot: number | null;
  readonly totalCostSnapshot: number | null;
  readonly costingMethod: string | null;
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
  readonly recipeId: string | null;
  readonly recipeVersionId: string | null;
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

export type RecipeStatus = 'draft' | 'active' | 'archived';

export type Recipe = {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly status: RecipeStatus;
  readonly note: string | null;
  readonly versions?: readonly RecipeVersion[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RecipeVersion = {
  readonly id: string;
  readonly recipeId: string;
  readonly versionNumber: number;
  readonly status: RecipeStatus;
  readonly yieldQuantity: number;
  readonly yieldUnit: StockPurchaseUnit;
  readonly yieldBaseQuantity: number;
  readonly yieldBaseUnit: StockPurchaseUnit;
  readonly estimatedCost: number;
  readonly costingMethod: string;
  readonly effectiveFrom: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RecipeVersionItem = {
  readonly id: string;
  readonly recipeVersionId: string;
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly quantity: number;
  readonly unit: StockPurchaseUnit;
  readonly baseQuantity: number;
  readonly baseUnit: StockPurchaseUnit;
  readonly wastePercent: number;
  readonly preferredBrandId: string | null;
  readonly preferredBrandName: string | null;
  readonly unitCostSnapshot: number;
  readonly totalCostSnapshot: number;
  readonly note: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RecipeVersionDetail = RecipeVersion & {
  readonly items: readonly RecipeVersionItem[];
};

// Bulk Import
export type BulkImportRowResult = {
  readonly row: number;
  readonly name: string;
  readonly success: boolean;
  readonly id?: string;
  readonly error?: string;
};

export type BulkImportResult = {
  readonly totalRows: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly results: readonly BulkImportRowResult[];
};
