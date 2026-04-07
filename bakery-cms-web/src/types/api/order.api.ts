/**
 * API response types for Order endpoints
 */

import type { PaymentAPIResponse, VietQRDataAPIResponse } from './payment.api';
import type { SaleUnitType } from '@bakery-cms/common';

export type OrderItemAPIResponse = {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly productCode: string | null;
  readonly productName: string | null;
  readonly saleUnitType: SaleUnitType;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type OrderExtraFeeAPIResponse = {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
};

export type OrderAPIResponse = {
  readonly id: string;
  readonly orderNumber: string;
  readonly orderType: string;
  readonly businessModel: string;
  readonly totalAmount: number;
  readonly extraAmount: number;
  readonly extraFees: readonly OrderExtraFeeAPIResponse[];
  readonly hasPendingExtraPayment: boolean;
  readonly status: string;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly customerAddress: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly confirmedAt: string | null;
  readonly items?: readonly OrderItemAPIResponse[];
};

export type PaginatedOrdersAPIResponse = {
  readonly data: readonly OrderAPIResponse[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export type CreateOrderItemRequest = {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly saleUnitType?: SaleUnitType;
  readonly notes?: string;
};

export type CreateOrderRequest = {
  readonly orderType: string;
  readonly businessModel: string;
  readonly items: readonly CreateOrderItemRequest[];
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly customerAddress?: string;
  readonly notes?: string;
  readonly extraFees?: readonly {
    readonly id: string;
    readonly name?: string;
    readonly amount: number;
  }[];
};

export type UpdateOrderRequest = {
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly customerAddress?: string;
  readonly notes?: string;
  readonly items?: readonly CreateOrderItemRequest[];
  readonly extraFees?: readonly {
    readonly id: string;
    readonly name?: string;
    readonly amount: number;
  }[];
};

export type ConfirmOrderRequest = {
  readonly paymentMethod: string;
  readonly paymentNotes?: string;
  readonly confirmedAt?: string;
};

export type ConfirmOrderAPIResponse = {
  readonly order: OrderAPIResponse;
  readonly payment: PaymentAPIResponse;
  readonly vietqr: VietQRDataAPIResponse | null;
};

export type AddOrderExtrasRequest = {
  readonly extraFees: readonly {
    readonly id: string;
    readonly name?: string;
    readonly amount: number;
  }[];
  readonly paymentMethod?: string;
  readonly paymentNotes?: string;
};

export type AddOrderExtrasAPIResponse = {
  readonly order: OrderAPIResponse;
  readonly payment: PaymentAPIResponse | null;
  readonly vietqr: VietQRDataAPIResponse | null;
};

export type OrderFiltersRequest = {
  readonly status?: string;
  readonly orderType?: string;
  readonly businessModel?: string;
  readonly search?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  // Backward compatibility for legacy filter keys
  readonly customerPhone?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
};

export type OrderBillSnapshotItemAPIResponse = {
  readonly productId: string;
  readonly productCode: string | null;
  readonly productName: string | null;
  readonly saleUnitType: SaleUnitType;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly notes: string | null;
};

export type OrderBillSnapshotAPIResponse = {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly orderType: string;
  readonly businessModel: string;
  readonly totalAmount: number;
  readonly extraAmount: number;
  readonly extraFees: readonly OrderExtraFeeAPIResponse[];
  readonly hasPendingExtraPayment: boolean;
  readonly status: string;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly customerAddress: string | null;
  readonly notes: string | null;
  readonly confirmedAt: string | null;
  readonly createdAt: string;
  readonly items: readonly OrderBillSnapshotItemAPIResponse[];
};

export type OrderBillAPIResponse = {
  readonly id: string;
  readonly orderId: string;
  readonly billNumber: string;
  readonly version: number;
  readonly status: 'active' | 'voided';
  readonly snapshot: OrderBillSnapshotAPIResponse;
  readonly voidReason: string | null;
  readonly voidedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type SaveOrderBillRequest = {
  readonly confirmSave: true;
};

export type VoidOrderBillRequest = {
  readonly reason: string;
};
