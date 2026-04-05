/**
 * Order domain model
 * Represents order and order item data in the frontend domain layer
 */


// Import enums as both types and values from common package
import { OrderStatus, BusinessModel, OrderType } from '@bakery-cms/common';

// Re-export for component usage
export { OrderStatus, BusinessModel, OrderType };

// Also export with Type suffix for backward compatibility
export type {
  OrderStatus as OrderStatusType,
  BusinessModel as BusinessModelType,
  OrderType as OrderTypeType,
}


export type OrderItem = {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly productCode: string | null;
  readonly productName: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type OrderExtraFee = {
  readonly id: string;
  readonly name: string;
  readonly amount: number;
};

export type Order = {
  readonly id: string;
  readonly orderNumber: string;
  readonly orderType: OrderType;
  readonly businessModel: BusinessModel;
  readonly totalAmount: number;
  readonly extraAmount: number;
  readonly extraFees: readonly OrderExtraFee[];
  readonly hasPendingExtraPayment: boolean;
  readonly status: OrderStatus;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly customerAddress: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly confirmedAt: Date | null;
  readonly items?: readonly OrderItem[];
};

export type OrderFilters = {
  readonly status?: OrderStatus;
  readonly orderType?: OrderType;
  readonly businessModel?: BusinessModel;
  readonly customerPhone?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
};

export type PaginatedOrders = {
  readonly orders: readonly Order[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

export type OrderBillStatus = 'active' | 'voided';

export type OrderBillSnapshotItem = {
  readonly productId: string;
  readonly productCode: string | null;
  readonly productName: string | null;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly notes: string | null;
};

export type OrderBillSnapshot = {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly orderType: OrderType;
  readonly businessModel: BusinessModel;
  readonly totalAmount: number;
  readonly extraAmount: number;
  readonly extraFees: readonly OrderExtraFee[];
  readonly hasPendingExtraPayment: boolean;
  readonly status: OrderStatus;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly customerAddress: string | null;
  readonly notes: string | null;
  readonly confirmedAt: Date | null;
  readonly createdAt: Date;
  readonly items: readonly OrderBillSnapshotItem[];
};

export type OrderBill = {
  readonly id: string;
  readonly orderId: string;
  readonly billNumber: string;
  readonly version: number;
  readonly status: OrderBillStatus;
  readonly snapshot: OrderBillSnapshot;
  readonly voidReason: string | null;
  readonly voidedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
