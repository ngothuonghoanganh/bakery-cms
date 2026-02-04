/**
 * Product Images DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { FileResponseDto } from '../../files/dto/files.dto';

/**
 * Product image response DTO
 * Returned in API responses
 */
export interface ProductImageResponseDto {
  id: string;
  productId: string;
  fileId: string;
  file: FileResponseDto;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add product image request DTO
 * Expected in POST /products/:id/images
 */
export interface AddProductImageDto {
  fileId: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

/**
 * Update product image request DTO
 * Expected in PATCH /products/:productId/images/:imageId
 */
export interface UpdateProductImageDto {
  displayOrder?: number;
  isPrimary?: boolean;
}

/**
 * Reorder product images request DTO
 * Expected in PUT /products/:id/images/reorder
 */
export interface ReorderProductImagesDto {
  imageIds: string[];
}

/**
 * Product images list response
 */
export interface ProductImagesListResponseDto {
  data: ProductImageResponseDto[];
}
