/**
 * Product-stock mappers
 * Transform between Sequelize models and DTOs
 */

import { ProductStockItemModel, StockItemModel, BrandModel } from '@bakery-cms/database';
import {
  ProductStockItemResponseDto,
  AddStockItemToProductDto,
  UpdateProductStockItemDto,
  ProductCostBreakdownItem,
} from '../dto/product-stock.dto';

/**
 * Map ProductStockItemModel to ProductStockItemResponseDto
 * Pure function that transforms database entity to API response
 */
export const toProductStockItemResponseDto = (
  model: ProductStockItemModel & {
    stockItem?: StockItemModel;
    preferredBrand?: BrandModel;
  }
): ProductStockItemResponseDto => {
  return {
    id: model.id,
    productId: model.productId,
    stockItemId: model.stockItemId,
    stockItemName: model.stockItem?.name ?? '',
    unitOfMeasure: model.stockItem?.unitOfMeasure ?? '',
    quantity: Number(model.quantity),
    preferredBrandId: model.preferredBrandId,
    preferredBrandName: model.preferredBrand?.name ?? null,
    notes: model.notes,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map array of ProductStockItemModel to array of ProductStockItemResponseDto
 * Pure function for batch transformation
 */
export const toProductStockItemResponseDtoList = (
  models: (ProductStockItemModel & {
    stockItem?: StockItemModel;
    preferredBrand?: BrandModel;
  })[]
): ProductStockItemResponseDto[] => {
  return models.map(toProductStockItemResponseDto);
};

/**
 * Map AddStockItemToProductDto to ProductStockItemModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toProductStockItemCreationAttributes = (
  productId: string,
  dto: AddStockItemToProductDto
): Partial<ProductStockItemModel> => {
  return {
    productId,
    stockItemId: dto.stockItemId,
    quantity: dto.quantity,
    preferredBrandId: dto.preferredBrandId ?? null,
    notes: dto.notes ?? null,
  };
};

/**
 * Map UpdateProductStockItemDto to ProductStockItemModel update attributes
 * Pure function that prepares data for model update
 * Only includes fields that are defined in the DTO
 */
export const toProductStockItemUpdateAttributes = (
  dto: UpdateProductStockItemDto
): Partial<ProductStockItemModel> => {
  const attributes: Partial<ProductStockItemModel> = {};

  if (dto.quantity !== undefined) {
    attributes.quantity = dto.quantity;
  }
  if (dto.preferredBrandId !== undefined) {
    attributes.preferredBrandId = dto.preferredBrandId ?? null;
  }
  if (dto.notes !== undefined) {
    attributes.notes = dto.notes ?? null;
  }

  return attributes;
};

/**
 * Map cost calculation data to ProductCostBreakdownItem
 * Pure function that transforms cost data to API response
 */
export const toProductCostBreakdownItem = (
  stockItem: StockItemModel,
  quantity: number,
  brand: BrandModel | null,
  unitPrice: number
): ProductCostBreakdownItem => {
  return {
    stockItemId: stockItem.id,
    stockItemName: stockItem.name,
    quantity: Number(quantity),
    unitOfMeasure: stockItem.unitOfMeasure,
    brandId: brand?.id ?? null,
    brandName: brand?.name ?? null,
    unitPrice: Number(unitPrice),
    totalCost: Number(quantity) * Number(unitPrice),
  };
};
