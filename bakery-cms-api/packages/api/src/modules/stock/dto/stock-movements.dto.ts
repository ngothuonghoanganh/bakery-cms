/**
 * Stock Movements DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { MovementType } from '@bakery-cms/common';

/**
 * Stock movement response DTO
 * Returned in API responses
 */
export interface StockMovementResponseDto {
  id: string;
  stockItemId: string;
  stockItemName: string;
  type: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  userId: string;
  userName: string;
  createdAt: string;
}

/**
 * Stock movement list query parameters
 * Expected in GET /stock-movements
 */
export interface StockMovementListQueryDto {
  page?: number;
  limit?: number;
  stockItemId?: string;
  type?: MovementType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Paginated stock movement list response
 */
export interface StockMovementListResponseDto {
  data: StockMovementResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
