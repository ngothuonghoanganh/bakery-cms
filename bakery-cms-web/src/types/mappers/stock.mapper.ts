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
  StockItemPriceSummaryAPIResponse,
  StockReceivingLotAPIResponse,
  ProductStockItemAPIResponse,
  ProductRecipeAPIResponse,
  ProductCostAPIResponse,
  BulkImportAPIResponse,
  RecipeAPIResponse,
  RecipeVersionAPIResponse,
  RecipeVersionItemAPIResponse,
  RecipeVersionDetailAPIResponse,
} from '@/types/api/stock.api';

import type {
  StockItem,
  StockItemBrand,
  PaginatedStockItems,
  Brand,
  PaginatedBrands,
  StockMovement,
  PaginatedStockMovements,
  StockItemPriceSummary,
  StockReceivingLot,
  ProductStockItem,
  ProductRecipe,
  ProductCost,
  BulkImportResult,
  Recipe,
  RecipeVersion,
  RecipeVersionItem,
  RecipeVersionDetail,
} from '@/types/models/stock.model';

import {
  StockItemStatus,
  MovementType,
  StockUnitType,
  StockPurchaseUnit,
} from '@/types/models/stock.model';
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
  purchaseQuantity: apiBrand.purchaseQuantity ?? 1,
  purchaseUnit: apiBrand.purchaseUnit ?? StockPurchaseUnit.PIECE,
  priceBeforeTax: apiBrand.priceBeforeTax,
  priceAfterTax: apiBrand.priceAfterTax,
  unitPriceBeforeTax: apiBrand.unitPriceBeforeTax ?? apiBrand.priceBeforeTax,
  unitPriceAfterTax: apiBrand.unitPriceAfterTax ?? apiBrand.priceAfterTax,
  isPreferred: apiBrand.isPreferred,
  createdAt: new Date(apiBrand.createdAt),
  updatedAt: new Date(apiBrand.updatedAt),
});

export const mapStockItemPriceSummaryFromAPI = (
  apiSummary: StockItemPriceSummaryAPIResponse
): StockItemPriceSummary => ({
  preferredBrandId: apiSummary.preferredBrandId,
  preferredBrandName: apiSummary.preferredBrandName,
  latestPriceBrandId: apiSummary.latestPriceBrandId,
  latestPriceBrandName: apiSummary.latestPriceBrandName,
  latestUnitPriceBeforeTax: apiSummary.latestUnitPriceBeforeTax,
  latestUnitPriceAfterTax: apiSummary.latestUnitPriceAfterTax,
  latestReceivedAt: apiSummary.latestReceivedAt ? new Date(apiSummary.latestReceivedAt) : null,
  hasPrice: apiSummary.hasPrice,
});

export const mapStockReceivingLotFromAPI = (
  apiLot: StockReceivingLotAPIResponse
): StockReceivingLot => ({
  id: apiLot.id,
  stockItemId: apiLot.stockItemId,
  stockItemName: apiLot.stockItemName,
  brandId: apiLot.brandId,
  brandName: apiLot.brandName,
  receivedQuantity: apiLot.receivedQuantity,
  receivedUnit: apiLot.receivedUnit ?? StockPurchaseUnit.PIECE,
  receivedQuantityBase: apiLot.receivedQuantityBase,
  baseUnit: apiLot.baseUnit ?? StockPurchaseUnit.PIECE,
  priceBeforeTax: apiLot.priceBeforeTax,
  priceAfterTax: apiLot.priceAfterTax,
  unitPriceBeforeTax: apiLot.unitPriceBeforeTax,
  unitPriceAfterTax: apiLot.unitPriceAfterTax,
  remainingQuantityBase: apiLot.remainingQuantityBase,
  receivedAt: new Date(apiLot.receivedAt),
  supplierName: apiLot.supplierName,
  invoiceCode: apiLot.invoiceCode,
  note: apiLot.note,
});

/**
 * Map stock item API response to domain model
 */
export const mapStockItemFromAPI = (apiStockItem: StockItemAPIResponse): StockItem => ({
  id: apiStockItem.id,
  name: apiStockItem.name,
  description: apiStockItem.description,
  unitType: apiStockItem.unitType ?? StockUnitType.PIECE,
  unitOfMeasure: apiStockItem.unitOfMeasure,
  baseUnit: apiStockItem.baseUnit ?? StockPurchaseUnit.PIECE,
  currentQuantity: apiStockItem.currentQuantity,
  reorderThreshold: apiStockItem.reorderThreshold,
  status: apiStockItem.status as StockItemStatus,
  createdAt: new Date(apiStockItem.createdAt),
  updatedAt: new Date(apiStockItem.updatedAt),
  brands: apiStockItem.brands?.map(mapStockItemBrandFromAPI),
  priceSummary: apiStockItem.priceSummary
    ? mapStockItemPriceSummaryFromAPI(apiStockItem.priceSummary)
    : undefined,
  latestReceivingLot:
    apiStockItem.latestReceivingLot === null
      ? null
      : apiStockItem.latestReceivingLot
        ? mapStockReceivingLotFromAPI(apiStockItem.latestReceivingLot)
        : undefined,
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
  brandId: apiMovement.brandId,
  brandName: apiMovement.brandName,
  type: apiMovement.type as MovementType,
  quantity: apiMovement.quantity,
  previousQuantity: apiMovement.previousQuantity,
  newQuantity: apiMovement.newQuantity,
  reason: apiMovement.reason,
  referenceType: apiMovement.referenceType,
  referenceId: apiMovement.referenceId,
  unitCostSnapshot: apiMovement.unitCostSnapshot ?? null,
  totalCostSnapshot: apiMovement.totalCostSnapshot ?? null,
  costingMethod: apiMovement.costingMethod ?? null,
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
  recipeId: apiCost.recipeId ?? null,
  recipeVersionId: apiCost.recipeVersionId ?? null,
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

export const mapRecipeFromAPI = (apiRecipe: RecipeAPIResponse): Recipe => ({
  id: apiRecipe.id,
  productId: apiRecipe.productId,
  name: apiRecipe.name,
  isDefault: apiRecipe.isDefault,
  status: apiRecipe.status,
  note: apiRecipe.note,
  versions: (apiRecipe.versions || []).map(mapRecipeVersionFromAPI),
  createdAt: new Date(apiRecipe.createdAt),
  updatedAt: new Date(apiRecipe.updatedAt),
});

export const mapRecipeVersionFromAPI = (
  apiVersion: RecipeVersionAPIResponse
): RecipeVersion => ({
  id: apiVersion.id,
  recipeId: apiVersion.recipeId,
  versionNumber: apiVersion.versionNumber,
  status: apiVersion.status,
  yieldQuantity: apiVersion.yieldQuantity,
  yieldUnit: apiVersion.yieldUnit,
  yieldBaseQuantity: apiVersion.yieldBaseQuantity,
  yieldBaseUnit: apiVersion.yieldBaseUnit,
  estimatedCost: apiVersion.estimatedCost,
  costingMethod: apiVersion.costingMethod,
  effectiveFrom: apiVersion.effectiveFrom ? new Date(apiVersion.effectiveFrom) : null,
  createdAt: new Date(apiVersion.createdAt),
  updatedAt: new Date(apiVersion.updatedAt),
});

export const mapRecipeVersionItemFromAPI = (
  apiItem: RecipeVersionItemAPIResponse
): RecipeVersionItem => ({
  id: apiItem.id,
  recipeVersionId: apiItem.recipeVersionId,
  stockItemId: apiItem.stockItemId,
  stockItemName: apiItem.stockItemName,
  quantity: apiItem.quantity,
  unit: apiItem.unit,
  baseQuantity: apiItem.baseQuantity,
  baseUnit: apiItem.baseUnit,
  wastePercent: apiItem.wastePercent,
  preferredBrandId: apiItem.preferredBrandId,
  preferredBrandName: apiItem.preferredBrandName,
  unitCostSnapshot: apiItem.unitCostSnapshot,
  totalCostSnapshot: apiItem.totalCostSnapshot,
  note: apiItem.note,
  createdAt: new Date(apiItem.createdAt),
  updatedAt: new Date(apiItem.updatedAt),
});

export const mapRecipeVersionDetailFromAPI = (
  apiDetail: RecipeVersionDetailAPIResponse
): RecipeVersionDetail => ({
  ...mapRecipeVersionFromAPI(apiDetail),
  items: (apiDetail.items || []).map(mapRecipeVersionItemFromAPI),
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
