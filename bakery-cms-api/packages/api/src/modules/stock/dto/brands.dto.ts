/**
 * Brands DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { FileResponseDto } from '../../files/dto/files.dto';

/**
 * Brand response DTO
 * Returned in API responses
 */
export interface BrandResponseDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  imageFileId: string | null;
  imageFile: FileResponseDto | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create brand request DTO
 * Expected in POST /brands
 */
export interface CreateBrandDto {
  name: string;
  description?: string;
  isActive?: boolean;
  imageFileId?: string;
}

/**
 * Update brand request DTO
 * Expected in PATCH /brands/:id
 */
export interface UpdateBrandDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  imageFileId?: string | null;
}

/**
 * Brand list query parameters
 * Expected in GET /brands
 */
export interface BrandListQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/**
 * Paginated brand list response
 */
export interface BrandListResponseDto {
  data: BrandResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
