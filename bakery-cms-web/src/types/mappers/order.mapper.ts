/**
 * Order mappers
 * Transform API responses to domain models
 */

import type {
  OrderAPIResponse,
  OrderItemAPIResponse,
  PaginatedOrdersAPIResponse,
} from '@/types/api/order.api';
import type { Order, OrderItem, PaginatedOrders } from '@/types/models/order.model';
import type {  OrderStatusType as OrderStatus, OrderTypeType as OrderType, BusinessModelType as BusinessModel } from '@/types/models/order.model';

/**
 * Map API response to OrderItem domain model
 */
export const mapOrderItemFromAPI = (apiItem: OrderItemAPIResponse): OrderItem => ({
  id: apiItem.id,
  orderId: apiItem.orderId,
  productId: apiItem.productId,
  quantity: apiItem.quantity,
  unitPrice: apiItem.unitPrice,
  subtotal: apiItem.subtotal,
  createdAt: new Date(apiItem.createdAt),
  updatedAt: new Date(apiItem.updatedAt),
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
  status: apiOrder.status as OrderStatus,
  customerName: apiOrder.customerName,
  customerPhone: apiOrder.customerPhone,
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
