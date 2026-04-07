/**
 * Stock items mappers
 * Transform between Sequelize models and DTOs
 */

import { StockItemModel } from '@bakery-cms/database';
import { StockItemStatus, StockUnitType } from '@bakery-cms/common';
import {
  StockItemResponseDto,
  CreateStockItemDto,
  UpdateStockItemDto,
} from '../dto/stock-items.dto';

const canonicalUnitOfMeasureByType: Record<StockUnitType, string> = {
  [StockUnitType.PIECE]: 'piece',
  [StockUnitType.WEIGHT]: 'gram',
};

const toCanonicalUnitOfMeasure = (unitType: StockUnitType): string =>
  canonicalUnitOfMeasureByType[unitType];

/**
 * Map StockItemModel to StockItemResponseDto
 * Pure function that transforms database entity to API response
 */
export const toStockItemResponseDto = (model: StockItemModel): StockItemResponseDto => {
  const unitType = (model.unitType as StockUnitType) ?? StockUnitType.PIECE;

  return {
    id: model.id,
    name: model.name,
    description: model.description,
    unitType,
    unitOfMeasure: toCanonicalUnitOfMeasure(unitType),
    currentQuantity: Number(model.currentQuantity),
    reorderThreshold: model.reorderThreshold !== null ? Number(model.reorderThreshold) : null,
    status: model.status as StockItemStatus,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map array of StockItemModel to array of StockItemResponseDto
 * Pure function for batch transformation
 */
export const toStockItemResponseDtoList = (
  models: StockItemModel[]
): StockItemResponseDto[] => {
  return models.map(toStockItemResponseDto);
};

/**
 * Map CreateStockItemDto to StockItemModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toStockItemCreationAttributes = (
  dto: CreateStockItemDto
): Partial<StockItemModel> => {
  const unitType = dto.unitType ?? StockUnitType.PIECE;

  return {
    name: dto.name,
    description: dto.description ?? null,
    unitType,
    unitOfMeasure: toCanonicalUnitOfMeasure(unitType),
    currentQuantity: dto.currentQuantity ?? 0,
    reorderThreshold: dto.reorderThreshold ?? null,
  };
};

/**
 * Map UpdateStockItemDto to StockItemModel update attributes
 * Pure function that prepares data for model update
 * Only includes fields that are defined in the DTO
 */
export const toStockItemUpdateAttributes = (
  dto: UpdateStockItemDto
): Partial<StockItemModel> => {
  const attributes: Partial<StockItemModel> = {};

  if (dto.name !== undefined) {
    attributes.name = dto.name;
  }
  if (dto.description !== undefined) {
    attributes.description = dto.description ?? null;
  }
  if (dto.unitType !== undefined) {
    attributes.unitType = dto.unitType;
    attributes.unitOfMeasure = toCanonicalUnitOfMeasure(dto.unitType);
  }
  if (dto.reorderThreshold !== undefined) {
    attributes.reorderThreshold = dto.reorderThreshold ?? null;
  }

  return attributes;
};
