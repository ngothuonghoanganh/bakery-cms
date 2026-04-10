import dayjs, { type Dayjs } from 'dayjs';
import { PaymentStatus, PaymentType, ProductType } from '@bakery-cms/common';

const toMoney = (value: number): number => Math.round(value * 100) / 100;

const toSafePositiveNumber = (value: unknown): number => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  return numeric;
};

export type ProfitOrderInput = {
  readonly id: string;
  readonly items?: readonly {
    readonly productId: string;
    readonly quantity: number;
  }[];
  readonly extraFees?: readonly {
    readonly amount: number;
  }[];
};

export type ProfitPaymentInput = {
  readonly orderId: string;
  readonly paymentType: PaymentType;
  readonly status: PaymentStatus;
  readonly amount: number;
  readonly paidAt: Date | null;
  readonly createdAt: Date;
};

export type ProfitProductInput = {
  readonly id: string;
  readonly productType: string;
  readonly comboItems?: readonly {
    readonly itemProductId: string;
    readonly quantity: number;
  }[];
};

export type ProfitComparisonPoint = {
  readonly key: string;
  readonly label: string;
  readonly revenue: number;
  readonly estimatedCost: number;
  readonly estimatedProfit: number;
};

export type ProfitComparisonData = {
  readonly points: readonly ProfitComparisonPoint[];
  readonly totals: {
    readonly revenue: number;
    readonly estimatedCost: number;
    readonly estimatedProfit: number;
  };
};

export type BuildProfitComparisonDataInput = {
  readonly orders: readonly ProfitOrderInput[];
  readonly payments: readonly ProfitPaymentInput[];
  readonly products: readonly ProfitProductInput[];
  readonly productCostById: Readonly<Record<string, number>>;
  readonly rangeStart: Dayjs;
  readonly rangeEnd: Dayjs;
};

type MutableProfitComparisonPoint = {
  key: string;
  label: string;
  revenue: number;
  estimatedCost: number;
  estimatedProfit: number;
};

const getPaymentDate = (payment: ProfitPaymentInput): Dayjs => {
  return dayjs(payment.paidAt ?? payment.createdAt);
};

const isWithinRange = (date: Dayjs, start: Dayjs, endExclusive: Dayjs): boolean => {
  return (date.isSame(start) || date.isAfter(start)) && date.isBefore(endExclusive);
};

const toDayKey = (date: Dayjs): string => {
  return date.format('YYYY-MM-DD');
};

const buildDailyBuckets = (
  rangeStart: Dayjs,
  rangeEnd: Dayjs
): {
  points: MutableProfitComparisonPoint[];
  pointByKey: Map<string, MutableProfitComparisonPoint>;
  start: Dayjs;
  endExclusive: Dayjs;
} => {
  const start = rangeStart.startOf('day');
  const end = rangeEnd.startOf('day');

  if (end.isBefore(start)) {
    return {
      points: [],
      pointByKey: new Map(),
      start,
      endExclusive: start,
    };
  }

  const days = end.diff(start, 'day') + 1;
  const points: MutableProfitComparisonPoint[] = [];
  const pointByKey = new Map<string, MutableProfitComparisonPoint>();

  for (let index = 0; index < days; index += 1) {
    const date = start.add(index, 'day');
    const point: MutableProfitComparisonPoint = {
      key: toDayKey(date),
      label: date.format('DD/MM'),
      revenue: 0,
      estimatedCost: 0,
      estimatedProfit: 0,
    };

    points.push(point);
    pointByKey.set(point.key, point);
  }

  return {
    points,
    pointByKey,
    start,
    endExclusive: end.add(1, 'day'),
  };
};

const addProductDemand = (
  productId: string,
  quantity: number,
  productsById: Map<string, ProfitProductInput>,
  demandByProductId: Map<string, number>,
  visiting: Set<string>
): void => {
  const normalizedQuantity = toSafePositiveNumber(quantity);
  if (normalizedQuantity <= 0) {
    return;
  }

  const product = productsById.get(productId);

  if (
    product?.productType === ProductType.COMBO &&
    Array.isArray(product.comboItems) &&
    product.comboItems.length > 0
  ) {
    if (visiting.has(productId)) {
      return;
    }

    visiting.add(productId);

    product.comboItems.forEach((comboItem) => {
      const comboQuantity = toSafePositiveNumber(comboItem.quantity);
      if (comboQuantity <= 0) {
        return;
      }

      addProductDemand(
        comboItem.itemProductId,
        normalizedQuantity * comboQuantity,
        productsById,
        demandByProductId,
        visiting
      );
    });

    visiting.delete(productId);
    return;
  }

  demandByProductId.set(productId, (demandByProductId.get(productId) ?? 0) + normalizedQuantity);
};

const calculateOrderIngredientCost = (
  order: ProfitOrderInput,
  productsById: Map<string, ProfitProductInput>,
  productCostById: Readonly<Record<string, number>>
): number => {
  const demandByProductId = new Map<string, number>();

  (order.items ?? []).forEach((item) => {
    addProductDemand(
      item.productId,
      item.quantity,
      productsById,
      demandByProductId,
      new Set<string>()
    );
  });

  return Array.from(demandByProductId.entries()).reduce((sum, [productId, quantity]) => {
    const unitCost = Number(productCostById[productId] ?? 0);
    if (!Number.isFinite(unitCost) || unitCost <= 0) {
      return sum;
    }

    return sum + quantity * unitCost;
  }, 0);
};

const calculateOrderOtherCost = (order: ProfitOrderInput): number => {
  return (order.extraFees ?? []).reduce((sum, fee) => {
    return sum + toSafePositiveNumber(fee.amount);
  }, 0);
};

const calculateOrderEstimatedCost = (
  order: ProfitOrderInput,
  productsById: Map<string, ProfitProductInput>,
  productCostById: Readonly<Record<string, number>>
): number => {
  const ingredientCost = calculateOrderIngredientCost(order, productsById, productCostById);
  const otherCost = calculateOrderOtherCost(order);
  return toMoney(ingredientCost + otherCost);
};

const getSignedRevenueAmount = (payment: ProfitPaymentInput): number => {
  const amount = Number(payment.amount);
  const normalized = Number.isFinite(amount) ? amount : 0;

  return payment.paymentType === PaymentType.REFUND ? -normalized : normalized;
};

export const buildProfitComparisonData = (
  input: BuildProfitComparisonDataInput
): ProfitComparisonData => {
  const { points, pointByKey, start, endExclusive } = buildDailyBuckets(
    input.rangeStart,
    input.rangeEnd
  );

  if (points.length === 0) {
    return {
      points: [],
      totals: {
        revenue: 0,
        estimatedCost: 0,
        estimatedProfit: 0,
      },
    };
  }

  const productsById = new Map<string, ProfitProductInput>(
    input.products.map((product) => [product.id, product])
  );

  const paidPayments = input.payments.filter((payment) => payment.status === PaymentStatus.PAID);

  const paidPaymentsByOrderId = new Map<string, ProfitPaymentInput[]>();
  paidPayments.forEach((payment) => {
    const bucket = paidPaymentsByOrderId.get(payment.orderId);
    if (!bucket) {
      paidPaymentsByOrderId.set(payment.orderId, [payment]);
      return;
    }

    bucket.push(payment);
  });

  paidPayments.forEach((payment) => {
    const paymentDate = getPaymentDate(payment);
    if (!isWithinRange(paymentDate, start, endExclusive)) {
      return;
    }

    const point = pointByKey.get(toDayKey(paymentDate));
    if (!point) {
      return;
    }

    point.revenue += getSignedRevenueAmount(payment);
  });

  input.orders.forEach((order) => {
    const orderEstimatedCost = calculateOrderEstimatedCost(order, productsById, input.productCostById);
    if (orderEstimatedCost <= 0) {
      return;
    }

    const paidSalePayments = (paidPaymentsByOrderId.get(order.id) ?? []).filter(
      (payment) => payment.paymentType === PaymentType.PAYMENT && toSafePositiveNumber(payment.amount) > 0
    );

    const totalPaidSaleAmount = paidSalePayments.reduce((sum, payment) => {
      return sum + toSafePositiveNumber(payment.amount);
    }, 0);

    if (totalPaidSaleAmount <= 0) {
      return;
    }

    paidSalePayments.forEach((payment) => {
      const ratio = toSafePositiveNumber(payment.amount) / totalPaidSaleAmount;
      const allocatedCost = orderEstimatedCost * ratio;
      const paymentDate = getPaymentDate(payment);

      if (!isWithinRange(paymentDate, start, endExclusive)) {
        return;
      }

      const point = pointByKey.get(toDayKey(paymentDate));
      if (!point) {
        return;
      }

      point.estimatedCost += allocatedCost;
    });
  });

  const finalPoints: ProfitComparisonPoint[] = points.map((point) => {
    const revenue = toMoney(point.revenue);
    const estimatedCost = toMoney(point.estimatedCost);
    const estimatedProfit = toMoney(revenue - estimatedCost);

    return {
      ...point,
      revenue,
      estimatedCost,
      estimatedProfit,
    };
  });

  const totals = finalPoints.reduce(
    (sum, point) => ({
      revenue: sum.revenue + point.revenue,
      estimatedCost: sum.estimatedCost + point.estimatedCost,
      estimatedProfit: sum.estimatedProfit + point.estimatedProfit,
    }),
    {
      revenue: 0,
      estimatedCost: 0,
      estimatedProfit: 0,
    }
  );

  return {
    points: finalPoints,
    totals: {
      revenue: toMoney(totals.revenue),
      estimatedCost: toMoney(totals.estimatedCost),
      estimatedProfit: toMoney(totals.estimatedProfit),
    },
  };
};
