/**
 * Product domain model
 * Represents product data in the frontend domain layer
 */

import { BusinessType, ProductStatus, ProductType } from '@bakery-cms/common';
import type { FileModel } from './file.model';

// Re-export for backward compatibility
export { BusinessType, ProductStatus, ProductType };
export type {
  BusinessType as BusinessTypeType,
  ProductStatus as ProductStatusType,
  ProductType as ProductTypeType,
} from '@bakery-cms/common';

/**
 * Product image model
 */
export type ProductImage = {
  readonly id: string;
  readonly productId: string;
  readonly fileId: string;
  readonly displayOrder: number;
  readonly isPrimary: boolean;
  readonly file?: FileModel;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProductComboItem = {
  readonly id: string;
  readonly comboProductId: string;
  readonly itemProductId: string;
  readonly quantity: number;
  readonly displayOrder: number;
  readonly itemProduct: {
    readonly id: string;
    readonly productCode: string;
    readonly name: string;
    readonly imageUrl: string | null;
    readonly imageFileId: string | null;
  } | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type Product = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly category: string | null;
  readonly businessType: BusinessType;
  readonly status: ProductStatus;
  readonly productType: ProductType;
  readonly isPublished: boolean;
  readonly comboItems: readonly ProductComboItem[];
  readonly imageUrl: string | null;
  readonly imageFileId: string | null;
  readonly imageFile: FileModel | null;
  readonly images: readonly ProductImage[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type ProductFilters = {
  readonly category?: string;
  readonly businessType?: BusinessType;
  readonly status?: ProductStatus;
  readonly productType?: ProductType;
  readonly isPublished?: boolean;
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
