/**
 * Product DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { BusinessType, ProductStatus } from '@bakery-cms/common';

/**
 * Product response DTO
 * Returned in API responses
 */
export interface ProductResponseDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create product request DTO
 * Expected in POST /products
 */
export interface CreateProductDto {
  name: string;
  description?: string;
  price: number;
  category?: string;
  businessType: BusinessType;
  status?: ProductStatus;
  imageUrl?: string;
}

/**
 * Update product request DTO
 * Expected in PATCH /products/:id
 */
export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  businessType?: BusinessType;
  status?: ProductStatus;
  imageUrl?: string;
}

/**
 * Product list query parameters
 * Expected in GET /products
 */
export interface ProductListQueryDto {
  page?: number;
  limit?: number;
  businessType?: BusinessType;
  status?: ProductStatus;
  category?: string;
  search?: string;
}

/**
 * Paginated product list response
 */
export interface ProductListResponseDto {
  data: ProductResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
