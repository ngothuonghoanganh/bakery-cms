/**
 * Stock Items DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { StockItemStatus } from '@bakery-cms/common';

/**
 * Stock item response DTO
 * Returned in API responses
 */
export interface StockItemResponseDto {
  id: string;
  name: string;
  description: string | null;
  unitOfMeasure: string;
  currentQuantity: number;
  reorderThreshold: number | null;
  status: StockItemStatus;
  createdAt: string;
  updatedAt: string;
  brands?: StockItemBrandResponseDto[];
}

/**
 * Stock item brand pricing response DTO
 */
export interface StockItemBrandResponseDto {
  id: string;
  stockItemId: string;
  brandId: string;
  brandName: string;
  priceBeforeTax: number;
  priceAfterTax: number;
  isPreferred: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create stock item request DTO
 * Expected in POST /stock-items
 */
export interface CreateStockItemDto {
  name: string;
  description?: string;
  unitOfMeasure: string;
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
  unitOfMeasure?: string;
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
  priceBeforeTax: number;
  priceAfterTax: number;
  isPreferred?: boolean;
}

/**
 * Update stock item brand pricing request DTO
 * Expected in PATCH /stock-items/:id/brands/:brandId
 */
export interface UpdateStockItemBrandDto {
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
  unitOfMeasure: string;
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
