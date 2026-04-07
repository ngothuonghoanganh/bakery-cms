/**
 * Product entity types and interfaces
 * Supports both made-to-order and ready-to-sell business models
 */

import { Result } from './result.types';
import { AppError } from './error.types';

/**
 * Core Product entity
 */
export type Product = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly saleUnitType: string; // SaleUnitType enum value
  readonly category: string | null;
  readonly businessType: string; // BusinessType enum value
  readonly status: string; // ProductStatus enum value
  readonly productType: string; // ProductType enum value
  readonly isPublished: boolean;
  readonly imageUrl: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProductComboItem = {
  readonly id: string;
  readonly comboProductId: string;
  readonly itemProductId: string;
  readonly quantity: number;
  readonly displayOrder: number;
};

/**
 * Data Transfer Object for creating a product
 */
export type CreateProductDTO = {
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly saleUnitType?: string;
  readonly category?: string;
  readonly businessType: string;
  readonly status?: string;
  readonly productType?: string;
  readonly isPublished?: boolean;
  readonly imageUrl?: string;
  readonly comboItems?: readonly {
    readonly itemProductId: string;
    readonly quantity: number;
    readonly displayOrder?: number;
  }[];
};

/**
 * Data Transfer Object for updating a product
 */
export type UpdateProductDTO = {
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly saleUnitType?: string;
  readonly category?: string;
  readonly businessType?: string;
  readonly status?: string;
  readonly productType?: string;
  readonly isPublished?: boolean;
  readonly imageUrl?: string;
  readonly comboItems?: readonly {
    readonly id?: string;
    readonly itemProductId: string;
    readonly quantity: number;
    readonly displayOrder?: number;
  }[];
};

/**
 * Filters for querying products
 */
export type ProductFilters = {
  readonly category?: string;
  readonly businessType?: string;
  readonly status?: string;
  readonly productType?: string;
  readonly saleUnitType?: string;
  readonly isPublished?: boolean;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly search?: string;
};

/**
 * Pagination parameters
 */
export type PaginationParams = {
  readonly page?: number;
  readonly limit?: number;
};

/**
 * Paginated product response
 */
export type PaginatedProducts = {
  readonly products: readonly Product[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

/**
 * Product repository interface (Dependency Inversion Principle)
 */
export type ProductRepository = {
  readonly findById: (id: string) => Promise<Product | null>;
  readonly findAll: (filters?: ProductFilters, pagination?: PaginationParams) => Promise<readonly Product[]>;
  readonly create: (data: CreateProductDTO) => Promise<Product>;
  readonly update: (id: string, data: UpdateProductDTO) => Promise<Product | null>;
  readonly delete: (id: string) => Promise<boolean>;
  readonly count: (filters?: ProductFilters) => Promise<number>;
};

/**
 * Product service interface (Dependency Inversion Principle)
 */
export type ProductService = {
  readonly getProductById: (id: string) => Promise<Result<Product, AppError>>;
  readonly getAllProducts: (
    filters?: ProductFilters,
    pagination?: PaginationParams
  ) => Promise<Result<PaginatedProducts, AppError>>;
  readonly createProduct: (data: CreateProductDTO) => Promise<Result<Product, AppError>>;
  readonly updateProduct: (id: string, data: UpdateProductDTO) => Promise<Result<Product, AppError>>;
  readonly deleteProduct: (id: string) => Promise<Result<void, AppError>>;
};
