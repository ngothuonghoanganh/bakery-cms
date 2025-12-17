/**
 * Product mappers
 * Transform API responses to domain models
 */

import type { ProductAPIResponse, PaginatedProductsAPIResponse } from '@/types/api/product.api';
import type { Product, PaginatedProducts } from '@/types/models/product.model';
import { BusinessType, ProductStatus } from '@/types/models/product.model';

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
