/**
 * Order mappers
 * Transform between Sequelize models and DTOs
 */

import { OrderModel, OrderItemModel } from '@bakery-cms/database';
import { OrderStatus, OrderType, BusinessModel } from '@bakery-cms/common';
import {
  OrderResponseDto,
  OrderItemResponseDto,
  CreateOrderDto,
  UpdateOrderDto,
  OrderItemDto,
} from '../dto/orders.dto';

/**
 * Map OrderItemModel to OrderItemResponseDto
 * Pure function that transforms database entity to API response
 */
export const toOrderItemResponseDto = (
  model: OrderItemModel
): OrderItemResponseDto => {
  return {
    id: model.id,
    productId: model.productId,
    quantity: model.quantity,
    unitPrice: Number(model.unitPrice),
    subtotal: Number(model.subtotal),
    notes: model.notes,
  };
};

/**
 * Map OrderModel to OrderResponseDto
 * Pure function that transforms database entity to API response
 */
export const toOrderResponseDto = (
  model: OrderModel,
  items: OrderItemModel[] = []
): OrderResponseDto => {
  return {
    id: model.id,
    orderNumber: model.orderNumber,
    orderType: model.orderType as OrderType,
    businessModel: model.businessModel as BusinessModel,
    totalAmount: Number(model.totalAmount),
    status: model.status as OrderStatus,
    customerName: model.customerName,
    customerPhone: model.customerPhone,
    notes: model.notes,
    confirmedAt: model.confirmedAt ? model.confirmedAt.toISOString() : null,
    items: items.map(toOrderItemResponseDto),
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map array of OrderModel to array of OrderResponseDto
 * Pure function for batch transformation
 */
export const toOrderResponseDtoList = (
  models: Array<OrderModel & { items?: OrderItemModel[] }>
): OrderResponseDto[] => {
  return models.map((model) =>
    toOrderResponseDto(model, model.items || [])
  );
};

/**
 * Map CreateOrderDto to OrderModel creation attributes
 * Pure function that prepares data for model creation
 */
export const toOrderCreationAttributes = (
  dto: CreateOrderDto,
  orderNumber: string
): Partial<OrderModel> => {
  return {
    orderNumber,
    orderType: dto.orderType,
    businessModel: dto.businessModel,
    totalAmount: 0, // Will be calculated from items
    status: OrderStatus.DRAFT,
    customerName: dto.customerName ?? null,
    customerPhone: dto.customerPhone ?? null,
    notes: dto.notes ?? null,
    confirmedAt: null,
  };
};

/**
 * Map UpdateOrderDto to OrderModel update attributes
 * Pure function that prepares data for model update
 * Only includes fields that are defined in the DTO
 */
export const toOrderUpdateAttributes = (
  dto: UpdateOrderDto
): Partial<OrderModel> => {
  const attributes: Partial<OrderModel> = {};

  if (dto.orderType !== undefined) {
    attributes.orderType = dto.orderType;
  }
  if (dto.businessModel !== undefined) {
    attributes.businessModel = dto.businessModel;
  }
  if (dto.customerName !== undefined) {
    attributes.customerName = dto.customerName ?? null;
  }
  if (dto.customerPhone !== undefined) {
    attributes.customerPhone = dto.customerPhone ?? null;
  }
  if (dto.notes !== undefined) {
    attributes.notes = dto.notes ?? null;
  }

  return attributes;
};

/**
 * Map OrderItemDto to OrderItemModel creation attributes
 * Pure function that prepares data for item creation
 */
export const toOrderItemCreationAttributes = (
  dto: OrderItemDto,
  orderId: string
): Partial<OrderItemModel> => {
  return {
    orderId,
    productId: dto.productId,
    quantity: dto.quantity,
    unitPrice: dto.unitPrice,
    subtotal: dto.subtotal,
    notes: dto.notes ?? null,
  };
};

/**
 * Calculate total amount from order items
 * Pure function for business logic calculation
 */
export const calculateOrderTotal = (items: OrderItemDto[]): number => {
  return items.reduce((total, item) => total + item.subtotal, 0);
};

/**
 * Validate order item subtotal
 * Pure function to ensure subtotal matches quantity * unitPrice
 */
export const validateItemSubtotal = (item: OrderItemDto): boolean => {
  const expectedSubtotal = item.quantity * item.unitPrice;
  const actualSubtotal = item.subtotal;
  // Allow small floating point differences
  return Math.abs(expectedSubtotal - actualSubtotal) < 0.01;
};

/**
 * Validate all order items subtotals
 * Pure function for batch validation
 */
export const validateAllItemsSubtotals = (items: OrderItemDto[]): boolean => {
  return items.every(validateItemSubtotal);
};
