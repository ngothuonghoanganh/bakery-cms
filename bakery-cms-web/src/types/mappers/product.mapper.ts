/**
 * Product mappers
 * Transform API responses to domain models
 */

import type {
  ProductAPIResponse,
  PaginatedProductsAPIResponse,
  ProductImageAPIResponse,
  ProductComboItemAPIResponse,
} from '@/types/api/product.api';
import type { Product, PaginatedProducts, ProductImage, ProductComboItem } from '@/types/models/product.model';
import {
  BusinessType,
  ProductStatus,
  ProductType,
  SaleUnitType,
} from '@/types/models/product.model';
import { mapFileFromAPI } from './file.mapper';

const normalizeBusinessType = (value: string): BusinessType => {
  const map: Record<string, BusinessType> = {
    [BusinessType.MADE_TO_ORDER]: BusinessType.MADE_TO_ORDER,
    [BusinessType.READY_TO_SELL]: BusinessType.READY_TO_SELL,
    [BusinessType.BOTH]: BusinessType.BOTH,
    MADE_TO_ORDER: BusinessType.MADE_TO_ORDER,
    READY_TO_SELL: BusinessType.READY_TO_SELL,
    BOTH: BusinessType.BOTH,
  };
  return map[value] ?? (value as BusinessType);
};

const normalizeProductStatus = (value: string): ProductStatus => {
  const map: Record<string, ProductStatus> = {
    [ProductStatus.AVAILABLE]: ProductStatus.AVAILABLE,
    [ProductStatus.OUT_OF_STOCK]: ProductStatus.OUT_OF_STOCK,
    AVAILABLE: ProductStatus.AVAILABLE,
    OUT_OF_STOCK: ProductStatus.OUT_OF_STOCK,
  };
  return map[value] ?? (value as ProductStatus);
};

const normalizeProductType = (value: string): ProductType => {
  const map: Record<string, ProductType> = {
    [ProductType.SINGLE]: ProductType.SINGLE,
    [ProductType.COMBO]: ProductType.COMBO,
    SINGLE: ProductType.SINGLE,
    COMBO: ProductType.COMBO,
  };
  return map[value] ?? (value as ProductType);
};

/**
 * Map API response to ProductImage domain model
 */
export const mapProductImageFromAPI = (apiImage: ProductImageAPIResponse): ProductImage => ({
  id: apiImage.id,
  productId: apiImage.productId,
  fileId: apiImage.fileId,
  displayOrder: apiImage.displayOrder,
  isPrimary: apiImage.isPrimary,
  file: apiImage.file ? mapFileFromAPI(apiImage.file) : undefined,
  createdAt: new Date(apiImage.createdAt),
  updatedAt: new Date(apiImage.updatedAt),
});

export const mapProductComboItemFromAPI = (
  apiComboItem: ProductComboItemAPIResponse
): ProductComboItem => ({
  id: apiComboItem.id,
  comboProductId: apiComboItem.comboProductId,
  itemProductId: apiComboItem.itemProductId,
  quantity: apiComboItem.quantity,
  displayOrder: apiComboItem.displayOrder,
  itemProduct: apiComboItem.itemProduct
    ? {
        id: apiComboItem.itemProduct.id,
        productCode: apiComboItem.itemProduct.productCode,
        name: apiComboItem.itemProduct.name,
        saleUnitType: apiComboItem.itemProduct.saleUnitType ?? SaleUnitType.PIECE,
        imageUrl: apiComboItem.itemProduct.imageUrl,
        imageFileId: apiComboItem.itemProduct.imageFileId,
      }
    : null,
  createdAt: new Date(apiComboItem.createdAt),
  updatedAt: new Date(apiComboItem.updatedAt),
});

/**
 * Map API response to Product domain model
 */
export const mapProductFromAPI = (apiProduct: ProductAPIResponse): Product => ({
  id: apiProduct.id,
  productCode: apiProduct.productCode,
  name: apiProduct.name,
  description: apiProduct.description,
  price: apiProduct.price,
  saleUnitType: apiProduct.saleUnitType ?? SaleUnitType.PIECE,
  category: apiProduct.category,
  businessType: normalizeBusinessType(apiProduct.businessType),
  status: normalizeProductStatus(apiProduct.status),
  productType: apiProduct.productType ? normalizeProductType(apiProduct.productType) : ProductType.SINGLE,
  isPublished: apiProduct.isPublished ?? true,
  comboItems: apiProduct.comboItems?.map(mapProductComboItemFromAPI) || [],
  imageUrl: apiProduct.imageUrl,
  imageFileId: apiProduct.imageFileId,
  imageFile: apiProduct.imageFile ? mapFileFromAPI(apiProduct.imageFile) : null,
  images: apiProduct.images?.map(mapProductImageFromAPI) || [],
  createdAt: new Date(apiProduct.createdAt),
  updatedAt: new Date(apiProduct.updatedAt),
});

/**
 * Map paginated API response to domain model
 */
export const mapPaginatedProductsFromAPI = (
  apiResponse: PaginatedProductsAPIResponse
): PaginatedProducts => ({
  products: apiResponse.data.map(mapProductFromAPI),
  total: apiResponse.pagination.total,
  page: apiResponse.pagination.page,
  limit: apiResponse.pagination.limit,
  totalPages: apiResponse.pagination.totalPages,
});
