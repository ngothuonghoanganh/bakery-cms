/**
 * Order service
 * Handles all order-related API calls with Result type pattern
 */

import { apiClient, extractErrorFromAxiosError } from './api/client';
import type { Result } from '@/types/common/result.types';
import { ok, err } from '@/types/common/result.types';
import type { AppError } from '@/types/common/error.types';
import type {
  OrderAPIResponse,
  PaginatedOrdersAPIResponse,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFiltersRequest,
  ConfirmOrderAPIResponse,
} from '@/types/api/order.api';
import type { Order, PaginatedOrders } from '@/types/models/order.model';
import { mapOrderFromAPI, mapPaginatedOrdersFromAPI } from '@/types/mappers/order.mapper';
import { PaymentMethod } from '@bakery-cms/common';
import type { VietQRData } from '@/types/models/payment.model';
import { mapVietQRDataFromAPI } from '@/types/mappers/payment.mapper';

export type ConfirmOrderResult = {
  readonly order: Order;
  readonly paymentId: string;
  readonly paymentMethod: PaymentMethod;
  readonly vietqr: VietQRData | null;
};

/**
 * Order service type definition
 */
export type OrderService = {
  readonly getAll: (filters?: OrderFiltersRequest) => Promise<Result<PaginatedOrders, AppError>>;
  readonly getById: (id: string) => Promise<Result<Order, AppError>>;
  readonly create: (data: CreateOrderRequest) => Promise<Result<Order, AppError>>;
  readonly update: (id: string, data: UpdateOrderRequest) => Promise<Result<Order, AppError>>;
  readonly delete: (id: string) => Promise<Result<void, AppError>>;
  readonly confirm: (
    id: string,
    paymentMethod: PaymentMethod
  ) => Promise<Result<ConfirmOrderResult, AppError>>;
  readonly cancel: (id: string) => Promise<Result<Order, AppError>>;
};

/**
 * Get all orders with optional filters
 */
const getAll = async (
  filters?: OrderFiltersRequest
): Promise<Result<PaginatedOrders, AppError>> => {
  try {
    const response = await apiClient.get<PaginatedOrdersAPIResponse>('/orders', {
      params: filters,
    });
    const paginatedOrders = mapPaginatedOrdersFromAPI(response.data);
    return ok(paginatedOrders);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Get an order by ID
 */
const getById = async (id: string): Promise<Result<Order, AppError>> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: OrderAPIResponse }>(`/orders/${id}`);
    const order = mapOrderFromAPI(response.data.data);
    return ok(order);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Create a new order
 */
const create = async (data: CreateOrderRequest): Promise<Result<Order, AppError>> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: OrderAPIResponse }>('/orders', data);
    const order = mapOrderFromAPI(response.data.data);
    return ok(order);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Update an existing order
 */
const update = async (id: string, data: UpdateOrderRequest): Promise<Result<Order, AppError>> => {
  try {
    const response = await apiClient.patch<{ success: boolean; data: OrderAPIResponse }>(`/orders/${id}`, data);
    const order = mapOrderFromAPI(response.data.data);
    return ok(order);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Confirm an order
 */
const confirm = async (
  id: string,
  paymentMethod: PaymentMethod
): Promise<Result<ConfirmOrderResult, AppError>> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: ConfirmOrderAPIResponse }>(
      `/orders/${id}/confirm`,
      { paymentMethod }
    );
    const payload = response.data.data;

    return ok({
      order: mapOrderFromAPI(payload.order),
      paymentId: payload.payment.id,
      paymentMethod: payload.payment.method as PaymentMethod,
      vietqr: payload.vietqr ? mapVietQRDataFromAPI(payload.vietqr) : null,
    });
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Cancel an order
 */
const cancel = async (id: string): Promise<Result<Order, AppError>> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: OrderAPIResponse }>(`/orders/${id}/cancel`);
    const order = mapOrderFromAPI(response.data.data);
    return ok(order);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Delete an order
 */
const deleteOrder = async (id: string): Promise<Result<void, AppError>> => {
  try {
    await apiClient.delete(`/orders/${id}`);
    return ok(undefined);
  } catch (error) {
    return err(extractErrorFromAxiosError(error));
  }
};

/**
 * Order service instance
 */
export const orderService: OrderService = {
  getAll,
  getById,
  create,
  update,
  delete: deleteOrder,
  confirm,
  cancel,
};

// Named exports for convenience
export const getAllOrders = getAll;
export const getOrderById = getById;
export const createOrder = create;
export const updateOrder = update;
export { deleteOrder };
export const confirmOrder = confirm;
export const cancelOrder = cancel;
