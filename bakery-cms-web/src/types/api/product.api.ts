/**
 * API response types for Product endpoints
 * These types represent the data structure returned by the backend API
 */

import type { FileAPIResponse } from './file.api';

/**
 * Product image API response
 */
export type ProductImageAPIResponse = {
  readonly id: string;
  readonly productId: string;
  readonly fileId: string;
  readonly displayOrder: number;
  readonly isPrimary: boolean;
  readonly file?: FileAPIResponse;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProductAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly category: string | null;
  readonly businessType: string;
  readonly status: string;
  readonly imageUrl: string | null;
  readonly imageFileId: string | null;
  readonly imageFile: FileAPIResponse | null;
  readonly images?: readonly ProductImageAPIResponse[];
  readonly createdAt: string; // ISO date string from API
  readonly updatedAt: string; // ISO date string from API
};

export type PaginatedProductsAPIResponse = {
  readonly data: readonly ProductAPIResponse[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export type CreateProductRequest = {
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly category?: string;
  readonly businessType: string;
  readonly status?: string;
  readonly imageUrl?: string;
};

export type UpdateProductRequest = {
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly category?: string;
  readonly businessType?: string;
  readonly status?: string;
  readonly imageUrl?: string;
  readonly imageFileId?: string | null;
};

export type ProductFiltersRequest = {
  readonly category?: string;
  readonly businessType?: string;
  readonly status?: string;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
};
