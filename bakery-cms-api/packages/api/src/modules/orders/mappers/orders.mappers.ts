/**
 * Order mappers
 * Transform between Sequelize models and DTOs
 */

import { OrderModel, OrderItemModel, OrderBillModel } from '@bakery-cms/database';
import { OrderStatus, OrderType, BusinessModel } from '@bakery-cms/common';
import {
  OrderResponseDto,
  OrderItemResponseDto,
  CreateOrderDto,
  UpdateOrderDto,
  OrderItemDto,
  OrderExtraFeeDto,
  OrderExtraFeeResponseDto,
  OrderBillSnapshotDto,
  OrderBillResponseDto,
} from '../dto/orders.dto';

const toMoney = (value: number): number => Math.round(value * 100) / 100;

const fallbackExtraFeeId = (name: string, index: number): string => {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  return `extra-${index + 1}-${normalized || 'fee'}`;
};

const toFiniteMoney = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return toMoney(Math.max(numeric, 0));
};

/**
 * Normalize extra fee payload from DTO into stable response shape
 */
export const normalizeOrderExtraFees = (
  fees: readonly OrderExtraFeeDto[] = []
): OrderExtraFeeResponseDto[] => {
  return fees
    .map((fee, index) => {
      const name = String(fee.name ?? '').trim();
      if (!name) {
        return null;
      }

      const id = String(fee.id ?? '').trim() || fallbackExtraFeeId(name, index);

      return {
        id,
        name,
        amount: toFiniteMoney(fee.amount),
      };
    })
    .filter((fee): fee is OrderExtraFeeResponseDto => fee !== null);
};

/**
 * Parse extra fees from persisted order JSON string
 */
export const parseOrderExtraFees = (
  value: string | null
): OrderExtraFeeResponseDto[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeOrderExtraFees(
      parsed.map((item) => {
        if (!item || typeof item !== 'object') {
          return { name: '', amount: 0 };
        }

        const raw = item as Record<string, unknown>;
        return {
          id: typeof raw['id'] === 'string' ? raw['id'] : undefined,
          name: typeof raw['name'] === 'string' ? raw['name'] : '',
          amount: toFiniteMoney(raw['amount']),
        };
      })
    );
  } catch {
    return [];
  }
};

/**
 * Map OrderItemModel to OrderItemResponseDto
 * Pure function that transforms database entity to API response
 */
export const toOrderItemResponseDto = (
  model: OrderItemModel
): OrderItemResponseDto => {
  const associatedProduct = (
    model as unknown as { product?: { name?: string | null; productCode?: string | null } }
  ).product;

  return {
    id: model.id,
    orderId: model.orderId,
    productId: model.productId,
    productCode: model.productCode ?? associatedProduct?.productCode ?? null,
    productName: model.productName ?? associatedProduct?.name ?? null,
    quantity: model.quantity,
    unitPrice: Number(model.unitPrice),
    subtotal: Number(model.subtotal),
    notes: model.notes,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
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
  const extraFees = parseOrderExtraFees(model.extraFees ?? null);

  return {
    id: model.id,
    orderNumber: model.orderNumber,
    orderType: model.orderType as OrderType,
    businessModel: model.businessModel as BusinessModel,
    totalAmount: Number(model.totalAmount),
    extraAmount: Number(model.extraAmount ?? 0),
    extraFees,
    hasPendingExtraPayment: Boolean(model.hasPendingExtraPayment),
    status: model.status as OrderStatus,
    customerName: model.customerName,
    customerPhone: model.customerPhone,
    customerAddress: model.customerAddress,
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
  const extraFees = normalizeOrderExtraFees(dto.extraFees ?? []);

  return {
    orderNumber,
    orderType: dto.orderType,
    businessModel: dto.businessModel,
    totalAmount: 0, // Will be calculated from items
    extraAmount: calculateOrderExtraFeesTotal(extraFees),
    extraFees: JSON.stringify(extraFees),
    hasPendingExtraPayment: false,
    status: OrderStatus.DRAFT,
    customerName: dto.customerName ?? null,
    customerPhone: dto.customerPhone ?? null,
    customerAddress: dto.customerAddress ?? null,
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
  if (dto.customerAddress !== undefined) {
    attributes.customerAddress = dto.customerAddress ?? null;
  }
  if (dto.notes !== undefined) {
    attributes.notes = dto.notes ?? null;
  }
  if (dto.extraFees !== undefined) {
    const extraFees = normalizeOrderExtraFees(dto.extraFees);
    attributes.extraFees = JSON.stringify(extraFees);
    attributes.extraAmount = calculateOrderExtraFeesTotal(extraFees);
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
  return calculateOrderTotalWithExtraFees(items, []);
};

/**
 * Calculate total amount from order items only
 */
export const calculateOrderItemsTotal = (items: OrderItemDto[]): number => {
  return toMoney(items.reduce((total, item) => total + item.subtotal, 0));
};

/**
 * Calculate total amount from order extras only
 */
export const calculateOrderExtraFeesTotal = (
  extraFees: readonly Pick<OrderExtraFeeResponseDto, 'amount'>[]
): number => {
  return toMoney(extraFees.reduce((total, fee) => total + toFiniteMoney(fee.amount), 0));
};

/**
 * Calculate grand total amount from items and extra fees
 */
export const calculateOrderTotalWithExtraFees = (
  items: OrderItemDto[],
  extraFees: readonly Pick<OrderExtraFeeResponseDto, 'amount'>[]
): number => {
  return toMoney(calculateOrderItemsTotal(items) + calculateOrderExtraFeesTotal(extraFees));
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

/**
 * Build immutable bill snapshot from order and items
 */
export const toOrderBillSnapshotDto = (
  model: OrderModel,
  items: OrderItemModel[] = []
): OrderBillSnapshotDto => {
  const extraFees = parseOrderExtraFees(model.extraFees ?? null);

  return {
    orderId: model.id,
    orderNumber: model.orderNumber,
    orderType: model.orderType as OrderType,
    businessModel: model.businessModel as BusinessModel,
    totalAmount: Number(model.totalAmount),
    extraAmount: Number(model.extraAmount ?? 0),
    extraFees,
    hasPendingExtraPayment: Boolean(model.hasPendingExtraPayment),
    status: model.status as OrderStatus,
    customerName: model.customerName,
    customerPhone: model.customerPhone,
    customerAddress: model.customerAddress,
    notes: model.notes,
    confirmedAt: model.confirmedAt ? model.confirmedAt.toISOString() : null,
    createdAt: model.createdAt.toISOString(),
    items: items.map((item) => ({
      productId: item.productId,
      productCode:
        item.productCode ??
        ((item as unknown as { product?: { productCode?: string | null } }).product?.productCode ??
          null),
      productName:
        item.productName ??
        ((item as unknown as { product?: { name?: string | null } }).product?.name ?? null),
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      notes: item.notes,
    })),
  };
};

/**
 * Map OrderBillModel to OrderBillResponseDto
 */
export const toOrderBillResponseDto = (
  model: OrderBillModel
): OrderBillResponseDto => {
  return {
    id: model.id,
    orderId: model.orderId,
    billNumber: model.billNumber,
    version: model.version,
    status: model.status,
    snapshot: model.snapshot as unknown as OrderBillSnapshotDto,
    voidReason: model.voidReason,
    voidedAt: model.voidedAt ? model.voidedAt.toISOString() : null,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};
