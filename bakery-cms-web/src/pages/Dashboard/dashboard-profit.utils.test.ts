import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  PaymentStatus,
  PaymentType,
  ProductType,
} from '@bakery-cms/common';
import {
  buildProfitComparisonData,
  type ProfitOrderInput,
  type ProfitPaymentInput,
  type ProfitProductInput,
} from './dashboard-profit.utils';

const createOrder = (overrides: Partial<ProfitOrderInput> = {}): ProfitOrderInput => ({
  id: 'order-1',
  items: [],
  extraFees: [],
  ...overrides,
});

const createPayment = (
  overrides: Partial<ProfitPaymentInput> = {}
): ProfitPaymentInput => ({
  orderId: 'order-1',
  paymentType: PaymentType.PAYMENT,
  status: PaymentStatus.PAID,
  amount: 0,
  paidAt: null,
  createdAt: new Date('2026-04-01T10:00:00Z'),
  ...overrides,
});

const createProduct = (
  overrides: Partial<ProfitProductInput> = {}
): ProfitProductInput => ({
  id: 'product-1',
  productType: ProductType.SINGLE,
  comboItems: [],
  ...overrides,
});

describe('dashboard-profit.utils', () => {
  it('calculates net revenue correctly when refund exists', () => {
    const result = buildProfitComparisonData({
      orders: [createOrder()],
      products: [createProduct()],
      productCostById: {},
      payments: [
        createPayment({ amount: 100, paidAt: new Date('2026-04-01T11:00:00Z') }),
        createPayment({
          paymentType: PaymentType.REFUND,
          amount: 20,
          paidAt: new Date('2026-04-01T12:00:00Z'),
        }),
      ],
      rangeStart: dayjs('2026-04-01'),
      rangeEnd: dayjs('2026-04-01'),
    });

    expect(result.points).toHaveLength(1);
    expect(result.points[0]).toMatchObject({
      revenue: 80,
      estimatedCost: 0,
      estimatedProfit: 80,
    });
    expect(result.totals.revenue).toBe(80);
  });

  it('calculates ingredient cost from product cost cache', () => {
    const result = buildProfitComparisonData({
      orders: [
        createOrder({
          items: [{ productId: 'product-1', quantity: 2 }],
        }),
      ],
      products: [createProduct({ id: 'product-1' })],
      productCostById: { 'product-1': 50 },
      payments: [
        createPayment({ amount: 200, paidAt: new Date('2026-04-01T09:00:00Z') }),
      ],
      rangeStart: dayjs('2026-04-01'),
      rangeEnd: dayjs('2026-04-01'),
    });

    expect(result.points[0]).toMatchObject({
      revenue: 200,
      estimatedCost: 100,
      estimatedProfit: 100,
    });
  });

  it('subtracts extra fees as other costs', () => {
    const result = buildProfitComparisonData({
      orders: [
        createOrder({
          items: [{ productId: 'product-1', quantity: 1 }],
          extraFees: [{ amount: 30 }],
        }),
      ],
      products: [createProduct({ id: 'product-1' })],
      productCostById: { 'product-1': 100 },
      payments: [
        createPayment({ amount: 200, paidAt: new Date('2026-04-01T09:00:00Z') }),
      ],
      rangeStart: dayjs('2026-04-01'),
      rangeEnd: dayjs('2026-04-01'),
    });

    expect(result.points[0]).toMatchObject({
      revenue: 200,
      estimatedCost: 130,
      estimatedProfit: 70,
    });
  });

  it('allocates estimated cost by payment ratio when an order has multiple paid payments', () => {
    const result = buildProfitComparisonData({
      orders: [
        createOrder({
          items: [{ productId: 'product-1', quantity: 1 }],
        }),
      ],
      products: [createProduct({ id: 'product-1' })],
      productCostById: { 'product-1': 100 },
      payments: [
        createPayment({
          amount: 40,
          paidAt: new Date('2026-04-01T09:00:00Z'),
        }),
        createPayment({
          amount: 60,
          paidAt: new Date('2026-04-02T09:00:00Z'),
        }),
      ],
      rangeStart: dayjs('2026-04-01'),
      rangeEnd: dayjs('2026-04-02'),
    });

    expect(result.points).toHaveLength(2);
    expect(result.points[0]).toMatchObject({
      revenue: 40,
      estimatedCost: 40,
      estimatedProfit: 0,
    });
    expect(result.points[1]).toMatchObject({
      revenue: 60,
      estimatedCost: 60,
      estimatedProfit: 0,
    });
  });

  it('expands combo items to child products for ingredient cost calculation', () => {
    const result = buildProfitComparisonData({
      orders: [
        createOrder({
          items: [{ productId: 'combo-1', quantity: 3 }],
        }),
      ],
      products: [
        createProduct({
          id: 'combo-1',
          productType: ProductType.COMBO,
          comboItems: [{ itemProductId: 'product-1', quantity: 2 }],
        }),
        createProduct({
          id: 'product-1',
          productType: ProductType.SINGLE,
        }),
      ],
      productCostById: {
        'combo-1': 999,
        'product-1': 10,
      },
      payments: [
        createPayment({ amount: 100, paidAt: new Date('2026-04-01T09:00:00Z') }),
      ],
      rangeStart: dayjs('2026-04-01'),
      rangeEnd: dayjs('2026-04-01'),
    });

    expect(result.points[0]).toMatchObject({
      revenue: 100,
      estimatedCost: 60,
      estimatedProfit: 40,
    });
  });

  it('filters points by date range boundaries (inclusive)', () => {
    const result = buildProfitComparisonData({
      orders: [createOrder()],
      products: [createProduct()],
      productCostById: {},
      payments: [
        createPayment({ amount: 50, paidAt: new Date('2026-04-01T09:00:00Z') }),
        createPayment({ amount: 80, paidAt: new Date('2026-04-03T09:00:00Z') }),
      ],
      rangeStart: dayjs('2026-04-02'),
      rangeEnd: dayjs('2026-04-03'),
    });

    expect(result.points).toHaveLength(2);
    expect(result.points[0]).toMatchObject({
      key: '2026-04-02',
      revenue: 0,
    });
    expect(result.points[1]).toMatchObject({
      key: '2026-04-03',
      revenue: 80,
    });
    expect(result.totals.revenue).toBe(80);
  });

  it('falls back to zero ingredient cost when product cost is missing', () => {
    const result = buildProfitComparisonData({
      orders: [
        createOrder({
          items: [{ productId: 'product-missing-cost', quantity: 3 }],
        }),
      ],
      products: [createProduct({ id: 'product-missing-cost' })],
      productCostById: {},
      payments: [
        createPayment({ amount: 120, paidAt: new Date('2026-04-01T09:00:00Z') }),
      ],
      rangeStart: dayjs('2026-04-01'),
      rangeEnd: dayjs('2026-04-01'),
    });

    expect(result.points[0]).toMatchObject({
      revenue: 120,
      estimatedCost: 0,
      estimatedProfit: 120,
    });
  });
});
