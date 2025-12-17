/**
 * Order DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { OrderStatus, OrderType, BusinessModel } from '@bakery-cms/common';

/**
 * Order item DTO
 * Represents a single line item in an order
 */
export interface OrderItemDto {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

/**
 * Order item response DTO
 * Returned in API responses
 */
export interface OrderItemResponseDto {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

/**
 * Order response DTO
 * Returned in API responses
 */
export interface OrderResponseDto {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  businessModel: BusinessModel;
  totalAmount: number;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  confirmedAt: string | null;
  items: OrderItemResponseDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Create order request DTO
 * Expected in POST /orders
 */
export interface CreateOrderDto {
  orderType: OrderType;
  businessModel: BusinessModel;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items: OrderItemDto[];
}

/**
 * Update order request DTO
 * Expected in PATCH /orders/:id
 */
export interface UpdateOrderDto {
  orderType?: OrderType;
  businessModel?: BusinessModel;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items?: OrderItemDto[];
}

/**
 * Order list query parameters
 * Expected in GET /orders
 */
export interface OrderListQueryDto {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  orderType?: OrderType;
  businessModel?: BusinessModel;
  search?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Paginated order list response
 */
export interface OrderListResponseDto {
  data: OrderResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Confirm order request DTO
 * Expected in POST /orders/:id/confirm
 */
export interface ConfirmOrderDto {
  confirmedAt?: string;
}

/**
 * Cancel order request DTO
 * Expected in POST /orders/:id/cancel
 */
export interface CancelOrderDto {
  reason?: string;
}
