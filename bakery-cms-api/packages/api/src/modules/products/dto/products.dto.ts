/**
 * Product DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { BusinessType, ProductStatus } from '@bakery-cms/common';
import { FileResponseDto } from '../../files/dto/files.dto';
import { ProductImageResponseDto } from './product-images.dto';

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
  imageFileId: string | null;
  imageFile: FileResponseDto | null;
  images: ProductImageResponseDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Product image input for create/update operations
 */
export interface ProductImageInputDto {
  id?: string; // Optional: existing image ID (for updates)
  fileId: string;
  displayOrder?: number;
  isPrimary?: boolean;
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
  imageFileId?: string;
  images?: ProductImageInputDto[];
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
  imageFileId?: string | null;
  images?: ProductImageInputDto[];
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
