/**
 * Order services
 * Business logic layer for orders
 * Uses Result type for error handling
 */

import { Result, ok, err } from 'neverthrow';
import {
  AppError,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '@bakery-cms/common';
import {
  OrderRepository,
  OrderBillRepository,
} from '../repositories/orders.repositories';
import { PaymentRepository } from '../../payments/repositories/payments.repositories';
import { SettingsRepository } from '../../settings/repositories/settings.repositories';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListQueryDto,
  OrderResponseDto,
  OrderListResponseDto,
  ConfirmOrderDto,
  ConfirmOrderResponseDto,
  AddOrderExtrasDto,
  AddOrderExtrasResponseDto,
  OrderExtraFeeDto,
  OrderExtraFeeResponseDto,
  SaveOrderBillDto,
  OrderBillResponseDto,
  VoidOrderBillDto,
} from '../dto/orders.dto';
import {
  toOrderResponseDto,
  toOrderResponseDtoList,
  toOrderCreationAttributes,
  toOrderUpdateAttributes,
  calculateOrderTotalWithExtraFees,
  calculateOrderExtraFeesTotal,
  parseOrderExtraFees,
  validateAllItemsSubtotals,
  toOrderBillSnapshotDto,
  toOrderBillResponseDto,
} from '../mappers/orders.mappers';
import {
  toPaymentResponseDto,
  stringifyVietQRData,
} from '../../payments/mappers/payments.mappers';
import {
  VietQRData,
  PaymentResponseDto,
  VietQRResponseDto,
} from '../../payments/dto/payments.dto';
import { getEnvConfig } from '../../../config/env';
import { generateVietQRData } from '../../payments/utils/vietqr.utils';
import {
  createNotFoundError,
  createDatabaseError,
  createInvalidInputError,
  createBusinessRuleError,
  createConflictError,
} from '../../../utils/error-factory';
import { getLogger } from '../../../utils/logger';

const logger = getLogger();

interface VietQRBankConfig {
  bankBin: string;
  accountNo: string;
  accountName: string;
}

const BANK_RECEIVER_SETTING_KEY = 'vietqr.bank_receiver';
const ORDER_EXTRA_FEES_SETTING_KEY = 'orders.extra_fee_templates';

const VIETQR_CONFIG: VietQRBankConfig = {
  bankBin: '970436',
  accountNo: '0123456789',
  accountName: 'BAKERY CMS',
};

const formatVietQRAddInfo = (orderNumber: string): string => {
  const normalizedOrder = orderNumber.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `DH${normalizedOrder}`.slice(0, 25);
};

const toMoney = (value: number): number => Math.round(value * 100) / 100;

/**
 * Order service interface
 * Defines all business operations for orders
 */
export interface OrderService {
  createOrder(dto: CreateOrderDto): Promise<Result<OrderResponseDto, AppError>>;
  getOrderById(id: string): Promise<Result<OrderResponseDto, AppError>>;
  getAllOrders(query: OrderListQueryDto): Promise<Result<OrderListResponseDto, AppError>>;
  updateOrder(id: string, dto: UpdateOrderDto): Promise<Result<OrderResponseDto, AppError>>;
  confirmOrder(id: string, dto: ConfirmOrderDto): Promise<Result<ConfirmOrderResponseDto, AppError>>;
  addOrderExtras(
    id: string,
    dto: AddOrderExtrasDto
  ): Promise<Result<AddOrderExtrasResponseDto, AppError>>;
  cancelOrder(id: string, reason?: string): Promise<Result<OrderResponseDto, AppError>>;
  deleteOrder(id: string): Promise<Result<void, AppError>>;
  restoreOrder(id: string): Promise<Result<OrderResponseDto, AppError>>;
  getOrderBills(orderId: string): Promise<Result<OrderBillResponseDto[], AppError>>;
  saveOrderBill(orderId: string, dto: SaveOrderBillDto): Promise<Result<OrderBillResponseDto, AppError>>;
  voidOrderBill(
    orderId: string,
    billId: string,
    dto: VoidOrderBillDto
  ): Promise<Result<OrderBillResponseDto, AppError>>;
}

/**
 * Generate order number in format: ORD-YYYYMMDD-XXXX
 * Pure function that creates unique order numbers
 */
export const generateOrderNumber = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 4-digit number
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${random}`;
};

/**
 * Validate order status transition
 * Pure function to check if status change is allowed
 */
const isValidStatusTransition = (
  currentStatus: OrderStatus,
  newStatus: OrderStatus
): boolean => {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.DRAFT]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.REFUND_PENDING, OrderStatus.CANCELLED],
    [OrderStatus.REFUND_PENDING]: [OrderStatus.REFUNDED, OrderStatus.CANCELLED],
    [OrderStatus.REFUNDED]: [],
    [OrderStatus.CANCELLED]: [], // Cannot transition from cancelled
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
};

/**
 * Create order service
 * Factory function that returns service implementation
 * Uses dependency injection for repository
 */
export const createOrderService = (
  repository: OrderRepository & { items: any; bills: OrderBillRepository },
  paymentRepository: PaymentRepository,
  settingsRepository: SettingsRepository
): OrderService => {
  const envConfig = getEnvConfig();
  const vietqrCredentials =
    envConfig.VIETQR_CLIENT_ID && envConfig.VIETQR_API_KEY
      ? {
          clientId: envConfig.VIETQR_CLIENT_ID,
          apiKey: envConfig.VIETQR_API_KEY,
        }
      : null;

  const getVietQRBankConfig = async (): Promise<VietQRBankConfig> => {
    const setting = await settingsRepository.findByKey(BANK_RECEIVER_SETTING_KEY);
    if (!setting?.value) {
      return VIETQR_CONFIG;
    }

    try {
      const parsed = JSON.parse(setting.value) as Partial<{
        bankBin: string;
        accountNo: string;
        accountName: string;
      }>;
      const accountName =
        typeof parsed.accountName === 'string' ? parsed.accountName.trim() : '';

      return {
        bankBin: parsed.bankBin || VIETQR_CONFIG.bankBin,
        accountNo: parsed.accountNo || VIETQR_CONFIG.accountNo,
        accountName: accountName || VIETQR_CONFIG.accountName,
      };
    } catch {
      return VIETQR_CONFIG;
    }
  };

  const normalizeTemplateName = (value: string): string =>
    value.trim().toLowerCase();

  const getOrderExtraFeeTemplates = async (): Promise<
    Array<{ id: string; name: string; defaultAmount: number }>
  > => {
    const setting = await settingsRepository.findByKey(ORDER_EXTRA_FEES_SETTING_KEY);
    if (!setting?.value) {
      return [];
    }

    try {
      const parsed = JSON.parse(setting.value) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      const seenIds = new Set<string>();

      return parsed
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null;
          }

          const value = item as Record<string, unknown>;
          const id = String(value['id'] ?? '').trim();
          const name = String(value['name'] ?? '').trim();
          const defaultAmount = Number(value['defaultAmount'] ?? 0);

          if (!id || !name || !Number.isFinite(defaultAmount) || defaultAmount < 0) {
            return null;
          }

          if (seenIds.has(id)) {
            return null;
          }
          seenIds.add(id);

          return {
            id,
            name,
            defaultAmount: toMoney(defaultAmount),
          };
        })
        .filter(
          (
            template
          ): template is { id: string; name: string; defaultAmount: number } =>
            template !== null
        );
    } catch {
      return [];
    }
  };

  const getDefaultOrderExtraFees = (
    templates: readonly { id: string; name: string; defaultAmount: number }[]
  ): OrderExtraFeeResponseDto[] => {
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      amount: toMoney(Math.max(template.defaultAmount, 0)),
    }));
  };

  const resolveOrderExtraFeesFromTemplates = (
    fees: readonly OrderExtraFeeDto[],
    templates: readonly { id: string; name: string; defaultAmount: number }[]
  ): Result<OrderExtraFeeResponseDto[], AppError> => {
    if (fees.length === 0) {
      return ok([]);
    }

    if (templates.length === 0) {
      return err(
        createInvalidInputError(
          'Order extra fee templates are not configured in Settings'
        )
      );
    }

    const templateById = new Map(templates.map((template) => [template.id, template]));
    const templateByName = new Map(
      templates.map((template) => [normalizeTemplateName(template.name), template])
    );
    const seenTemplateIds = new Set<string>();
    const normalizedFees: OrderExtraFeeResponseDto[] = [];

    for (const fee of fees) {
      const id = String(fee.id ?? '').trim();
      const name = String(fee.name ?? '').trim();
      const template =
        (id ? templateById.get(id) : undefined) ||
        (name ? templateByName.get(normalizeTemplateName(name)) : undefined);

      if (!template) {
        return err(
          createInvalidInputError(
            'Each extra fee must reference a valid fee template from Settings'
          )
        );
      }

      if (seenTemplateIds.has(template.id)) {
        return err(
          createInvalidInputError(
            `Duplicate extra fee template is not allowed: ${template.name}`
          )
        );
      }
      seenTemplateIds.add(template.id);

      const amount = Number(fee.amount ?? 0);

      normalizedFees.push({
        id: template.id,
        name: template.name,
        amount: toMoney(Number.isFinite(amount) ? Math.max(amount, 0) : 0),
      });
    }

    return ok(normalizedFees);
  };

  const toOrderResponseFromOrderId = async (
    orderId: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    const orderWithItems = await repository.findByIdWithItems(orderId);
    if (!orderWithItems) {
      return err(createDatabaseError('Failed to retrieve order'));
    }

    return ok(toOrderResponseDto(orderWithItems, (orderWithItems as any).items));
  };

  const createVietQRForPayment = async (
    paymentId: string,
    orderNumber: string,
    amount: number
  ): Promise<Result<VietQRResponseDto, AppError>> => {
    const bankConfig = await getVietQRBankConfig();
    const addInfo = formatVietQRAddInfo(orderNumber);
    const generated = await generateVietQRData(
      {
        bankBin: bankConfig.bankBin,
        accountNo: bankConfig.accountNo,
        accountName: bankConfig.accountName,
        amount,
        addInfo,
        template: 'compact',
      },
      vietqrCredentials
    );

    if (generated.warning) {
      logger.warn('VietQR API unavailable, fallback to Quick Link', {
        paymentId,
        warning: generated.warning,
      });
    }

    const vietqrData: VietQRData = {
      bankId: bankConfig.bankBin,
      accountNo: bankConfig.accountNo,
      accountName: generated.accountName,
      amount,
      addInfo: generated.addInfo,
      template: generated.template,
      qrDataURL: generated.qrDataURL,
      qrContent: generated.qrContent,
    };

    const paymentWithQR = await paymentRepository.update(paymentId, {
      vietqrData: stringifyVietQRData(vietqrData),
    });

    if (!paymentWithQR) {
      return err(createDatabaseError('Failed to store VietQR information'));
    }

    return ok({
      qrDataURL: generated.qrDataURL,
      qrContent: generated.qrContent,
      bankId: bankConfig.bankBin,
      accountNo: bankConfig.accountNo,
      accountName: generated.accountName,
      amount,
      addInfo: generated.addInfo,
    });
  };

  const createPendingPaymentForOrder = async (params: {
    orderId: string;
    orderNumber: string;
    amount: number;
    method: PaymentMethod;
    notes?: string | null;
  }): Promise<
    Result<
      {
        payment: PaymentResponseDto;
        vietqr: VietQRResponseDto | null;
      },
      AppError
    >
  > => {
    const createdPayment = await paymentRepository.create({
      orderId: params.orderId,
      paymentType: PaymentType.PAYMENT,
      amount: params.amount,
      method: params.method,
      status: PaymentStatus.PENDING,
      transactionId: null,
      paidAt: null,
      notes: params.notes ?? null,
      vietqrData: null,
    });

    let paymentToReturn = createdPayment;
    let vietqr: VietQRResponseDto | null = null;

    if (params.method === PaymentMethod.VIETQR) {
      const qrResult = await createVietQRForPayment(
        createdPayment.id,
        params.orderNumber,
        params.amount
      );

      if (qrResult.isErr()) {
        return err(qrResult.error);
      }

      const paymentWithQR = await paymentRepository.findById(createdPayment.id);
      if (paymentWithQR) {
        paymentToReturn = paymentWithQR;
      }

      vietqr = qrResult.value;
    }

    return ok({
      payment: toPaymentResponseDto(paymentToReturn),
      vietqr,
    });
  };

  /**
   * Create new order with items
   */
  const createOrder = async (
    dto: CreateOrderDto
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Creating new order', { itemCount: dto.items.length });

      // Validate items subtotals
      if (!validateAllItemsSubtotals(dto.items)) {
        return err(
          createInvalidInputError('One or more item subtotals are incorrect')
        );
      }

      // Generate unique order number
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        const existing = await repository.findByOrderNumber(orderNumber);
        if (!existing) {
          break;
        }
        orderNumber = generateOrderNumber();
        attempts++;
      }

      if (attempts === maxAttempts) {
        return err(createDatabaseError('Failed to generate unique order number'));
      }

      const templates = await getOrderExtraFeeTemplates();
      let normalizedExtraFees: OrderExtraFeeResponseDto[];

      if (dto.extraFees !== undefined) {
        const resolved = resolveOrderExtraFeesFromTemplates(dto.extraFees, templates);
        if (resolved.isErr()) {
          return err(resolved.error);
        }
        normalizedExtraFees = resolved.value;
      } else {
        normalizedExtraFees = getDefaultOrderExtraFees(templates);
      }

      // Calculate total amount (items + extras)
      const totalAmount = calculateOrderTotalWithExtraFees(
        dto.items,
        normalizedExtraFees
      );

      // Create order
      const orderAttributes = toOrderCreationAttributes(dto, orderNumber);
      orderAttributes.totalAmount = totalAmount;
      orderAttributes.extraAmount = calculateOrderExtraFeesTotal(normalizedExtraFees);
      orderAttributes.extraFees = JSON.stringify(normalizedExtraFees);
      orderAttributes.hasPendingExtraPayment = false;

      const order = await repository.create(orderAttributes);

      // Create order items
      await repository.items.createMany(order.id, dto.items);

      // Fetch order with items
      const orderWithItems = await repository.findByIdWithItems(order.id);

      if (!orderWithItems) {
        return err(createDatabaseError('Failed to retrieve created order'));
      }

      logger.info('Order created successfully', {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      return ok(
        toOrderResponseDto(orderWithItems, (orderWithItems as any).items)
      );
    } catch (error) {
      logger.error('Failed to create order', { error, dto });
      return err(createDatabaseError('Failed to create order', error));
    }
  };

  /**
   * Get order by ID with items
   */
  const getOrderById = async (
    id: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.debug('Fetching order by ID', { orderId: id });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        logger.warn('Order not found', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      return ok(toOrderResponseDto(order, (order as any).items));
    } catch (error) {
      logger.error('Failed to fetch order', { error, orderId: id });
      return err(createDatabaseError('Failed to fetch order', error));
    }
  };

  /**
   * Get all orders with filtering and pagination
   */
  const getAllOrders = async (
    query: OrderListQueryDto
  ): Promise<Result<OrderListResponseDto, AppError>> => {
    try {
      logger.debug('Fetching orders list', { query });

      const { page = 1, limit = 10 } = query;

      // Validate pagination
      if (page < 1) {
        return err(createInvalidInputError('Page must be at least 1'));
      }

      if (limit < 1 || limit > 100) {
        return err(createInvalidInputError('Limit must be between 1 and 100'));
      }

      const result = await repository.findAll(query);

      const totalPages = Math.ceil(result.count / limit);

      const response: OrderListResponseDto = {
        data: toOrderResponseDtoList(result.rows as any),
        pagination: {
          page,
          limit,
          total: result.count,
          totalPages,
        },
      };

      logger.debug('Orders list fetched successfully', {
        count: result.rows.length,
        total: result.count,
      });

      return ok(response);
    } catch (error) {
      logger.error('Failed to fetch orders list', { error, query });
      return err(createDatabaseError('Failed to fetch orders', error));
    }
  };

  /**
   * Update order by ID
   */
  const updateOrder = async (
    id: string,
    dto: UpdateOrderDto
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Updating order', { orderId: id, updates: dto });

      // Check if order exists
      const existingOrder = await repository.findByIdWithItems(id);

      if (!existingOrder) {
        logger.warn('Order not found for update', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Check if order can be updated (not paid or cancelled)
      if (
        existingOrder.status === OrderStatus.PAID ||
        existingOrder.status === OrderStatus.REFUND_PENDING ||
        existingOrder.status === OrderStatus.REFUNDED ||
        existingOrder.status === OrderStatus.CANCELLED
      ) {
        return err(
          createBusinessRuleError(
            `Cannot update order with status: ${existingOrder.status}`
          )
        );
      }

      const attributes = toOrderUpdateAttributes(dto);
      const existingOrderItems = ((existingOrder as any).items || []).map(
        (item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          notes: item.notes ?? undefined,
        })
      );
      const nextItems = dto.items ?? existingOrderItems;
      let nextExtraFees: OrderExtraFeeResponseDto[];

      if (dto.extraFees !== undefined) {
        const templates = await getOrderExtraFeeTemplates();
        const resolved = resolveOrderExtraFeesFromTemplates(
          dto.extraFees,
          templates
        );
        if (resolved.isErr()) {
          return err(resolved.error);
        }
        nextExtraFees = resolved.value;
      } else {
        nextExtraFees = parseOrderExtraFees(existingOrder.extraFees ?? null);
      }

      // Update order items if provided
      if (dto.items) {
        // Validate items subtotals
        if (!validateAllItemsSubtotals(dto.items)) {
          return err(
            createInvalidInputError('One or more item subtotals are incorrect')
          );
        }

        // Delete existing items and create new ones
        await repository.items.deleteByOrderId(id);
        await repository.items.createMany(id, dto.items);
      }

      if (dto.items || dto.extraFees !== undefined) {
        const totalAmount = calculateOrderTotalWithExtraFees(nextItems, nextExtraFees);
        attributes.totalAmount = totalAmount;
        attributes.extraAmount = calculateOrderExtraFeesTotal(nextExtraFees);
        attributes.extraFees = JSON.stringify(nextExtraFees);
      }

      // Check if there are any attributes to update
      if (Object.keys(attributes).length === 0) {
        return err(createInvalidInputError('No valid fields provided for update'));
      }

      // Update order
      const order = await repository.update(id, attributes);

      if (!order) {
        return err(createNotFoundError('Order', id));
      }

      // Fetch updated order with items
      const updatedOrder = await repository.findByIdWithItems(id);

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to retrieve updated order'));
      }

      logger.info('Order updated successfully', { orderId: id });

      return ok(
        toOrderResponseDto(updatedOrder, (updatedOrder as any).items)
      );
    } catch (error) {
      logger.error('Failed to update order', { error, orderId: id, dto });
      return err(createDatabaseError('Failed to update order', error));
    }
  };

  /**
   * Confirm order (change status to CONFIRMED)
   */
  const confirmOrder = async (
    id: string,
    dto: ConfirmOrderDto
  ): Promise<Result<ConfirmOrderResponseDto, AppError>> => {
    try {
      logger.info('Confirming order', {
        orderId: id,
        paymentMethod: dto.paymentMethod,
      });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        logger.warn('Order not found for confirmation', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Validate status transition
      if (!isValidStatusTransition(order.status as OrderStatus, OrderStatus.CONFIRMED)) {
        return err(
          createBusinessRuleError(
            `Cannot confirm order with status: ${order.status}`
          )
        );
      }

      const existingPayment = await paymentRepository.findByOrderId(id);
      if (existingPayment) {
        return err(
          createConflictError(`Payment already exists for order: ${id}`)
        );
      }

      const confirmedAt = dto.confirmedAt ? new Date(dto.confirmedAt) : new Date();

      // Update status and confirmation timestamp
      // Business rule: temporary orders become official when confirmed.
      const updatedOrder = await repository.update(id, {
        status: OrderStatus.CONFIRMED,
        confirmedAt,
        ...(order.orderType === OrderType.TEMPORARY
          ? { orderType: OrderType.OFFICIAL }
          : {}),
      });

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to confirm order'));
      }

      const paymentResult = await createPendingPaymentForOrder({
        orderId: id,
        orderNumber: order.orderNumber,
        amount: Number(order.totalAmount),
        method: dto.paymentMethod,
        notes: dto.paymentNotes ?? null,
      });

      if (paymentResult.isErr()) {
        return err(paymentResult.error);
      }

      const payment = paymentResult.value.payment;
      const vietqr = paymentResult.value.vietqr;

      // Fetch with items
      const orderWithItems = await repository.findByIdWithItems(id);
      if (!orderWithItems) {
        return err(createDatabaseError('Failed to retrieve confirmed order'));
      }

      logger.info('Order confirmed successfully', {
        orderId: id,
        paymentId: payment.id,
        paymentMethod: payment.method,
      });

      return ok({
        order: toOrderResponseDto(orderWithItems, (orderWithItems as any).items),
        payment,
        vietqr,
      });
    } catch (error) {
      logger.error('Failed to confirm order', { error, orderId: id });
      return err(createDatabaseError('Failed to confirm order', error));
    }
  };

  /**
   * Add or replace extra fees for an order
   * Handles payment recreation / new payment generation based on current order status
   */
  const addOrderExtras = async (
    id: string,
    dto: AddOrderExtrasDto
  ): Promise<Result<AddOrderExtrasResponseDto, AppError>> => {
    try {
      logger.info('Updating order extras', {
        orderId: id,
        extraCount: dto.extraFees.length,
      });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        return err(createNotFoundError('Order', id));
      }

      if (
        order.status === OrderStatus.CANCELLED ||
        order.status === OrderStatus.REFUND_PENDING ||
        order.status === OrderStatus.REFUNDED
      ) {
        return err(
          createBusinessRuleError(
            `Cannot update extras for order with status: ${order.status}`
          )
        );
      }

      const templates = await getOrderExtraFeeTemplates();
      const normalizedExtraFeesResult = resolveOrderExtraFeesFromTemplates(
        dto.extraFees,
        templates
      );
      if (normalizedExtraFeesResult.isErr()) {
        return err(normalizedExtraFeesResult.error);
      }

      const normalizedExtraFees = normalizedExtraFeesResult.value;
      const previousExtraFees = parseOrderExtraFees(order.extraFees ?? null);
      const previousExtraAmount = calculateOrderExtraFeesTotal(previousExtraFees);
      const nextExtraAmount = calculateOrderExtraFeesTotal(normalizedExtraFees);
      const extraDelta = toMoney(nextExtraAmount - previousExtraAmount);

      const orderItems = ((order as any).items || []).map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
        notes: item.notes ?? undefined,
      }));

      const nextTotalAmount = calculateOrderTotalWithExtraFees(
        orderItems,
        normalizedExtraFees
      );

      const totalPaidAmount = await paymentRepository.sumAmountByOrderIdAndStatus(
        id,
        PaymentStatus.PAID,
        PaymentType.PAYMENT
      );

      const hasPendingExtraPayment =
        order.status === OrderStatus.PAID &&
        totalPaidAmount + 0.01 < nextTotalAmount;

      const updatedOrder = await repository.update(id, {
        totalAmount: nextTotalAmount,
        extraAmount: nextExtraAmount,
        extraFees: JSON.stringify(normalizedExtraFees),
        hasPendingExtraPayment,
      });

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to update order extras'));
      }

      let payment: PaymentResponseDto | null = null;
      let vietqr: VietQRResponseDto | null = null;

      if (extraDelta > 0.01) {
        if (order.status === OrderStatus.PAID) {
          const method = dto.paymentMethod ?? PaymentMethod.CASH;
          const paymentResult = await createPendingPaymentForOrder({
            orderId: id,
            orderNumber: order.orderNumber,
            amount: extraDelta,
            method,
            notes: dto.paymentNotes ?? 'Additional payment for order extras',
          });

          if (paymentResult.isErr()) {
            return err(paymentResult.error);
          }

          payment = paymentResult.value.payment;
          vietqr = paymentResult.value.vietqr;

          await repository.update(id, { hasPendingExtraPayment: true });
        } else if (order.status === OrderStatus.CONFIRMED) {
          const latestPayment = await paymentRepository.findLatestByOrderId(
            id,
            PaymentType.PAYMENT
          );
          const method =
            dto.paymentMethod ??
            ((latestPayment?.method as PaymentMethod | undefined) ??
              PaymentMethod.CASH);

          await paymentRepository.cancelPendingByOrderId(id, PaymentType.PAYMENT);

          const outstandingAmount = toMoney(
            Math.max(nextTotalAmount - totalPaidAmount, 0)
          );

          if (outstandingAmount > 0.01) {
            const paymentResult = await createPendingPaymentForOrder({
              orderId: id,
              orderNumber: order.orderNumber,
              amount: outstandingAmount,
              method,
              notes:
                dto.paymentNotes ??
                'Updated payment after adding order extras',
            });

            if (paymentResult.isErr()) {
              return err(paymentResult.error);
            }

            payment = paymentResult.value.payment;
            vietqr = paymentResult.value.vietqr;
          } else {
            await repository.updateStatus(id, OrderStatus.PAID);
          }
        }
      } else if (
        order.status === OrderStatus.PAID &&
        totalPaidAmount + 0.01 >= nextTotalAmount
      ) {
        await repository.update(id, { hasPendingExtraPayment: false });
      } else if (
        order.status === OrderStatus.CONFIRMED &&
        totalPaidAmount + 0.01 >= nextTotalAmount
      ) {
        await repository.update(id, { status: OrderStatus.PAID });
      }

      const orderResult = await toOrderResponseFromOrderId(id);
      if (orderResult.isErr()) {
        return err(orderResult.error);
      }

      return ok({
        order: orderResult.value,
        payment,
        vietqr,
      });
    } catch (error) {
      logger.error('Failed to update order extras', { error, orderId: id, dto });
      return err(createDatabaseError('Failed to update order extras', error));
    }
  };

  /**
   * Cancel order (change status to CANCELLED)
   */
  const cancelOrder = async (
    id: string,
    reason?: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Cancelling order', { orderId: id, reason });

      const order = await repository.findByIdWithItems(id);

      if (!order) {
        logger.warn('Order not found for cancellation', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Validate status transition
      if (!isValidStatusTransition(order.status as OrderStatus, OrderStatus.CANCELLED)) {
        return err(
          createBusinessRuleError(
            `Cannot cancel order with status: ${order.status}`
          )
        );
      }

      // Update status and add cancellation reason to notes
      const updateData: any = {
        status: OrderStatus.CANCELLED,
      };

      if (reason) {
        updateData.notes = order.notes
          ? `${order.notes}\n\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`;
      }

      const updatedOrder = await repository.update(id, updateData);

      if (!updatedOrder) {
        return err(createDatabaseError('Failed to cancel order'));
      }

      // Fetch with items
      const orderWithItems = await repository.findByIdWithItems(id);

      logger.info('Order cancelled successfully', { orderId: id });

      return ok(
        toOrderResponseDto(orderWithItems!, (orderWithItems as any).items)
      );
    } catch (error) {
      logger.error('Failed to cancel order', { error, orderId: id });
      return err(createDatabaseError('Failed to cancel order', error));
    }
  };

  /**
   * Delete order by ID (soft delete with cascade)
   */
  const deleteOrder = async (id: string): Promise<Result<void, AppError>> => {
    try {
      logger.info('Soft deleting order with cascade', { 
        orderId: id,
        operation: 'cascade_soft_delete'
      });

      // Check if order exists and can be deleted
      const order = await repository.findById(id);

      if (!order) {
        logger.warn('Order not found for deletion', { orderId: id });
        return err(createNotFoundError('Order', id));
      }

      // Only allow deletion of draft orders
      if (order.status !== OrderStatus.DRAFT) {
        return err(
          createBusinessRuleError(
            `Cannot delete order with status: ${order.status}. Only draft orders can be deleted.`
          )
        );
      }

      const deleted = await repository.delete(id);

      if (!deleted) {
        return err(createDatabaseError('Failed to delete order'));
      }

      logger.info('Order and related entities soft deleted successfully', { 
        orderId: id,
        deletedAt: new Date(),
        metadata: {
          action: 'cascade_soft_delete',
          cascade: ['order', 'order_items', 'payment'],
          recoverable: true,
          businessRule: 'draft_only'
        }
      });

      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete order', { error, orderId: id });
      return err(createDatabaseError('Failed to delete order', error));
    }
  };

  /**
   * Restore soft-deleted order with cascade
   */
  const restoreOrder = async (
    id: string
  ): Promise<Result<OrderResponseDto, AppError>> => {
    try {
      logger.info('Restoring soft-deleted order with cascade', { 
        orderId: id,
        operation: 'cascade_restore'
      });

      const order = await repository.restore(id);

      if (!order) {
        logger.warn('Order not found or not deleted', { orderId: id });
        return err(createNotFoundError('Deleted order', id));
      }

      logger.info('Order and related entities restored successfully', { 
        orderId: id,
        restoredAt: new Date(),
        metadata: {
          action: 'cascade_restore',
          cascade: ['order', 'order_items', 'payment'],
          previousState: 'deleted'
        }
      });

      return ok(toOrderResponseDto(order));
    } catch (error) {
      logger.error('Failed to restore order', { error, orderId: id });
      return err(createDatabaseError('Failed to restore order', error));
    }
  };

  /**
   * Get all bills for one order
   */
  const getOrderBills = async (
    orderId: string
  ): Promise<Result<OrderBillResponseDto[], AppError>> => {
    try {
      const order = await repository.findById(orderId);

      if (!order) {
        return err(createNotFoundError('Order', orderId));
      }

      const bills = await repository.bills.findByOrderId(orderId);
      return ok(bills.map(toOrderBillResponseDto));
    } catch (error) {
      logger.error('Failed to get order bills', { error, orderId });
      return err(createDatabaseError('Failed to get order bills', error));
    }
  };

  /**
   * Save order bill snapshot
   */
  const saveOrderBill = async (
    orderId: string,
    dto: SaveOrderBillDto
  ): Promise<Result<OrderBillResponseDto, AppError>> => {
    try {
      if (!dto.confirmSave) {
        return err(createInvalidInputError('Bill save confirmation is required'));
      }

      const order = await repository.findByIdWithItems(orderId);

      if (!order) {
        return err(createNotFoundError('Order', orderId));
      }

      const activeBill = await repository.bills.findActiveByOrderId(orderId);
      if (activeBill) {
        return err(
          createBusinessRuleError(
            'An active bill already exists for this order. Void it before creating a new bill.'
          )
        );
      }

      const version = await repository.bills.getNextVersion(orderId);
      const billNumber = `${order.orderNumber}-B${String(version).padStart(2, '0')}`;
      const snapshot = toOrderBillSnapshotDto(order, (order as any).items);

      const createdBill = await repository.bills.create({
        orderId,
        billNumber,
        version,
        snapshot,
      });

      logger.info('Order bill saved', {
        orderId,
        billId: createdBill.id,
        billNumber: createdBill.billNumber,
        version: createdBill.version,
      });

      return ok(toOrderBillResponseDto(createdBill));
    } catch (error) {
      logger.error('Failed to save order bill', { error, orderId });
      return err(createDatabaseError('Failed to save order bill', error));
    }
  };

  /**
   * Void an existing bill while keeping full history
   */
  const voidOrderBill = async (
    orderId: string,
    billId: string,
    dto: VoidOrderBillDto
  ): Promise<Result<OrderBillResponseDto, AppError>> => {
    try {
      const order = await repository.findById(orderId);

      if (!order) {
        return err(createNotFoundError('Order', orderId));
      }

      const existingBill = await repository.bills.findById(orderId, billId);
      if (!existingBill) {
        return err(createNotFoundError('Order bill', billId));
      }

      if (existingBill.status === 'voided') {
        return err(
          createBusinessRuleError('This bill has already been voided')
        );
      }

      const reason = dto.reason.trim();
      if (!reason) {
        return err(createInvalidInputError('Void reason is required'));
      }

      const voidedBill = await repository.bills.voidBill(
        orderId,
        billId,
        reason,
        new Date()
      );

      if (!voidedBill) {
        return err(createDatabaseError('Failed to void order bill'));
      }

      logger.info('Order bill voided', {
        orderId,
        billId,
      });

      return ok(toOrderBillResponseDto(voidedBill));
    } catch (error) {
      logger.error('Failed to void order bill', { error, orderId, billId });
      return err(createDatabaseError('Failed to void order bill', error));
    }
  };

  return {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrder,
    confirmOrder,
    addOrderExtras,
    cancelOrder,
    deleteOrder,
    restoreOrder,
    getOrderBills,
    saveOrderBill,
    voidOrderBill,
  };
};
