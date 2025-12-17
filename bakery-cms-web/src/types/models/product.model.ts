/**
 * Product domain model
 * Represents product data in the frontend domain layer
 */

export const BusinessType = {
  MADE_TO_ORDER: 'made_to_order',
  READY_TO_SELL: 'ready_to_sell',
} as const;

export type BusinessType = (typeof BusinessType)[keyof typeof BusinessType];

export const ProductStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly category: string | null;
  readonly businessType: BusinessType;
  readonly status: ProductStatus;
  readonly imageUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProductFilters = {
  readonly category?: string;
  readonly businessType?: BusinessType;
  readonly status?: ProductStatus;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly search?: string;
};

export type PaginationParams = {
  readonly page?: number;
  readonly limit?: number;
};

export type PaginatedProducts = {
  readonly products: readonly Product[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};
