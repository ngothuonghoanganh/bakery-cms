import { err, ok } from 'neverthrow';
import { OrderStatus, PaymentStatus, PaymentType } from '@bakery-cms/common';
import { createBusinessRuleError } from '../../../utils/error-factory';
import { createPaymentService } from './payments.services';

describe('payments.services markAsPaid', () => {
  it('preserves business errors from stock deduction instead of wrapping into database error', async () => {
    const repository = {
      findById: jest.fn(),
      markAsPaid: jest.fn(),
      sumAmountByOrderIdAndStatus: jest.fn(),
      update: jest.fn(),
    } as any;

    const settingsRepository = {
      findByKey: jest.fn(),
      setByKey: jest.fn(),
    } as any;

    const orderRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    const stockError = createBusinessRuleError(
      'Insufficient stock for item stock-1. Required: 20, available: -160'
    );

    const paidOrderStockService = {
      consumeStockForPaidOrder: jest.fn().mockResolvedValue(err(stockError)),
    } as any;

    const paymentRecord = {
      id: 'payment-1',
      orderId: 'order-1',
      status: PaymentStatus.PENDING,
      paymentType: PaymentType.PAYMENT,
    };

    const paidPaymentRecord = {
      ...paymentRecord,
      status: PaymentStatus.PAID,
    };

    repository.findById
      .mockResolvedValueOnce(paymentRecord)
      .mockResolvedValueOnce(paidPaymentRecord);
    repository.markAsPaid.mockResolvedValue(paidPaymentRecord);
    repository.sumAmountByOrderIdAndStatus.mockResolvedValue(100);
    orderRepository.findById.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.CONFIRMED,
      totalAmount: 100,
      hasPendingExtraPayment: false,
    });

    const service = createPaymentService(
      repository,
      settingsRepository,
      orderRepository,
      paidOrderStockService
    );

    const result = await service.markAsPaid('payment-1', {}, 'user-1');

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error.code).toBe(stockError.code);
    expect(result.error.statusCode).toBe(stockError.statusCode);
    expect(result.error.message).toBe(stockError.message);
  });

  it('still returns database error for unexpected exceptions', async () => {
    const repository = {
      findById: jest.fn().mockRejectedValue(new Error('database unavailable')),
    } as any;

    const settingsRepository = {
      findByKey: jest.fn(),
      setByKey: jest.fn(),
    } as any;

    const orderRepository = {
      findById: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    const paidOrderStockService = {
      consumeStockForPaidOrder: jest.fn().mockResolvedValue(ok({ executed: true, movementCount: 0 })),
    } as any;

    const service = createPaymentService(
      repository,
      settingsRepository,
      orderRepository,
      paidOrderStockService
    );

    const result = await service.markAsPaid('payment-1', {}, 'user-1');

    expect(result.isErr()).toBe(true);
    if (result.isOk()) {
      return;
    }

    expect(result.error.code).toBe('DATABASE_ERROR');
    expect(result.error.statusCode).toBe(500);
  });
});
