/**
 * Stock mappers
 * Transform API responses to domain models
 */

import type {
  StockItemAPIResponse,
  StockItemBrandAPIResponse,
  PaginatedStockItemsAPIResponse,
  BrandAPIResponse,
  PaginatedBrandsAPIResponse,
  StockMovementAPIResponse,
  PaginatedStockMovementsAPIResponse,
  ProductStockItemAPIResponse,
  ProductRecipeAPIResponse,
  ProductCostAPIResponse,
  BulkImportAPIResponse,
} from '@/types/api/stock.api';

import type {
  StockItem,
  StockItemBrand,
  PaginatedStockItems,
  Brand,
  PaginatedBrands,
  StockMovement,
  PaginatedStockMovements,
  ProductStockItem,
  ProductRecipe,
  ProductCost,
  BulkImportResult,
} from '@/types/models/stock.model';

import { StockItemStatus, MovementType } from '@/types/models/stock.model';
import { mapFileFromAPI } from './file.mapper';

// Stock Item Mappers

/**
 * Map stock item brand API response to domain model
 */
export const mapStockItemBrandFromAPI = (
  apiBrand: StockItemBrandAPIResponse
): StockItemBrand => ({
  id: apiBrand.id,
  stockItemId: apiBrand.stockItemId,
  brandId: apiBrand.brandId,
  brandName: apiBrand.brandName,
  priceBeforeTax: apiBrand.priceBeforeTax,
  priceAfterTax: apiBrand.priceAfterTax,
  isPreferred: apiBrand.isPreferred,
  createdAt: new Date(apiBrand.createdAt),
  updatedAt: new Date(apiBrand.updatedAt),
});

/**
 * Map stock item API response to domain model
 */
export const mapStockItemFromAPI = (apiStockItem: StockItemAPIResponse): StockItem => ({
  id: apiStockItem.id,
  name: apiStockItem.name,
  description: apiStockItem.description,
  unitOfMeasure: apiStockItem.unitOfMeasure,
  currentQuantity: apiStockItem.currentQuantity,
  reorderThreshold: apiStockItem.reorderThreshold,
  status: apiStockItem.status as StockItemStatus,
  createdAt: new Date(apiStockItem.createdAt),
  updatedAt: new Date(apiStockItem.updatedAt),
  brands: apiStockItem.brands?.map(mapStockItemBrandFromAPI),
});

/**
 * Map paginated stock items API response to domain model
 */
export const mapPaginatedStockItemsFromAPI = (
  apiResponse: PaginatedStockItemsAPIResponse
): PaginatedStockItems => ({
  stockItems: apiResponse.data.map(mapStockItemFromAPI),
  total: apiResponse.pagination.total,
  page: apiResponse.pagination.page,
  limit: apiResponse.pagination.limit,
  totalPages: apiResponse.pagination.totalPages,
});

// Brand Mappers

/**
 * Map brand API response to domain model
 */
export const mapBrandFromAPI = (apiBrand: BrandAPIResponse): Brand => ({
  id: apiBrand.id,
  name: apiBrand.name,
  description: apiBrand.description,
  isActive: apiBrand.isActive,
  imageFileId: apiBrand.imageFileId,
  imageFile: apiBrand.imageFile ? mapFileFromAPI(apiBrand.imageFile) : null,
  createdAt: new Date(apiBrand.createdAt),
  updatedAt: new Date(apiBrand.updatedAt),
});

/**
 * Map paginated brands API response to domain model
 */
export const mapPaginatedBrandsFromAPI = (
  apiResponse: PaginatedBrandsAPIResponse
): PaginatedBrands => ({
  brands: apiResponse.data.map(mapBrandFromAPI),
  total: apiResponse.pagination.total,
  page: apiResponse.pagination.page,
  limit: apiResponse.pagination.limit,
  totalPages: apiResponse.pagination.totalPages,
});

// Stock Movement Mappers

/**
 * Map stock movement API response to domain model
 */
export const mapStockMovementFromAPI = (
  apiMovement: StockMovementAPIResponse
): StockMovement => ({
  id: apiMovement.id,
  stockItemId: apiMovement.stockItemId,
  stockItemName: apiMovement.stockItemName,
  type: apiMovement.type as MovementType,
  quantity: apiMovement.quantity,
  previousQuantity: apiMovement.previousQuantity,
  newQuantity: apiMovement.newQuantity,
  reason: apiMovement.reason,
  referenceType: apiMovement.referenceType,
  referenceId: apiMovement.referenceId,
  userId: apiMovement.userId,
  userName: apiMovement.userName,
  createdAt: new Date(apiMovement.createdAt),
});

/**
 * Map paginated stock movements API response to domain model
 */
export const mapPaginatedStockMovementsFromAPI = (
  apiResponse: PaginatedStockMovementsAPIResponse
): PaginatedStockMovements => ({
  stockMovements: apiResponse.data.map(mapStockMovementFromAPI),
  total: apiResponse.pagination.total,
  page: apiResponse.pagination.page,
  limit: apiResponse.pagination.limit,
  totalPages: apiResponse.pagination.totalPages,
});

// Product Stock Item Mappers

/**
 * Map product stock item API response to domain model
 */
export const mapProductStockItemFromAPI = (
  apiItem: ProductStockItemAPIResponse
): ProductStockItem => ({
  id: apiItem.id,
  productId: apiItem.productId,
  stockItemId: apiItem.stockItemId,
  stockItemName: apiItem.stockItemName,
  unitOfMeasure: apiItem.unitOfMeasure,
  quantity: apiItem.quantity,
  preferredBrandId: apiItem.preferredBrandId,
  preferredBrandName: apiItem.preferredBrandName,
  notes: apiItem.notes,
  createdAt: new Date(apiItem.createdAt),
  updatedAt: new Date(apiItem.updatedAt),
});

/**
 * Map product recipe API response to domain model
 */
export const mapProductRecipeFromAPI = (
  apiRecipe: ProductRecipeAPIResponse
): ProductRecipe => ({
  productId: apiRecipe.productId,
  productName: apiRecipe.productName,
  stockItems: apiRecipe.stockItems.map(mapProductStockItemFromAPI),
});

/**
 * Map product cost API response to domain model
 */
export const mapProductCostFromAPI = (apiCost: ProductCostAPIResponse): ProductCost => ({
  productId: apiCost.productId,
  productName: apiCost.productName,
  totalCost: apiCost.totalCost,
  costBreakdown: apiCost.costBreakdown.map((item) => ({
    stockItemId: item.stockItemId,
    stockItemName: item.stockItemName,
    quantity: item.quantity,
    unitOfMeasure: item.unitOfMeasure,
    brandId: item.brandId,
    brandName: item.brandName,
    unitPrice: item.unitPrice,
    totalCost: item.totalCost,
  })),
});

// Bulk Import Mappers

/**
 * Map bulk import API response to domain model
 */
export const mapBulkImportResultFromAPI = (
  apiResult: BulkImportAPIResponse
): BulkImportResult => ({
  totalRows: apiResult.totalRows,
  successCount: apiResult.successCount,
  errorCount: apiResult.errorCount,
  results: apiResult.results.map((row) => ({
    row: row.row,
    name: row.name,
    success: row.success,
    id: row.id,
    error: row.error,
  })),
});
