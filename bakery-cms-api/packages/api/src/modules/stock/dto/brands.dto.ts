/**
 * Brands DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

/**
 * Brand response DTO
 * Returned in API responses
 */
export interface BrandResponseDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
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
}

/**
 * Update brand request DTO
 * Expected in PATCH /brands/:id
 */
export interface UpdateBrandDto {
  name?: string;
  description?: string;
  isActive?: boolean;
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
