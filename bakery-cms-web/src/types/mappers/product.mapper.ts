/**
 * Product mappers
 * Transform API responses to domain models
 */

import type {
  ProductAPIResponse,
  PaginatedProductsAPIResponse,
  ProductImageAPIResponse,
} from '@/types/api/product.api';
import type { Product, PaginatedProducts, ProductImage } from '@/types/models/product.model';
import { BusinessType, ProductStatus } from '@/types/models/product.model';
import { mapFileFromAPI } from './file.mapper';

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

/**
 * Map API response to Product domain model
 */
export const mapProductFromAPI = (apiProduct: ProductAPIResponse): Product => ({
  id: apiProduct.id,
  name: apiProduct.name,
  description: apiProduct.description,
  price: apiProduct.price,
  category: apiProduct.category,
  businessType: apiProduct.businessType as BusinessType,
  status: apiProduct.status as ProductStatus,
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
