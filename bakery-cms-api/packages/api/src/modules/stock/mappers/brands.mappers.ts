/**
 * Brands mappers
 * Transform between Sequelize models and DTOs
 */

import { BrandModel, StockItemBrandModel } from '@bakery-cms/database';
import {
  BrandResponseDto,
  CreateBrandDto,
  UpdateBrandDto,
} from '../dto/brands.dto';
import { StockItemBrandResponseDto, AddBrandToStockItemDto, UpdateStockItemBrandDto } from '../dto/stock-items.dto';

/**
 * Map BrandModel to BrandResponseDto
 * Pure function that transforms database entity to API response
 */
export const toBrandResponseDto = (model: BrandModel): BrandResponseDto => {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    isActive: model.isActive,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map array of BrandModel to array of BrandResponseDto
 * Pure function for batch transformation
 */
export const toBrandResponseDtoList = (
  models: BrandModel[]
): BrandResponseDto[] => {
  return models.map(toBrandResponseDto);
};

/**
 * Map CreateBrandDto to BrandModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toBrandCreationAttributes = (
  dto: CreateBrandDto
): Partial<BrandModel> => {
  return {
    name: dto.name,
    description: dto.description ?? null,
    isActive: dto.isActive ?? true,
  };
};

/**
 * Map UpdateBrandDto to BrandModel update attributes
 * Pure function that prepares data for model update
 * Only includes fields that are defined in the DTO
 */
export const toBrandUpdateAttributes = (
  dto: UpdateBrandDto
): Partial<BrandModel> => {
  const attributes: Partial<BrandModel> = {};

  if (dto.name !== undefined) {
    attributes.name = dto.name;
  }
  if (dto.description !== undefined) {
    attributes.description = dto.description ?? null;
  }
  if (dto.isActive !== undefined) {
    attributes.isActive = dto.isActive;
  }

  return attributes;
};

/**
 * Map StockItemBrandModel to StockItemBrandResponseDto
 * Pure function that transforms junction table entity to API response
 */
export const toStockItemBrandResponseDto = (
  model: StockItemBrandModel,
  brandName: string
): StockItemBrandResponseDto => {
  return {
    id: model.id,
    stockItemId: model.stockItemId,
    brandId: model.brandId,
    brandName,
    priceBeforeTax: Number(model.priceBeforeTax),
    priceAfterTax: Number(model.priceAfterTax),
    isPreferred: model.isPreferred,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map AddBrandToStockItemDto to StockItemBrandModel creation attributes
 * Pure function that prepares data for junction table creation
 */
export const toStockItemBrandCreationAttributes = (
  stockItemId: string,
  dto: AddBrandToStockItemDto
): Partial<StockItemBrandModel> => {
  return {
    stockItemId,
    brandId: dto.brandId,
    priceBeforeTax: dto.priceBeforeTax,
    priceAfterTax: dto.priceAfterTax,
    isPreferred: dto.isPreferred ?? false,
  };
};

/**
 * Map UpdateStockItemBrandDto to StockItemBrandModel update attributes
 * Pure function that prepares data for junction table update
 */
export const toStockItemBrandUpdateAttributes = (
  dto: UpdateStockItemBrandDto
): Partial<StockItemBrandModel> => {
  const attributes: Partial<StockItemBrandModel> = {};

  if (dto.priceBeforeTax !== undefined) {
    attributes.priceBeforeTax = dto.priceBeforeTax;
  }
  if (dto.priceAfterTax !== undefined) {
    attributes.priceAfterTax = dto.priceAfterTax;
  }
  if (dto.isPreferred !== undefined) {
    attributes.isPreferred = dto.isPreferred;
  }

  return attributes;
};
