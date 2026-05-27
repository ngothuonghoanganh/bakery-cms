/**
 * API response types for Stock endpoints
 * These types represent the data structure returned by the backend API
 */

import type { FileAPIResponse } from './file.api';
import type { StockPurchaseUnit, StockUnitType } from '@bakery-cms/common';

// Stock Items
export type StockItemAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly unitType: StockUnitType;
  readonly unitOfMeasure: string;
  readonly baseUnit: StockPurchaseUnit;
  readonly currentQuantity: number;
  readonly reorderThreshold: number | null;
  readonly status: string; // 'available' | 'low_stock' | 'out_of_stock'
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly brands?: readonly StockItemBrandAPIResponse[];
  readonly priceSummary?: StockItemPriceSummaryAPIResponse;
  readonly latestReceivingLot?: StockReceivingLotAPIResponse | null;
};

export type StockItemPriceSummaryAPIResponse = {
  readonly preferredBrandId: string | null;
  readonly preferredBrandName: string | null;
  readonly latestPriceBrandId: string | null;
  readonly latestPriceBrandName: string | null;
  readonly latestUnitPriceBeforeTax: number | null;
  readonly latestUnitPriceAfterTax: number | null;
  readonly latestReceivedAt: string | null;
  readonly hasPrice: boolean;
};

export type StockReceivingLotAPIResponse = {
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
  readonly receivedAt: string;
  readonly supplierName: string | null;
  readonly invoiceCode: string | null;
  readonly note: string | null;
};

export type StockItemBrandAPIResponse = {
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
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PaginatedStockItemsAPIResponse = {
  readonly data: readonly StockItemAPIResponse[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export type CreateStockItemRequest = {
  readonly name: string;
  readonly description?: string;
  readonly unitType: StockUnitType;
  readonly currentQuantity?: number;
  readonly reorderThreshold?: number;
};

export type UpdateStockItemRequest = {
  readonly name?: string;
  readonly description?: string;
  readonly unitType?: StockUnitType;
  readonly reorderThreshold?: number;
};

export type StockItemFiltersRequest = {
  readonly status?: string;
  readonly search?: string;
  readonly lowStockOnly?: boolean;
  readonly page?: number;
  readonly limit?: number;
  readonly sortBy?: 'name' | 'currentQuantity' | 'status' | 'createdAt' | 'updatedAt';
  readonly sortOrder?: 'ASC' | 'DESC';
};

export type ReceiveStockRequest = {
  readonly quantity: number;
  readonly reason?: string;
};

export type ReceiveWithPricingRequest = {
  readonly brandId: string;
  readonly receivedQuantity: number;
  readonly receivedUnit: StockPurchaseUnit;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly receivedAt?: string;
  readonly supplierName?: string;
  readonly invoiceCode?: string;
  readonly note?: string;
};

export type ReceiveWithPricingAPIResponse = {
  readonly stockItem: StockItemAPIResponse;
  readonly receivingLot: StockReceivingLotAPIResponse;
  readonly updatedBrandPrice: StockItemBrandAPIResponse;
};

export type StockReceivingLotsListAPIResponse = {
  readonly lots: readonly StockReceivingLotAPIResponse[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
};

export type AdjustStockRequest = {
  readonly quantity: number;
  readonly reason: string;
};

export type AddBrandToStockItemRequest = {
  readonly brandId: string;
  readonly purchaseQuantity: number;
  readonly purchaseUnit: StockPurchaseUnit;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly isPreferred?: boolean;
};

export type UpdateStockItemBrandRequest = {
  readonly purchaseQuantity?: number;
  readonly purchaseUnit?: StockPurchaseUnit;
  readonly priceBeforeTax?: number;
  readonly priceAfterTax?: number;
  readonly isPreferred?: boolean;
};

// Brands
export type BrandAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly imageFileId: string | null;
  readonly imageFile: FileAPIResponse | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type PaginatedBrandsAPIResponse = {
  readonly data: readonly BrandAPIResponse[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export type CreateBrandRequest = {
  readonly name: string;
  readonly description?: string;
  readonly isActive?: boolean;
  readonly imageFileId?: string;
};

export type UpdateBrandRequest = {
  readonly name?: string;
  readonly description?: string;
  readonly isActive?: boolean;
  readonly imageFileId?: string | null;
};

export type BrandFiltersRequest = {
  readonly search?: string;
  readonly isActive?: boolean;
  readonly page?: number;
  readonly limit?: number;
};

// Stock Movements
export type StockMovementAPIResponse = {
  readonly id: string;
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly brandId: string | null;
  readonly brandName: string | null;
  readonly type: string; // 'received' | 'used' | 'adjusted' | 'damaged' | 'expired'
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
  readonly createdAt: string;
};

export type PaginatedStockMovementsAPIResponse = {
  readonly data: readonly StockMovementAPIResponse[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export type StockMovementFiltersRequest = {
  readonly stockItemId?: string;
  readonly type?: string;
  readonly userId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly page?: number;
  readonly limit?: number;
};

// Product Stock Items
export type ProductStockItemAPIResponse = {
  readonly id: string;
  readonly productId: string;
  readonly stockItemId: string;
  readonly stockItemName: string;
  readonly unitOfMeasure: string;
  readonly quantity: number;
  readonly preferredBrandId: string | null;
  readonly preferredBrandName: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProductRecipeAPIResponse = {
  readonly productId: string;
  readonly productName: string;
  readonly stockItems: readonly ProductStockItemAPIResponse[];
};

export type ProductCostAPIResponse = {
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

export type AddStockItemToProductRequest = {
  readonly stockItemId: string;
  readonly quantity: number;
  readonly preferredBrandId: string;
  readonly notes?: string;
};

export type UpdateProductStockItemRequest = {
  readonly quantity?: number;
  readonly preferredBrandId?: string;
  readonly notes?: string;
};

export type RecipeAPIResponse = {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly isDefault: boolean;
  readonly status: 'draft' | 'active' | 'archived';
  readonly note: string | null;
  readonly versions?: readonly RecipeVersionAPIResponse[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RecipeVersionAPIResponse = {
  readonly id: string;
  readonly recipeId: string;
  readonly versionNumber: number;
  readonly status: 'draft' | 'active' | 'archived';
  readonly yieldQuantity: number;
  readonly yieldUnit: StockPurchaseUnit;
  readonly yieldBaseQuantity: number;
  readonly yieldBaseUnit: StockPurchaseUnit;
  readonly estimatedCost: number;
  readonly costingMethod: string;
  readonly effectiveFrom: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RecipeVersionItemAPIResponse = {
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
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RecipeVersionDetailAPIResponse = RecipeVersionAPIResponse & {
  readonly items: readonly RecipeVersionItemAPIResponse[];
};

export type CreateRecipeRequest = {
  readonly name: string;
  readonly isDefault?: boolean;
  readonly status?: 'draft' | 'active' | 'archived';
  readonly note?: string;
};

export type UpdateRecipeRequest = {
  readonly name?: string;
  readonly isDefault?: boolean;
  readonly status?: 'draft' | 'active' | 'archived';
  readonly note?: string | null;
};

export type CreateRecipeVersionRequest = {
  readonly status?: 'draft' | 'active' | 'archived';
  readonly yieldQuantity: number;
  readonly yieldUnit: StockPurchaseUnit;
  readonly effectiveFrom?: string | null;
};

export type UpdateRecipeVersionRequest = {
  readonly status?: 'draft' | 'active' | 'archived';
  readonly yieldQuantity?: number;
  readonly yieldUnit?: StockPurchaseUnit;
  readonly effectiveFrom?: string | null;
};

export type CreateRecipeVersionItemRequest = {
  readonly stockItemId: string;
  readonly quantity: number;
  readonly unit: StockPurchaseUnit;
  readonly wastePercent?: number;
  readonly preferredBrandId?: string | null;
  readonly note?: string | null;
};

export type UpdateRecipeVersionItemRequest = {
  readonly quantity?: number;
  readonly unit?: StockPurchaseUnit;
  readonly wastePercent?: number;
  readonly preferredBrandId?: string | null;
  readonly note?: string | null;
};

// Bulk Import
export type BulkImportRowResultAPIResponse = {
  readonly row: number;
  readonly name: string;
  readonly success: boolean;
  readonly id?: string;
  readonly error?: string;
};

export type BulkImportAPIResponse = {
  readonly totalRows: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly results: readonly BulkImportRowResultAPIResponse[];
};
