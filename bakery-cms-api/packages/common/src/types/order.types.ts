/**
 * Order and OrderItem entity types and interfaces
 * Supports temporary and official orders with state management
 */

import { Result } from './result.types';
import { AppError } from './error.types';

/**
 * Order entity
 */
export type Order = {
  readonly id: string;
  readonly orderNumber: string;
  readonly orderType: string; // OrderType enum value
  readonly businessModel: string; // BusinessModel enum value
  readonly totalAmount: number;
  readonly status: string; // OrderStatus enum value
  readonly customerName: string | null;
  readonly customerPhone: string | null;
  readonly notes: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly confirmedAt: Date | null;
};

/**
 * OrderItem entity (junction table with pricing snapshot)
 */
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

/**
 * Order with items (aggregated data)
 */
export type OrderWithItems = Order & {
  readonly items: readonly OrderItem[];
};

/**
 * OrderItem input for creating orders
 */
export type CreateOrderItemDTO = {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
};

/**
 * Data Transfer Object for creating an order
 */
export type CreateOrderDTO = {
  readonly orderType: string;
  readonly businessModel: string;
  readonly items: readonly CreateOrderItemDTO[];
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly notes?: string;
};

/**
 * Data Transfer Object for updating an order
 */
export type UpdateOrderDTO = {
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly notes?: string;
  readonly items?: readonly CreateOrderItemDTO[];
};

/**
 * Filters for querying orders
 */
export type OrderFilters = {
  readonly status?: string;
  readonly orderType?: string;
  readonly businessModel?: string;
  readonly customerPhone?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
};

/**
 * Paginated order response
 */
export type PaginatedOrders = {
  readonly orders: readonly OrderWithItems[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
};

/**
 * Order repository interface (Dependency Inversion Principle)
 */
export type OrderRepository = {
  readonly findById: (id: string) => Promise<OrderWithItems | null>;
  readonly findAll: (filters?: OrderFilters, pagination?: { page?: number; limit?: number }) => Promise<readonly OrderWithItems[]>;
  readonly create: (data: CreateOrderDTO) => Promise<OrderWithItems>;
  readonly update: (id: string, data: UpdateOrderDTO) => Promise<OrderWithItems | null>;
  readonly updateStatus: (id: string, status: string, confirmedAt?: Date) => Promise<OrderWithItems | null>;
  readonly delete: (id: string) => Promise<boolean>;
  readonly count: (filters?: OrderFilters) => Promise<number>;
};

/**
 * Order service interface (Dependency Inversion Principle)
 */
export type OrderService = {
  readonly getOrderById: (id: string) => Promise<Result<OrderWithItems, AppError>>;
  readonly getAllOrders: (
    filters?: OrderFilters,
    pagination?: { page?: number; limit?: number }
  ) => Promise<Result<PaginatedOrders, AppError>>;
  readonly createOrder: (data: CreateOrderDTO) => Promise<Result<OrderWithItems, AppError>>;
  readonly updateOrder: (id: string, data: UpdateOrderDTO) => Promise<Result<OrderWithItems, AppError>>;
  readonly confirmOrder: (id: string) => Promise<Result<OrderWithItems, AppError>>;
  readonly cancelOrder: (id: string) => Promise<Result<OrderWithItems, AppError>>;
};
