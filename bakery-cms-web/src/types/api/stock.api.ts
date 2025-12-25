/**
 * API response types for Stock endpoints
 * These types represent the data structure returned by the backend API
 */

// Stock Items
export type StockItemAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly unitOfMeasure: string;
  readonly currentQuantity: number;
  readonly reorderThreshold: number | null;
  readonly status: string; // 'available' | 'low_stock' | 'out_of_stock'
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly brands?: readonly StockItemBrandAPIResponse[];
};

export type StockItemBrandAPIResponse = {
  readonly id: string;
  readonly stockItemId: string;
  readonly brandId: string;
  readonly brandName: string;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
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
  readonly unitOfMeasure: string;
  readonly currentQuantity?: number;
  readonly reorderThreshold?: number;
};

export type UpdateStockItemRequest = {
  readonly name?: string;
  readonly description?: string;
  readonly unitOfMeasure?: string;
  readonly reorderThreshold?: number;
};

export type StockItemFiltersRequest = {
  readonly status?: string;
  readonly search?: string;
  readonly lowStockOnly?: boolean;
  readonly page?: number;
  readonly limit?: number;
};

export type ReceiveStockRequest = {
  readonly quantity: number;
  readonly reason?: string;
};

export type AdjustStockRequest = {
  readonly quantity: number;
  readonly reason: string;
};

export type AddBrandToStockItemRequest = {
  readonly brandId: string;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly isPreferred?: boolean;
};

export type UpdateStockItemBrandRequest = {
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
};

export type UpdateBrandRequest = {
  readonly name?: string;
  readonly description?: string;
  readonly isActive?: boolean;
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
  readonly type: string; // 'received' | 'used' | 'adjusted' | 'damaged' | 'expired'
  readonly quantity: number;
  readonly previousQuantity: number;
  readonly newQuantity: number;
  readonly reason: string | null;
  readonly referenceType: string | null;
  readonly referenceId: string | null;
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
  readonly preferredBrandId?: string;
  readonly notes?: string;
};

export type UpdateProductStockItemRequest = {
  readonly quantity?: number;
  readonly preferredBrandId?: string;
  readonly notes?: string;
};
