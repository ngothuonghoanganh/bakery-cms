/**
 * API response types for Product endpoints
 * These types represent the data structure returned by the backend API
 */

export type ProductAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly category: string | null;
  readonly businessType: string;
  readonly status: string;
  readonly imageUrl: string | null;
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
