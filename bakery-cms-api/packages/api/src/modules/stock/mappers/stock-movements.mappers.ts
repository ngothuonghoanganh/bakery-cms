/**
 * Stock movements mappers
 * Transform between Sequelize models and DTOs
 */

import {
  StockMovementModel,
  StockItemModel,
  UserModel,
  BrandModel,
} from '@bakery-cms/database';
import { MovementType } from '@bakery-cms/common';
import { StockMovementResponseDto } from '../dto/stock-movements.dto';

/**
 * Map StockMovementModel to StockMovementResponseDto
 * Pure function that transforms database entity to API response
 * Includes related stock item name and user name
 */
export const toStockMovementResponseDto = (
  model: StockMovementModel & {
    stockItem?: StockItemModel;
    user?: UserModel;
    brand?: BrandModel;
  }
): StockMovementResponseDto => {
  return {
    id: model.id,
    stockItemId: model.stockItemId,
    stockItemName: model.stockItem?.name ?? 'Unknown',
    brandId: (model as any).brandId ?? null,
    brandName: model.brand?.name ?? null,
    type: model.type as MovementType,
    quantity: Number(model.quantity),
    previousQuantity: Number(model.previousQuantity),
    newQuantity: Number(model.newQuantity),
    reason: model.reason,
    referenceType: model.referenceType,
    referenceId: model.referenceId,
    userId: model.userId,
    userName: model.user ? `${model.user.firstName} ${model.user.lastName}` : 'Unknown',
    createdAt: model.createdAt.toISOString(),
  };
};

/**
 * Map array of StockMovementModel to array of StockMovementResponseDto
 * Pure function for batch transformation
 */
export const toStockMovementResponseDtoList = (
  models: Array<StockMovementModel & {
    stockItem?: StockItemModel;
    user?: UserModel;
    brand?: BrandModel;
  }>
): StockMovementResponseDto[] => {
  return models.map(toStockMovementResponseDto);
};
