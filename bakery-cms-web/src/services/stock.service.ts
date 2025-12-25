
/**
 * Stock service
 * Handles all stock-related API calls with Result type pattern
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  StockItemAPIResponse,
  PaginatedStockItemsAPIResponse,
  CreateStockItemRequest,
  UpdateStockItemRequest,
  StockItemFiltersRequest,
  ReceiveStockRequest,
  AdjustStockRequest,
  BrandAPIResponse,
  PaginatedBrandsAPIResponse,
  CreateBrandRequest,
  UpdateBrandRequest,
  BrandFiltersRequest,
  StockItemBrandAPIResponse,
  AddBrandToStockItemRequest,
  UpdateStockItemBrandRequest,
  ProductStockItemAPIResponse,
  ProductRecipeAPIResponse,
  ProductCostAPIResponse,
  AddStockItemToProductRequest,
  UpdateProductStockItemRequest,
  StockMovementAPIResponse,
  PaginatedStockMovementsAPIResponse,
  StockMovementFiltersRequest,
} from '@/types/api/stock.api';
import type {
  StockItem,
  PaginatedStockItems,
  Brand,
  PaginatedBrands,
  StockItemBrand,
  ProductStockItem,
  ProductRecipe,
  ProductCost,
  StockMovement,
  PaginatedStockMovements,
} from '@/types/models/stock.model';
import {
  mapStockItemFromAPI,
  mapPaginatedStockItemsFromAPI,
  mapBrandFromAPI,
  mapPaginatedBrandsFromAPI,
  mapStockItemBrandFromAPI,
  mapProductStockItemFromAPI,
  mapProductRecipeFromAPI,
  mapProductCostFromAPI,
  mapStockMovementFromAPI,
  mapPaginatedStockMovementsFromAPI,
} from '@/types/mappers/stock.mapper';
import type { AxiosResponse } from 'axios';

/**
 * Stock service type definition
 */
export type StockService = {
  // Stock Items
  readonly getAllStockItems: (
    filters?: StockItemFiltersRequest
  ) => Promise<Result<PaginatedStockItems, AppError>>;
  readonly getStockItemById: (id: string) => Promise<Result<StockItem | null, AppError>>;
  readonly createStockItem: (data: CreateStockItemRequest) => Promise<Result<StockItem, AppError>>;
  readonly updateStockItem: (
    id: string,
    data: UpdateStockItemRequest
  ) => Promise<Result<StockItem, AppError>>;
  readonly deleteStockItem: (id: string) => Promise<Result<boolean, AppError>>;
  readonly restoreStockItem: (id: string) => Promise<Result<StockItem, AppError>>;
  readonly receiveStock: (
    id: string,
    data: ReceiveStockRequest
  ) => Promise<Result<StockItem, AppError>>;
  readonly adjustStock: (
    id: string,
    data: AdjustStockRequest
  ) => Promise<Result<StockItem, AppError>>;

  // Brands
  readonly getAllBrands: (
    filters?: BrandFiltersRequest
  ) => Promise<Result<PaginatedBrands, AppError>>;
  readonly getBrandById: (id: string) => Promise<Result<Brand | null, AppError>>;
  readonly createBrand: (data: CreateBrandRequest) => Promise<Result<Brand, AppError>>;
  readonly updateBrand: (
    id: string,
    data: UpdateBrandRequest
  ) => Promise<Result<Brand, AppError>>;
  readonly deleteBrand: (id: string) => Promise<Result<boolean, AppError>>;
  readonly restoreBrand: (id: string) => Promise<Result<Brand, AppError>>;

  // Stock Item Brands
  readonly getStockItemBrands: (stockItemId: string) => Promise<Result<StockItemBrand[], AppError>>;
  readonly addBrandToStockItem: (
    stockItemId: string,
    data: AddBrandToStockItemRequest
  ) => Promise<Result<StockItemBrand, AppError>>;
  readonly updateStockItemBrand: (
    stockItemId: string,
    brandId: string,
    data: UpdateStockItemBrandRequest
  ) => Promise<Result<StockItemBrand, AppError>>;
  readonly removeBrandFromStockItem: (
    stockItemId: string,
    brandId: string
  ) => Promise<Result<boolean, AppError>>;
  readonly setPreferredBrand: (
    stockItemId: string,
    brandId: string
  ) => Promise<Result<boolean, AppError>>;

  // Product Stock Items (Recipe Management)
  readonly getProductRecipe: (productId: string) => Promise<Result<ProductRecipe, AppError>>;
  readonly addStockItemToProduct: (
    productId: string,
    data: AddStockItemToProductRequest
  ) => Promise<Result<ProductStockItem, AppError>>;
  readonly updateProductStockItem: (
    productId: string,
    stockItemId: string,
    data: UpdateProductStockItemRequest
  ) => Promise<Result<ProductStockItem, AppError>>;
  readonly removeStockItemFromProduct: (
    productId: string,
    stockItemId: string
  ) => Promise<Result<boolean, AppError>>;
  readonly getProductCost: (productId: string) => Promise<Result<ProductCost, AppError>>;
  readonly checkStockItemDeletionProtection: (
    stockItemId: string
  ) => Promise<Result<{ canDelete: boolean; productCount: number }, AppError>>;

  // Stock Movements (Audit Trail)
  readonly getStockMovements: (
    filters?: StockMovementFiltersRequest
  ) => Promise<Result<PaginatedStockMovements, AppError>>;
  readonly getStockMovementById: (id: string) => Promise<Result<StockMovement | null, AppError>>;
};

/**
 * Get all stock items with optional filters
 */
const getAllStockItems = async (
  filters?: StockItemFiltersRequest
): Promise<Result<PaginatedStockItems, AppError>> => {
  try {
    const response = await apiClient.get<PaginatedStockItemsAPIResponse>('/stock/stock-items', {
      params: filters,
    });
    const paginatedStockItems = mapPaginatedStockItemsFromAPI(response.data);
    return ok(paginatedStockItems);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get a stock item by ID
 */
const getStockItemById = async (id: string): Promise<Result<StockItem | null, AppError>> => {
  try {
    const response = await apiClient.get<AxiosResponse<StockItemAPIResponse>>(
      `/stock/stock-items/${id}`
    );
    if (!response?.data?.data) return ok(null);

    const stockItem = mapStockItemFromAPI(response?.data?.data);
    return ok(stockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Create a new stock item
 */
const createStockItem = async (
  data: CreateStockItemRequest
): Promise<Result<StockItem, AppError>> => {
  try {
    const response = await apiClient.post<StockItemAPIResponse>('/stock/stock-items', data);
    const stockItem = mapStockItemFromAPI(response.data);
    return ok(stockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Update an existing stock item
 */
const updateStockItem = async (
  id: string,
  data: UpdateStockItemRequest
): Promise<Result<StockItem, AppError>> => {
  try {
    const response = await apiClient.patch<StockItemAPIResponse>(
      `/stock/stock-items/${id}`,
      data
    );
    const stockItem = mapStockItemFromAPI(response.data);
    return ok(stockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Delete a stock item (soft delete)
 */
const deleteStockItem = async (id: string): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/stock/stock-items/${id}`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Restore a soft-deleted stock item
 */
const restoreStockItem = async (id: string): Promise<Result<StockItem, AppError>> => {
  try {
    const response = await apiClient.post<StockItemAPIResponse>(
      `/stock/stock-items/${id}/restore`
    );
    const stockItem = mapStockItemFromAPI(response.data);
    return ok(stockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Receive stock (add to inventory)
 */
const receiveStock = async (
  id: string,
  data: ReceiveStockRequest
): Promise<Result<StockItem, AppError>> => {
  try {
    const response = await apiClient.post<StockItemAPIResponse>(
      `/stock/stock-items/${id}/receive`,
      data
    );
    const stockItem = mapStockItemFromAPI(response.data);
    return ok(stockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Adjust stock quantity
 */
const adjustStock = async (
  id: string,
  data: AdjustStockRequest
): Promise<Result<StockItem, AppError>> => {
  try {
    const response = await apiClient.post<StockItemAPIResponse>(
      `/stock/stock-items/${id}/adjust`,
      data
    );
    const stockItem = mapStockItemFromAPI(response.data);
    return ok(stockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get all brands with optional filters
 */
const getAllBrands = async (
  filters?: BrandFiltersRequest
): Promise<Result<PaginatedBrands, AppError>> => {
  try {
    const response = await apiClient.get<PaginatedBrandsAPIResponse>('/stock/brands', {
      params: filters,
    });
    const paginatedBrands = mapPaginatedBrandsFromAPI(response.data);
    return ok(paginatedBrands);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get a brand by ID
 */
const getBrandById = async (id: string): Promise<Result<Brand | null, AppError>> => {
  try {
    const response = await apiClient.get<AxiosResponse<BrandAPIResponse>>(
      `/stock/brands/${id}`
    );
    if (!response?.data?.data) return ok(null);

    const brand = mapBrandFromAPI(response?.data?.data);
    return ok(brand);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Create a new brand
 */
const createBrand = async (
  data: CreateBrandRequest
): Promise<Result<Brand, AppError>> => {
  try {
    const response = await apiClient.post<BrandAPIResponse>('/stock/brands', data);
    const brand = mapBrandFromAPI(response.data);
    return ok(brand);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Update an existing brand
 */
const updateBrand = async (
  id: string,
  data: UpdateBrandRequest
): Promise<Result<Brand, AppError>> => {
  try {
    const response = await apiClient.patch<BrandAPIResponse>(
      `/stock/brands/${id}`,
      data
    );
    const brand = mapBrandFromAPI(response.data);
    return ok(brand);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Delete a brand (soft delete)
 */
const deleteBrand = async (id: string): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/stock/brands/${id}`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Restore a soft-deleted brand
 */
const restoreBrand = async (id: string): Promise<Result<Brand, AppError>> => {
  try {
    const response = await apiClient.post<BrandAPIResponse>(
      `/stock/brands/${id}/restore`
    );
    const brand = mapBrandFromAPI(response.data);
    return ok(brand);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get all brands associated with a stock item
 */
const getStockItemBrands = async (
  stockItemId: string
): Promise<Result<StockItemBrand[], AppError>> => {
  try {
    const response = await apiClient.get<AxiosResponse<StockItemBrandAPIResponse[]>>(
      `/stock/stock-items/${stockItemId}/brands`
    );
    if (!response?.data?.data) return ok([]);

    const brands = response.data.data.map(mapStockItemBrandFromAPI);
    return ok(brands);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Add brand to stock item with pricing
 */
const addBrandToStockItem = async (
  stockItemId: string,
  data: AddBrandToStockItemRequest
): Promise<Result<StockItemBrand, AppError>> => {
  try {
    const response = await apiClient.post<StockItemBrandAPIResponse>(
      `/stock/stock-items/${stockItemId}/brands`,
      data
    );
    const stockItemBrand = mapStockItemBrandFromAPI(response.data);
    return ok(stockItemBrand);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Update stock item brand pricing
 */
const updateStockItemBrand = async (
  stockItemId: string,
  brandId: string,
  data: UpdateStockItemBrandRequest
): Promise<Result<StockItemBrand, AppError>> => {
  try {
    const response = await apiClient.patch<StockItemBrandAPIResponse>(
      `/stock/stock-items/${stockItemId}/brands/${brandId}`,
      data
    );
    const stockItemBrand = mapStockItemBrandFromAPI(response.data);
    return ok(stockItemBrand);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Remove brand from stock item
 */
const removeBrandFromStockItem = async (
  stockItemId: string,
  brandId: string
): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/stock/stock-items/${stockItemId}/brands/${brandId}`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Set preferred brand for stock item
 */
const setPreferredBrand = async (
  stockItemId: string,
  brandId: string
): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.post(`/stock/stock-items/${stockItemId}/brands/${brandId}/set-preferred`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get product recipe (all stock items linked to product)
 */
const getProductRecipe = async (productId: string): Promise<Result<ProductRecipe, AppError>> => {
  try {
    const response = await apiClient.get<AxiosResponse<ProductRecipeAPIResponse>>(
      `/stock/products/${productId}/stock-items`
    );
    const recipe = mapProductRecipeFromAPI(response.data.data);
    return ok(recipe);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Add stock item to product (add ingredient to recipe)
 */
const addStockItemToProduct = async (
  productId: string,
  data: AddStockItemToProductRequest
): Promise<Result<ProductStockItem, AppError>> => {
  try {
    const response = await apiClient.post<AxiosResponse<ProductStockItemAPIResponse>>(
      `/stock/products/${productId}/stock-items`,
      data
    );
    const productStockItem = mapProductStockItemFromAPI(response.data.data);
    return ok(productStockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Update product stock item (quantity, preferred brand, notes)
 */
const updateProductStockItem = async (
  productId: string,
  stockItemId: string,
  data: UpdateProductStockItemRequest
): Promise<Result<ProductStockItem, AppError>> => {
  try {
    const response = await apiClient.patch<AxiosResponse<ProductStockItemAPIResponse>>(
      `/stock/products/${productId}/stock-items/${stockItemId}`,
      data
    );
    const productStockItem = mapProductStockItemFromAPI(response.data.data);
    return ok(productStockItem);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Remove stock item from product (remove ingredient from recipe)
 */
const removeStockItemFromProduct = async (
  productId: string,
  stockItemId: string
): Promise<Result<boolean, AppError>> => {
  try {
    await apiClient.delete(`/stock/products/${productId}/stock-items/${stockItemId}`);
    return ok(true);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get product cost calculation
 */
const getProductCost = async (productId: string): Promise<Result<ProductCost, AppError>> => {
  try {
    const response = await apiClient.get<AxiosResponse<ProductCostAPIResponse>>(
      `/stock/products/${productId}/cost`
    );
    const cost = mapProductCostFromAPI(response.data.data);
    return ok(cost);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Check if stock item can be deleted (deletion protection)
 */
const checkStockItemDeletionProtection = async (
  stockItemId: string
): Promise<Result<{ canDelete: boolean; productCount: number }, AppError>> => {
  try {
    const response = await apiClient.get<
      AxiosResponse<{ canDelete: boolean; productCount: number }>
    >(`/stock/stock-items/${stockItemId}/deletion-protection`);
    return ok(response.data.data);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get all stock movements with optional filters
 */
const getStockMovements = async (
  filters?: StockMovementFiltersRequest
): Promise<Result<PaginatedStockMovements, AppError>> => {
  try {
    const response = await apiClient.get<
      AxiosResponse<PaginatedStockMovementsAPIResponse>
    >('/stock/stock-movements', { params: filters });
    return ok(mapPaginatedStockMovementsFromAPI(response.data.data));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get stock movement by ID
 */
const getStockMovementById = async (
  id: string
): Promise<Result<StockMovement | null, AppError>> => {
  try {
    const response = await apiClient.get<
      AxiosResponse<StockMovementAPIResponse>
    >(`/stock/stock-movements/${id}`);
    return ok(mapStockMovementFromAPI(response.data.data));
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Stock service instance
 */
export const stockService: StockService = {
  // Stock Items
  getAllStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  restoreStockItem,
  receiveStock,
  adjustStock,

  // Brands
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  restoreBrand,

  // Stock Item Brands
  getStockItemBrands,
  addBrandToStockItem,
  updateStockItemBrand,
  removeBrandFromStockItem,
  setPreferredBrand,

  // Product Stock Items (Recipe Management)
  getProductRecipe,
  addStockItemToProduct,
  updateProductStockItem,
  removeStockItemFromProduct,
  getProductCost,
  checkStockItemDeletionProtection,

  // Stock Movements (Audit Trail)
  getStockMovements,
  getStockMovementById,
};

// Named exports for convenience
export {
  // Stock Items
  getAllStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  restoreStockItem,
  receiveStock,
  adjustStock,

  // Brands
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  restoreBrand,

  // Stock Item Brands
  getStockItemBrands,
  addBrandToStockItem,
  updateStockItemBrand,
  removeBrandFromStockItem,
  setPreferredBrand,

  // Product Stock Items (Recipe Management)
  getProductRecipe,
  addStockItemToProduct,
  updateProductStockItem,
  removeStockItemFromProduct,
  getProductCost,
  checkStockItemDeletionProtection,

  // Stock Movements (Audit Trail)
  getStockMovements,
  getStockMovementById,
};
