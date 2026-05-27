/**
 * Stock Items DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import {
  StockItemStatus,
  StockUnitType,
  StockPurchaseUnit,
} from '@bakery-cms/common';
import type { StockReceivingLotResponseDto } from './stock-receiving-lots.dto';

/**
 * Stock item response DTO
 * Returned in API responses
 */
export interface StockItemResponseDto {
  id: string;
  name: string;
  description: string | null;
  unitType: StockUnitType;
  unitOfMeasure: string;
  baseUnit: StockPurchaseUnit;
  currentQuantity: number;
  reorderThreshold: number | null;
  status: StockItemStatus;
  createdAt: string;
  updatedAt: string;
  brands?: StockItemBrandResponseDto[];
  priceSummary?: StockItemPriceSummaryDto;
  latestReceivingLot?: StockReceivingLotResponseDto | null;
}

/**
 * Stock item brand pricing response DTO
 */
export interface StockItemBrandResponseDto {
  id: string;
  stockItemId: string;
  brandId: string;
  brandName: string;
  purchaseQuantity: number;
  purchaseUnit: StockPurchaseUnit;
  priceBeforeTax: number;
  priceAfterTax: number;
  unitPriceBeforeTax: number;
  unitPriceAfterTax: number;
  isPreferred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockItemPriceSummaryDto {
  preferredBrandId: string | null;
  preferredBrandName: string | null;
  latestPriceBrandId: string | null;
  latestPriceBrandName: string | null;
  latestUnitPriceBeforeTax: number | null;
  latestUnitPriceAfterTax: number | null;
  latestReceivedAt: string | null;
  hasPrice: boolean;
}

/**
 * Create stock item request DTO
 * Expected in POST /stock-items
 */
export interface CreateStockItemDto {
  name: string;
  description?: string;
  unitType: StockUnitType;
  currentQuantity?: number;
  reorderThreshold?: number;
}

/**
 * Update stock item request DTO
 * Expected in PATCH /stock-items/:id
 */
export interface UpdateStockItemDto {
  name?: string;
  description?: string;
  unitType?: StockUnitType;
  reorderThreshold?: number;
}

/**
 * Stock item list query parameters
 * Expected in GET /stock-items
 */
export interface StockItemListQueryDto {
  page?: number;
  limit?: number;
  status?: StockItemStatus;
  search?: string;
  lowStockOnly?: boolean;
  sortBy?: 'name' | 'currentQuantity' | 'status' | 'createdAt' | 'updatedAt';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated stock item list response
 */
export interface StockItemListResponseDto {
  data: StockItemResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Receive stock request DTO
 * Expected in POST /stock-items/:id/receive
 */
export interface ReceiveStockDto {
  quantity: number;
  reason?: string;
}

export interface ReceiveWithPricingResponseDto {
  stockItem: StockItemResponseDto;
  receivingLot: StockReceivingLotResponseDto;
  updatedBrandPrice: StockItemBrandResponseDto;
}

/**
 * Adjust stock request DTO
 * Expected in POST /stock-items/:id/adjust
 */
export interface AdjustStockDto {
  quantity: number;
  reason: string;
}

/**
 * Add brand to stock item request DTO
 * Expected in POST /stock-items/:id/brands
 */
export interface AddBrandToStockItemDto {
  brandId: string;
  purchaseQuantity: number;
  purchaseUnit: StockPurchaseUnit;
  priceBeforeTax: number;
  priceAfterTax: number;
  isPreferred?: boolean;
}

/**
 * Update stock item brand pricing request DTO
 * Expected in PATCH /stock-items/:id/brands/:brandId
 */
export interface UpdateStockItemBrandDto {
  purchaseQuantity?: number;
  purchaseUnit?: StockPurchaseUnit;
  priceBeforeTax?: number;
  priceAfterTax?: number;
  isPreferred?: boolean;
}

/**
 * Bulk import stock item row DTO
 * Represents a single row in the CSV import file
 */
export interface BulkImportStockItemRowDto {
  name: string;
  description?: string;
  unitType?: StockUnitType;
  unitOfMeasure?: string;
  currentQuantity?: number;
  reorderThreshold?: number;
}

/**
 * Bulk import result for a single row
 */
export interface BulkImportRowResultDto {
  row: number;
  name: string;
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Bulk import response DTO
 * Returned after processing CSV import
 */
export interface BulkImportResponseDto {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: BulkImportRowResultDto[];
}
