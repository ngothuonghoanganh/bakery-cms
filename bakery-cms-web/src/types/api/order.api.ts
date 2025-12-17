/**
 * API response types for Order endpoints
 */

export type OrderItemAPIResponse = {
  readonly id: string;
  readonly orderId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type OrderAPIResponse = {
  readonly id: string;
  readonly orderNumber: string;
  readonly orderType: string;
  readonly businessModel: string;
  readonly totalAmount: number;
  readonly status: string;
  readonly customerName: string | null;
  readonly customerPhone: string | null;
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
};

export type CreateOrderRequest = {
  readonly orderType: string;
  readonly businessModel: string;
  readonly items: readonly CreateOrderItemRequest[];
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly notes?: string;
};

export type UpdateOrderRequest = {
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly notes?: string;
  readonly items?: readonly CreateOrderItemRequest[];
};

export type OrderFiltersRequest = {
  readonly status?: string;
  readonly orderType?: string;
  readonly businessModel?: string;
  readonly customerPhone?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page?: number;
  readonly limit?: number;
};
