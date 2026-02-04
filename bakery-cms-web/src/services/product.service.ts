/**
 * Product service
 * Handles all product-related API calls with Result type pattern
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  ProductAPIResponse,
  PaginatedProductsAPIResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ProductFiltersRequest,
} from '@/types/api/product.api';
import type { Product, PaginatedProducts } from '@/types/models/product.model';
import { mapProductFromAPI, mapPaginatedProductsFromAPI } from '@/types/mappers/product.mapper';
import type { AxiosResponse } from 'axios';

/**
 * Product service type definition
 */
export type ProductService = {
  readonly getAll: (
    filters?: ProductFiltersRequest
  ) => Promise<Result<PaginatedProducts, AppError>>;
  readonly getById: (id: string) => Promise<Result<Product | null, AppError>>;
  readonly create: (data: CreateProductRequest) => Promise<Result<Product, AppError>>;
  readonly update: (id: string, data: UpdateProductRequest) => Promise<Result<Product, AppError>>;
  readonly delete: (id: string) => Promise<Result<boolean, AppError>>;
};

/**
 * Get all products with optional filters
 */
const getAll = async (
  filters?: ProductFiltersRequest
): Promise<Result<PaginatedProducts, AppError>> => {
  try {
    const response = await apiClient.get<PaginatedProductsAPIResponse>('/products', {
      params: filters,
    });
    const paginatedProducts = mapPaginatedProductsFromAPI(response.data);
    return ok(paginatedProducts);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get a product by ID
 */
const getById = async (id: string): Promise<Result<Product | null, AppError>> => {
  try {
    const response = await apiClient.get<AxiosResponse<ProductAPIResponse>>(`/products/${id}`);
    console.log(response);
    if (!response?.data?.data) return ok(null);

    const product = mapProductFromAPI(response?.data?.data);
    return ok(product);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Create a new product
 */
const create = async (data: CreateProductRequest): Promise<Result<Product, AppError>> => {
  try {
    const response = await apiClient.post<AxiosResponse<ProductAPIResponse>>('/products', data);
    const product = mapProductFromAPI(response?.data?.data);
    return ok(product);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Update an existing product
 */
const update = async (
  id: string,
  data: UpdateProductRequest
): Promise<Result<Product, AppError>> => {
  try {
    const response = await apiClient.patch<AxiosResponse<ProductAPIResponse>>(`/products/${id}`, data);
    const product = mapProductFromAPI(response?.data?.data);
    return ok(product);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Delete a product
 */
const deleteProduct = async (id: string): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/products/${id}`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Product service instance
 */
export const productService: ProductService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteProduct,
};

// Named exports for convenience
export const getAllProducts = getAll;
export const getProductById = getById;
export const createProduct = create;
export const updateProduct = update;
export { deleteProduct };
