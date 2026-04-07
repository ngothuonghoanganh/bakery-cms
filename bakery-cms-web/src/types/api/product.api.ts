/**
 * API response types for Product endpoints
 * These types represent the data structure returned by the backend API
 */

import type { FileAPIResponse } from './file.api';
import type { SaleUnitType } from '@bakery-cms/common';

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

export type ProductComboItemAPIResponse = {
  readonly id: string;
  readonly comboProductId: string;
  readonly itemProductId: string;
  readonly quantity: number;
  readonly displayOrder: number;
  readonly itemProduct: {
    readonly id: string;
    readonly productCode: string;
    readonly name: string;
    readonly saleUnitType: SaleUnitType;
    readonly imageUrl: string | null;
    readonly imageFileId: string | null;
  } | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type ProductAPIResponse = {
  readonly id: string;
  readonly productCode: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly saleUnitType: SaleUnitType;
  readonly category: string | null;
  readonly businessType: string;
  readonly status: string;
  readonly productType: string;
  readonly isPublished: boolean;
  readonly comboItems?: readonly ProductComboItemAPIResponse[];
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
  readonly productCode?: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly saleUnitType?: SaleUnitType;
  readonly category?: string;
  readonly businessType: string;
  readonly status?: string;
  readonly productType?: string;
  readonly isPublished?: boolean;
  readonly comboItems?: readonly {
    readonly id?: string;
    readonly itemProductId: string;
    readonly quantity: number;
    readonly displayOrder?: number;
  }[];
  readonly imageUrl?: string;
  readonly imageFileId?: string | null;
  readonly images?: readonly {
    readonly id?: string;
    readonly fileId: string;
    readonly displayOrder?: number;
    readonly isPrimary?: boolean;
  }[];
};

export type UpdateProductRequest = {
  readonly productCode?: string;
  readonly name?: string;
  readonly description?: string;
  readonly price?: number;
  readonly saleUnitType?: SaleUnitType;
  readonly category?: string;
  readonly businessType?: string;
  readonly status?: string;
  readonly productType?: string;
  readonly isPublished?: boolean;
  readonly comboItems?: readonly {
    readonly id?: string;
    readonly itemProductId: string;
    readonly quantity: number;
    readonly displayOrder?: number;
  }[];
  readonly imageUrl?: string;
  readonly imageFileId?: string | null;
  readonly images?: readonly {
    readonly id?: string;
    readonly fileId: string;
    readonly displayOrder?: number;
    readonly isPrimary?: boolean;
  }[];
};

export type ProductFiltersRequest = {
  readonly category?: string;
  readonly businessType?: string;
  readonly status?: string;
  readonly productType?: string;
  readonly saleUnitType?: SaleUnitType;
  readonly isPublished?: boolean;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly search?: string;
  readonly page?: number;
  readonly limit?: number;
};
