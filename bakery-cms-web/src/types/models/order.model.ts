/**
 * Order domain model
 * Represents order and order item data in the frontend domain layer
 */

export const OrderStatus = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderType = {
  TEMPORARY: 'temporary',
  OFFICIAL: 'official',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const BusinessModel = {
  MADE_TO_ORDER: 'made_to_order',
  READY_TO_SELL: 'ready_to_sell',
} as const;

export type BusinessModel = (typeof BusinessModel)[keyof typeof BusinessModel];

export type OrderItem = {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type Order = {
  readonly id: string;
  readonly orderNumber: string;
  readonly orderType: OrderType;
  readonly businessModel: BusinessModel;
  readonly totalAmount: number;
  readonly status: OrderStatus;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
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
