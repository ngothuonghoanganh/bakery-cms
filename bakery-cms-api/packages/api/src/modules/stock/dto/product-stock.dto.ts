/**
 * Product Stock Items DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

/**
 * Product stock item response DTO
 * Returned in API responses
 */
export interface ProductStockItemResponseDto {
  id: string;
  productId: string;
  stockItemId: string;
  stockItemName: string;
  unitOfMeasure: string;
  quantity: number;
  preferredBrandId: string | null;
  preferredBrandName: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add stock item to product request DTO
 * Expected in POST /products/:id/stock-items
 */
export interface AddStockItemToProductDto {
  stockItemId: string;
  quantity: number;
  preferredBrandId?: string;
  notes?: string;
}

/**
 * Update product stock item request DTO
 * Expected in PATCH /products/:id/stock-items/:stockItemId
 */
export interface UpdateProductStockItemDto {
  quantity?: number;
  preferredBrandId?: string;
  notes?: string;
}

/**
 * Product recipe (list of stock items) response DTO
 * Expected in GET /products/:id/stock-items
 */
export interface ProductRecipeResponseDto {
  productId: string;
  productName: string;
  stockItems: ProductStockItemResponseDto[];
}

/**
 * Product cost calculation response DTO
 * Expected in GET /products/:id/cost
 */
export interface ProductCostResponseDto {
  productId: string;
  productName: string;
  totalCost: number;
  costBreakdown: ProductCostBreakdownItem[];
}

/**
 * Cost breakdown item for a single stock item in the recipe
 */
export interface ProductCostBreakdownItem {
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unitOfMeasure: string;
  brandId: string | null;
  brandName: string | null;
  unitPrice: number;
  totalCost: number;
}
