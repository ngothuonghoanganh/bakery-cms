/**
 * Order mappers
 * Transform API responses to domain models
 */

import type {
  OrderAPIResponse,
  OrderItemAPIResponse,
  OrderExtraFeeAPIResponse,
  PaginatedOrdersAPIResponse,
  OrderBillAPIResponse,
  OrderBillSnapshotAPIResponse,
  OrderBillSnapshotItemAPIResponse,
} from '@/types/api/order.api';
import type {
  Order,
  OrderItem,
  OrderExtraFee,
  PaginatedOrders,
  OrderBill,
  OrderBillSnapshot,
  OrderBillSnapshotItem,
} from '@/types/models/order.model';
import type {
  OrderStatusType as OrderStatus,
  OrderTypeType as OrderType,
  BusinessModelType as BusinessModel,
  SaleUnitTypeType as SaleUnitType,
} from '@/types/models/order.model';
import { SaleUnitType as SaleUnitTypeValue } from '@/types/models/order.model';

/**
 * Map API response to OrderItem domain model
 */
export const mapOrderItemFromAPI = (apiItem: OrderItemAPIResponse): OrderItem => ({
  id: apiItem.id,
  orderId: apiItem.orderId,
  productId: apiItem.productId,
  productCode: apiItem.productCode ?? null,
  productName: apiItem.productName ?? null,
  saleUnitType: (apiItem.saleUnitType as SaleUnitType) ?? SaleUnitTypeValue.PIECE,
  quantity: apiItem.quantity,
  unitPrice: apiItem.unitPrice,
  subtotal: apiItem.subtotal,
  notes: apiItem.notes,
  createdAt: new Date(apiItem.createdAt),
  updatedAt: new Date(apiItem.updatedAt),
});

export const mapOrderExtraFeeFromAPI = (
  apiFee: OrderExtraFeeAPIResponse
): OrderExtraFee => ({
  id: apiFee.id,
  name: apiFee.name,
  amount: apiFee.amount,
});

/**
 * Map API response to Order domain model
 */
export const mapOrderFromAPI = (apiOrder: OrderAPIResponse): Order => ({
  id: apiOrder.id,
  orderNumber: apiOrder.orderNumber,
  orderType: apiOrder.orderType as OrderType,
  businessModel: apiOrder.businessModel as BusinessModel,
  totalAmount: apiOrder.totalAmount,
  extraAmount: apiOrder.extraAmount ?? 0,
  extraFees: (apiOrder.extraFees || []).map(mapOrderExtraFeeFromAPI),
  hasPendingExtraPayment: Boolean(apiOrder.hasPendingExtraPayment),
  status: apiOrder.status as OrderStatus,
  customerName: apiOrder.customerName,
  customerPhone: apiOrder.customerPhone,
  customerAddress: apiOrder.customerAddress,
  notes: apiOrder.notes,
  createdAt: new Date(apiOrder.createdAt),
  updatedAt: new Date(apiOrder.updatedAt),
  confirmedAt: apiOrder.confirmedAt ? new Date(apiOrder.confirmedAt) : null,
  items: apiOrder.items ? apiOrder.items.map(mapOrderItemFromAPI) : undefined,
});

/**
 * Map paginated API response to domain model
 */
export const mapPaginatedOrdersFromAPI = (
  apiResponse: PaginatedOrdersAPIResponse
): PaginatedOrders => ({
  orders: apiResponse.data.map(mapOrderFromAPI),
  total: apiResponse.pagination.total,
  page: apiResponse.pagination.page,
  limit: apiResponse.pagination.limit,
  totalPages: apiResponse.pagination.totalPages,
});

export const mapOrderBillSnapshotItemFromAPI = (
  apiItem: OrderBillSnapshotItemAPIResponse
): OrderBillSnapshotItem => ({
  productId: apiItem.productId,
  productCode: apiItem.productCode ?? null,
  productName: apiItem.productName ?? null,
  saleUnitType:
    (apiItem.saleUnitType as SaleUnitType) ?? SaleUnitTypeValue.PIECE,
  quantity: apiItem.quantity,
  unitPrice: apiItem.unitPrice,
  subtotal: apiItem.subtotal,
  notes: apiItem.notes,
});

export const mapOrderBillSnapshotFromAPI = (
  apiSnapshot: OrderBillSnapshotAPIResponse
): OrderBillSnapshot => ({
  orderId: apiSnapshot.orderId,
  orderNumber: apiSnapshot.orderNumber,
  orderType: apiSnapshot.orderType as OrderType,
  businessModel: apiSnapshot.businessModel as BusinessModel,
  totalAmount: apiSnapshot.totalAmount,
  extraAmount: apiSnapshot.extraAmount ?? 0,
  extraFees: (apiSnapshot.extraFees || []).map(mapOrderExtraFeeFromAPI),
  hasPendingExtraPayment: Boolean(apiSnapshot.hasPendingExtraPayment),
  status: apiSnapshot.status as OrderStatus,
  customerName: apiSnapshot.customerName,
  customerPhone: apiSnapshot.customerPhone,
  customerAddress: apiSnapshot.customerAddress,
  notes: apiSnapshot.notes,
  confirmedAt: apiSnapshot.confirmedAt ? new Date(apiSnapshot.confirmedAt) : null,
  createdAt: new Date(apiSnapshot.createdAt),
  items: apiSnapshot.items.map(mapOrderBillSnapshotItemFromAPI),
});

export const mapOrderBillFromAPI = (apiBill: OrderBillAPIResponse): OrderBill => ({
  id: apiBill.id,
  orderId: apiBill.orderId,
  billNumber: apiBill.billNumber,
  version: apiBill.version,
  status: apiBill.status,
  snapshot: mapOrderBillSnapshotFromAPI(apiBill.snapshot),
  voidReason: apiBill.voidReason,
  voidedAt: apiBill.voidedAt ? new Date(apiBill.voidedAt) : null,
  createdAt: new Date(apiBill.createdAt),
  updatedAt: new Date(apiBill.updatedAt),
});
