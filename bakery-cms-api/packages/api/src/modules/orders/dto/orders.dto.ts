/**
 * Order DTOs (Data Transfer Objects)
 * Type definitions for API request/response payloads
 */

import { OrderStatus, OrderType, BusinessModel, PaymentMethod } from '@bakery-cms/common';
import { PaymentResponseDto, VietQRResponseDto } from '../../payments/dto/payments.dto';

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
  orderId: string;
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Extra fee line for an order
 */
export interface OrderExtraFeeDto {
  id?: string;
  name: string;
  amount: number;
}

/**
 * Extra fee response DTO
 */
export interface OrderExtraFeeResponseDto {
  id: string;
  name: string;
  amount: number;
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
  extraAmount: number;
  extraFees: OrderExtraFeeResponseDto[];
  hasPendingExtraPayment: boolean;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
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
  customerAddress?: string;
  notes?: string;
  items: OrderItemDto[];
  extraFees?: OrderExtraFeeDto[];
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
  customerAddress?: string;
  notes?: string;
  items?: OrderItemDto[];
  extraFees?: OrderExtraFeeDto[];
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
  paymentMethod: PaymentMethod;
  paymentNotes?: string;
}

/**
 * Confirm order response DTO
 * Returned after order is confirmed and payment is created
 */
export interface ConfirmOrderResponseDto {
  order: OrderResponseDto;
  payment: PaymentResponseDto;
  vietqr: VietQRResponseDto | null;
}

/**
 * Add/update order extras request DTO
 * Expected in POST /orders/:id/extras
 */
export interface AddOrderExtrasDto {
  extraFees: OrderExtraFeeDto[];
  paymentMethod?: PaymentMethod;
  paymentNotes?: string;
}

/**
 * Add/update order extras response DTO
 */
export interface AddOrderExtrasResponseDto {
  order: OrderResponseDto;
  payment: PaymentResponseDto | null;
  vietqr: VietQRResponseDto | null;
}

/**
 * Cancel order request DTO
 * Expected in POST /orders/:id/cancel
 */
export interface CancelOrderDto {
  reason?: string;
}

export interface OrderBillSnapshotItemDto {
  productId: string;
  productCode: string | null;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

export interface OrderBillSnapshotDto {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  businessModel: BusinessModel;
  totalAmount: number;
  extraAmount: number;
  extraFees: OrderExtraFeeResponseDto[];
  hasPendingExtraPayment: boolean;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  notes: string | null;
  confirmedAt: string | null;
  createdAt: string;
  items: OrderBillSnapshotItemDto[];
}

export type OrderBillStatusDto = 'active' | 'voided';

export interface OrderBillResponseDto {
  id: string;
  orderId: string;
  billNumber: string;
  version: number;
  status: OrderBillStatusDto;
  snapshot: OrderBillSnapshotDto;
  voidReason: string | null;
  voidedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveOrderBillDto {
  confirmSave: true;
}

export interface VoidOrderBillDto {
  reason: string;
}
