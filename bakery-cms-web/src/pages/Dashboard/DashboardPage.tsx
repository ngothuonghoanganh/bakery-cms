import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Typography,
  Progress,
  Empty,
  Spin,
  Tooltip,
  Alert,
  Button,
  DatePicker,
} from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  AppstoreOutlined,
  TeamOutlined,
  PlusOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { OrderStatus, PaymentMethod, PaymentStatus, PaymentType } from '@bakery-cms/common';
import { PageHeader } from '../../components/shared';
import { StatCard } from '../../components/features/dashboard/StatCard/StatCard';
import { RecentActivity } from '../../components/features/dashboard/RecentActivity/RecentActivity';
import { QuickActions } from '../../components/features/dashboard/QuickActions/QuickActions';
import { LowStockDashboard } from '../../components/features/stock/LowStockDashboard/LowStockDashboard';
import { orderService, paymentService, productService, stockService } from '../../services';
import { formatCurrency, formatNumber } from '../../utils/format.utils';
import type { QuickAction } from '../../components/features/dashboard/QuickActions/QuickActions.types';
import type { ActivityItem } from '../../components/features/dashboard/RecentActivity/RecentActivity.types';
import type { Order } from '../../types/models/order.model';
import type { Payment } from '../../types/models/payment.model';
import type { Product } from '../../types/models/product.model';
import { buildProfitComparisonData } from './dashboard-profit.utils';
import './DashboardPage.css';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const PAGE_LIMIT = 100;
const MAX_FETCH_PAGES = 20;
const CHART_DAYS = 7;
const DEFAULT_PROFIT_RANGE_DAYS = 7;
const ACTIVE_CUSTOMER_DAYS = 30;

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: '#faad14',
  [OrderStatus.CONFIRMED]: '#1677ff',
  [OrderStatus.PAID]: '#52c41a',
  [OrderStatus.REFUND_PENDING]: '#fa8c16',
  [OrderStatus.REFUNDED]: '#722ed1',
  [OrderStatus.CANCELLED]: '#ff4d4f',
};

const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: '#1677ff',
  [PaymentMethod.VIETQR]: '#13c2c2',
  [PaymentMethod.BANK_TRANSFER]: '#52c41a',
};

const PENDING_ORDER_STATUSES = new Set<OrderStatus>([OrderStatus.DRAFT, OrderStatus.CONFIRMED]);

type PagedCollection<T> = {
  items: T[];
  total: number;
};

type RevenuePoint = {
  key: string;
  label: string;
  value: number;
};

type StatusDistributionPoint = {
  status: OrderStatus;
  count: number;
  percent: number;
  color: string;
};

type PaymentMethodPoint = {
  method: PaymentMethod;
  count: number;
  amount: number;
  percent: number;
  color: string;
};

type TopProductPoint = {
  key: string;
  productCode: string;
  productName: string;
  quantity: number;
  revenue: number;
  percent: number;
};

type DashboardSnapshot = {
  orders: Order[];
  payments: Payment[];
  products: Product[];
  totals: {
    orders: number;
    payments: number;
    products: number;
  };
};

const calculateTrend = (current: number, previous: number): number => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
};

const isBetweenRange = (
  value: dayjs.Dayjs,
  start: dayjs.Dayjs,
  endExclusive: dayjs.Dayjs
): boolean => {
  return (value.isAfter(start) || value.isSame(start)) && value.isBefore(endExclusive);
};

const getOrderActivityStatus = (status: OrderStatus): ActivityItem['status'] => {
  switch (status) {
    case OrderStatus.PAID:
    case OrderStatus.REFUNDED:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'error';
    case OrderStatus.DRAFT:
      return 'warning';
    default:
      return 'info';
  }
};

const getPaymentActivityStatus = (status: PaymentStatus): ActivityItem['status'] => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'success';
    case PaymentStatus.FAILED:
      return 'error';
    case PaymentStatus.PENDING:
      return 'warning';
    default:
      return 'info';
  }
};

const getPaymentMethodTranslationKey = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.CASH:
      return 'payments.method.cash';
    case PaymentMethod.BANK_TRANSFER:
      return 'payments.method.bankTransfer';
    case PaymentMethod.VIETQR:
      return 'payments.method.vietqr';
    default:
      return 'payments.method.cash';
  }
};

const fetchAllOrders = async (): Promise<PagedCollection<Order>> => {
  const items: Order[] = [];
  let page = 1;
  let totalPages = 1;
  let total = 0;

  while (page <= totalPages && page <= MAX_FETCH_PAGES) {
    const result = await orderService.getAll({ page, limit: PAGE_LIMIT });

    if (!result.success) {
      throw new Error(result.error.message);
    }

    items.push(...result.data.orders);
    total = result.data.total;
    totalPages = Math.min(result.data.totalPages, MAX_FETCH_PAGES);
    page += 1;
  }

  return { items, total };
};

const fetchAllPayments = async (): Promise<PagedCollection<Payment>> => {
  const items: Payment[] = [];
  let page = 1;
  let totalPages = 1;
  let total = 0;

  while (page <= totalPages && page <= MAX_FETCH_PAGES) {
    const result = await paymentService.getAll({ page, limit: PAGE_LIMIT });

    if (!result.success) {
      throw new Error(result.error.message);
    }

    items.push(...result.data.payments);
    total = result.data.total;
    totalPages = Math.min(result.data.totalPages, MAX_FETCH_PAGES);
    page += 1;
  }

  return { items, total };
};

const fetchAllProducts = async (): Promise<PagedCollection<Product>> => {
  const items: Product[] = [];
  let page = 1;
  let totalPages = 1;
  let total = 0;

  while (page <= totalPages && page <= MAX_FETCH_PAGES) {
    const result = await productService.getAll({ page, limit: PAGE_LIMIT });

    if (!result.success) {
      throw new Error(result.error.message);
    }

    items.push(...result.data.products);
    total = result.data.total;
    totalPages = Math.min(result.data.totalPages, MAX_FETCH_PAGES);
    page += 1;
  }

  return { items, total };
};

const getDefaultProfitRange = (): [Dayjs, Dayjs] => {
  const rangeEnd = dayjs().endOf('day');
  const rangeStart = rangeEnd
    .subtract(DEFAULT_PROFIT_RANGE_DAYS - 1, 'day')
    .startOf('day');
  return [rangeStart, rangeEnd];
};

const fetchAllProductCosts = async (
  products: readonly Product[]
): Promise<Record<string, number>> => {
  const entries = await Promise.all(
    products.map(async (product) => {
      const result = await stockService.getProductCost(product.id);
      if (!result.success) {
        return [product.id, 0] as const;
      }

      return [product.id, result.data.totalCost] as const;
    })
  );

  return Object.fromEntries(entries);
};

const getComparisonBarStyle = (
  value: number,
  maxAbsValue: number
): React.CSSProperties => {
  if (maxAbsValue <= 0 || value === 0) {
    return { height: '0%' };
  }

  const heightPercent = Math.max((Math.abs(value) / maxAbsValue) * 50, 3);
  const boundedHeight = Math.min(heightPercent, 50);

  if (value > 0) {
    return {
      height: `${boundedHeight}%`,
      bottom: '50%',
    };
  }

  return {
    height: `${boundedHeight}%`,
    top: '50%',
  };
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productCostById, setProductCostById] = useState<Record<string, number>>({});
  const [selectedProfitRange, setSelectedProfitRange] = useState<[Dayjs, Dayjs]>(
    () => getDefaultProfitRange()
  );

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [ordersData, paymentsData, productsData] = await Promise.all([
        fetchAllOrders(),
        fetchAllPayments(),
        fetchAllProducts(),
      ]);
      const productCosts = await fetchAllProductCosts(productsData.items);

      setSnapshot({
        orders: ordersData.items,
        payments: paymentsData.items,
        products: productsData.items,
        totals: {
          orders: ordersData.total,
          payments: paymentsData.total,
          products: productsData.total,
        },
      });
      setProductCostById(productCosts);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : t('errors.generic');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const dashboardData = useMemo(() => {
    if (!snapshot) {
      return null;
    }

    const now = dayjs();
    const todayStart = now.startOf('day');
    const yesterdayStart = todayStart.subtract(1, 'day');
    const currentPeriodStart = now.subtract(ACTIVE_CUSTOMER_DAYS, 'day').startOf('day');
    const previousPeriodStart = currentPeriodStart.subtract(ACTIVE_CUSTOMER_DAYS, 'day');
    const currentPeriodEnd = now.endOf('day').add(1, 'millisecond');

    const paidPayments = snapshot.payments.filter((payment) => payment.status === PaymentStatus.PAID);
    const paidSalesPayments = paidPayments.filter(
      (payment) => payment.paymentType === PaymentType.PAYMENT
    );

    const totalRevenue = paidPayments.reduce((sum, payment) => {
      const signedAmount =
        payment.paymentType === PaymentType.REFUND ? -payment.amount : payment.amount;
      return sum + signedAmount;
    }, 0);

    const currentPeriodOrders = snapshot.orders.filter((order) =>
      isBetweenRange(dayjs(order.createdAt), currentPeriodStart, currentPeriodEnd)
    );
    const previousPeriodOrders = snapshot.orders.filter((order) =>
      isBetweenRange(dayjs(order.createdAt), previousPeriodStart, currentPeriodStart)
    );

    const currentPeriodRevenue = paidPayments.reduce((sum, payment) => {
      const paymentDate = payment.paidAt ?? payment.createdAt;
      if (!isBetweenRange(dayjs(paymentDate), currentPeriodStart, currentPeriodEnd)) {
        return sum;
      }

      const signedAmount =
        payment.paymentType === PaymentType.REFUND ? -payment.amount : payment.amount;
      return sum + signedAmount;
    }, 0);

    const previousPeriodRevenue = paidPayments.reduce((sum, payment) => {
      const paymentDate = payment.paidAt ?? payment.createdAt;
      if (!isBetweenRange(dayjs(paymentDate), previousPeriodStart, currentPeriodStart)) {
        return sum;
      }

      const signedAmount =
        payment.paymentType === PaymentType.REFUND ? -payment.amount : payment.amount;
      return sum + signedAmount;
    }, 0);

    const getCustomerKey = (order: Order): string | null => {
      const phone = order.customerPhone?.trim();
      if (phone) {
        return `phone:${phone}`;
      }

      const name = order.customerName?.trim();
      if (name) {
        return `name:${name.toLowerCase()}`;
      }

      return null;
    };

    const recentCustomers = new Set<string>();
    const previousCustomers = new Set<string>();

    snapshot.orders.forEach((order) => {
      if (order.status === OrderStatus.DRAFT || order.status === OrderStatus.CANCELLED) {
        return;
      }

      const key = getCustomerKey(order);
      if (!key) {
        return;
      }

      const createdAt = dayjs(order.createdAt);
      if (isBetweenRange(createdAt, currentPeriodStart, currentPeriodEnd)) {
        recentCustomers.add(key);
      } else if (isBetweenRange(createdAt, previousPeriodStart, currentPeriodStart)) {
        previousCustomers.add(key);
      }
    });

    const activeCustomers = recentCustomers.size;
    const activeCustomersTrend = calculateTrend(activeCustomers, previousCustomers.size);

    const todayOrders = snapshot.orders.filter((order) =>
      isBetweenRange(dayjs(order.createdAt), todayStart, currentPeriodEnd)
    ).length;
    const yesterdayOrders = snapshot.orders.filter((order) =>
      isBetweenRange(dayjs(order.createdAt), yesterdayStart, todayStart)
    ).length;
    const todayOrdersTrend = calculateTrend(todayOrders, yesterdayOrders);

    const todayRevenue = paidPayments.reduce((sum, payment) => {
      const paymentDate = payment.paidAt ?? payment.createdAt;
      if (!isBetweenRange(dayjs(paymentDate), todayStart, currentPeriodEnd)) {
        return sum;
      }

      const signedAmount =
        payment.paymentType === PaymentType.REFUND ? -payment.amount : payment.amount;
      return sum + signedAmount;
    }, 0);

    const yesterdayRevenue = paidPayments.reduce((sum, payment) => {
      const paymentDate = payment.paidAt ?? payment.createdAt;
      if (!isBetweenRange(dayjs(paymentDate), yesterdayStart, todayStart)) {
        return sum;
      }

      const signedAmount =
        payment.paymentType === PaymentType.REFUND ? -payment.amount : payment.amount;
      return sum + signedAmount;
    }, 0);
    const todayRevenueTrend = calculateTrend(todayRevenue, yesterdayRevenue);

    const pendingOrders = snapshot.orders.filter((order) =>
      PENDING_ORDER_STATUSES.has(order.status)
    ).length;

    const pendingOrdersCurrentPeriod = currentPeriodOrders.filter((order) =>
      PENDING_ORDER_STATUSES.has(order.status)
    ).length;
    const pendingOrdersPreviousPeriod = previousPeriodOrders.filter((order) =>
      PENDING_ORDER_STATUSES.has(order.status)
    ).length;
    const pendingOrdersTrend = calculateTrend(
      pendingOrdersCurrentPeriod,
      pendingOrdersPreviousPeriod
    );

    const revenueSeries: RevenuePoint[] = Array.from({ length: CHART_DAYS }, (_, index) => {
      const date = now.subtract(CHART_DAYS - 1 - index, 'day').startOf('day');
      const key = date.format('YYYY-MM-DD');
      const value = paidSalesPayments.reduce((sum, payment) => {
        const paymentDate = dayjs(payment.paidAt ?? payment.createdAt).startOf('day');
        if (paymentDate.format('YYYY-MM-DD') !== key) {
          return sum;
        }

        return sum + payment.amount;
      }, 0);

      return {
        key,
        label: date.format('DD/MM'),
        value,
      };
    });

    const totalOrdersForDistribution = Math.max(snapshot.orders.length, 1);
    const statusDistribution: StatusDistributionPoint[] = Object.values(OrderStatus)
      .map((status) => {
        const count = snapshot.orders.filter((order) => order.status === status).length;
        return {
          status,
          count,
          percent: (count / totalOrdersForDistribution) * 100,
          color: ORDER_STATUS_COLORS[status],
        };
      })
      .filter((point) => point.count > 0);

    const methodTotalAmount = Math.max(
      paidSalesPayments.reduce((sum, payment) => sum + payment.amount, 0),
      1
    );
    const paymentMethodDistribution: PaymentMethodPoint[] = Object.values(PaymentMethod)
      .map((method) => {
        const methodPayments = paidSalesPayments.filter((payment) => payment.method === method);
        const amount = methodPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const count = methodPayments.length;

        return {
          method,
          amount,
          count,
          percent: (amount / methodTotalAmount) * 100,
          color: PAYMENT_METHOD_COLORS[method],
        };
      })
      .filter((point) => point.count > 0);

    const productMap = new Map<
      string,
      {
        productCode: string;
        productName: string;
        quantity: number;
        revenue: number;
      }
    >();

    snapshot.orders.forEach((order) => {
      if (order.status === OrderStatus.CANCELLED) {
        return;
      }

      (order.items ?? []).forEach((item) => {
        const existing = productMap.get(item.productId);
        const productCode = item.productCode ?? '--';
        const productName = item.productName ?? '';

        if (!existing) {
          productMap.set(item.productId, {
            productCode,
            productName,
            quantity: item.quantity,
            revenue: item.subtotal,
          });
          return;
        }

        productMap.set(item.productId, {
          ...existing,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.subtotal,
        });
      });
    });

    const topProductsRaw = Array.from(productMap.entries())
      .map(([key, value]) => ({
        key,
        ...value,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const topProductMaxQuantity = Math.max(topProductsRaw[0]?.quantity ?? 0, 1);
    const topProducts: TopProductPoint[] = topProductsRaw.map((product) => ({
      ...product,
      percent: (product.quantity / topProductMaxQuantity) * 100,
    }));

    const orderActivities: ActivityItem[] = [...snapshot.orders]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((order) => ({
        id: `order-${order.id}`,
        type: 'order',
        title: t('dashboard.activity.orderTitle', {
          orderNumber: order.orderNumber,
          defaultValue: `Order #${order.orderNumber}`,
        }),
        description: `${t(`orders.status.${order.status}`, order.status)} • ${formatCurrency(order.totalAmount)}`,
        timestamp: order.createdAt.toISOString(),
        status: getOrderActivityStatus(order.status),
      }));

    const paymentActivities: ActivityItem[] = [...snapshot.payments]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)
      .map((payment) => {
        const methodLabel = t(
          getPaymentMethodTranslationKey(payment.method),
          payment.method.toUpperCase()
        );
        const title =
          payment.paymentType === PaymentType.REFUND
            ? t('dashboard.activity.refundTitle', {
                defaultValue: 'Refund created',
              })
            : t('dashboard.activity.paymentTitle', {
                defaultValue: 'Payment updated',
              });

        return {
          id: `payment-${payment.id}`,
          type: 'payment' as const,
          title,
          description: `${methodLabel} • ${formatCurrency(payment.amount)}`,
          timestamp: payment.createdAt.toISOString(),
          status: getPaymentActivityStatus(payment.status),
        };
      });

    const productActivities: ActivityItem[] = [...snapshot.products]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 3)
      .map((product) => ({
        id: `product-${product.id}`,
        type: 'product',
        title: t('dashboard.activity.productTitle', {
          productName: product.name,
          defaultValue: `New product: ${product.name}`,
        }),
        description: formatCurrency(product.price),
        timestamp: product.createdAt.toISOString(),
        status: 'info',
      }));

    const recentActivities = [...orderActivities, ...paymentActivities, ...productActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    const profitComparison = buildProfitComparisonData({
      orders: snapshot.orders,
      payments: snapshot.payments,
      products: snapshot.products,
      productCostById,
      rangeStart: selectedProfitRange[0],
      rangeEnd: selectedProfitRange[1],
    });

    return {
      totalRevenue,
      activeCustomers,
      pendingOrders,
      todayOrders,
      todayRevenue,
      trends: {
        totalOrders: calculateTrend(currentPeriodOrders.length, previousPeriodOrders.length),
        totalRevenue: calculateTrend(currentPeriodRevenue, previousPeriodRevenue),
        activeCustomers: activeCustomersTrend,
        pendingOrders: pendingOrdersTrend,
        todayOrders: todayOrdersTrend,
        todayRevenue: todayRevenueTrend,
      },
      revenueSeries,
      statusDistribution,
      paymentMethodDistribution,
      topProducts,
      recentActivities,
      profitComparison,
    };
  }, [productCostById, selectedProfitRange, snapshot, t]);

  const isInitialLoading = loading && !snapshot;

  const stats = useMemo(() => {
    const trendLabel = t('dashboard.stats.vsPrevious30Days', 'vs previous 30 days');

    return [
      {
        title: t('dashboard.stats.totalOrders', 'Total Orders'),
        value: formatNumber(snapshot?.totals.orders ?? 0),
        icon: <ShoppingCartOutlined />,
        trend: {
          value: Math.abs(dashboardData?.trends.totalOrders ?? 0),
          isPositive: (dashboardData?.trends.totalOrders ?? 0) >= 0,
        },
        trendLabel,
        color: '#1890ff',
      },
      {
        title: t('dashboard.stats.totalRevenue', 'Total Revenue'),
        value: formatCurrency(dashboardData?.totalRevenue ?? 0),
        icon: <DollarOutlined />,
        trend: {
          value: Math.abs(dashboardData?.trends.totalRevenue ?? 0),
          isPositive: (dashboardData?.trends.totalRevenue ?? 0) >= 0,
        },
        trendLabel,
        color: '#52c41a',
      },
      {
        title: t('dashboard.stats.totalProducts', 'Total Products'),
        value: formatNumber(snapshot?.totals.products ?? 0),
        icon: <AppstoreOutlined />,
        color: '#fa8c16',
      },
      {
        title: t('dashboard.stats.activeCustomers', 'Active Customers'),
        value: formatNumber(dashboardData?.activeCustomers ?? 0),
        icon: <TeamOutlined />,
        trend: {
          value: Math.abs(dashboardData?.trends.activeCustomers ?? 0),
          isPositive: (dashboardData?.trends.activeCustomers ?? 0) >= 0,
        },
        trendLabel,
        color: '#13c2c2',
      },
    ];
  }, [dashboardData, snapshot, t]);

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        key: 'new-order',
        title: t('dashboard.quickActions.newOrder', 'New Order'),
        description: t('dashboard.quickActions.newOrderDescription', 'Create a new order'),
        icon: <PlusOutlined />,
        color: '#1890ff',
        onClick: () => navigate('/orders'),
      },
      {
        key: 'new-product',
        title: t('dashboard.quickActions.newProduct', 'New Product'),
        description: t('dashboard.quickActions.newProductDescription', 'Add a new product'),
        icon: <AppstoreOutlined />,
        color: '#52c41a',
        onClick: () => navigate('/products'),
      },
      {
        key: 'view-orders',
        title: t('dashboard.quickActions.viewOrders', 'View Orders'),
        description: t('dashboard.quickActions.viewOrdersDescription', 'Manage all orders'),
        icon: <FileTextOutlined />,
        color: '#fa8c16',
        onClick: () => navigate('/orders'),
      },
      {
        key: 'view-payments',
        title: t('dashboard.quickActions.viewPayments', 'View Payments'),
        description: t('dashboard.quickActions.viewPaymentsDescription', 'Check payment status'),
        icon: <DollarOutlined />,
        color: '#722ed1',
        onClick: () => navigate('/payments'),
      },
    ],
    [navigate, t]
  );

  const handleActivityClick = (item: ActivityItem) => {
    if (item.type === 'order') {
      navigate('/orders');
      return;
    }

    if (item.type === 'payment') {
      navigate('/payments');
      return;
    }

    navigate('/products');
  };

  const handleProfitRangeChange = (range: [Dayjs | null, Dayjs | null] | null) => {
    if (!range || !range[0] || !range[1]) {
      setSelectedProfitRange(getDefaultProfitRange());
      return;
    }

    const nextStart = range[0].startOf('day');
    const nextEnd = range[1].endOf('day');

    if (nextEnd.isBefore(nextStart)) {
      setSelectedProfitRange([nextEnd.startOf('day'), nextStart.endOf('day')]);
      return;
    }

    setSelectedProfitRange([nextStart, nextEnd]);
  };

  const maxRevenueValue = Math.max(...(dashboardData?.revenueSeries.map((point) => point.value) ?? [0]), 0);
  const maxProfitComparisonAbsValue = (dashboardData?.profitComparison.points ?? []).reduce(
    (max, point) => Math.max(max, Math.abs(point.revenue), Math.abs(point.estimatedProfit)),
    0
  );

  return (
    <div className="dashboard-page">
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        subtitle={t('dashboard.welcome', "Welcome back! Here's what's happening with your bakery.")}
        extra={
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadDashboardData()}>
            {t('common.actions.refresh', 'Refresh')}
          </Button>
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          className="dashboard-alert"
          message={t('dashboard.loadFailed', 'Failed to load dashboard data')}
          description={error}
          action={
            <Button size="small" onClick={() => void loadDashboardData()}>
              {t('common.actions.retry', 'Retry')}
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} className="dashboard-section dashboard-stats-row">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index} className="dashboard-stretch-col">
            <StatCard {...stat} loading={isInitialLoading} className="dashboard-stat-card" />
          </Col>
        ))}
      </Row>

      <div className="dashboard-section">
        <QuickActions
          actions={quickActions}
          title={t('dashboard.quickActionsTitle', 'Quick Actions')}
        />
      </div>

      <Row gutter={[16, 16]} className="dashboard-section dashboard-chart-row">
        <Col xs={24} lg={14} className="dashboard-stretch-col">
          <Card
            bordered={false}
            className="dashboard-chart-card dashboard-surface-card"
            title={t('dashboard.charts.revenueLast7Days', 'Revenue (Last 7 days)')}
            extra={
              <div className="dashboard-inline-metrics">
                <Text type="secondary">
                  {t('dashboard.stats.todayOrders', "Today's orders")}:{' '}
                  <Text strong>{formatNumber(dashboardData?.todayOrders ?? 0)}</Text>
                </Text>
                <Text type="secondary">
                  {t('dashboard.stats.todayRevenue', "Today's revenue")}:{' '}
                  <Text strong>{formatCurrency(dashboardData?.todayRevenue ?? 0)}</Text>
                </Text>
              </div>
            }
          >
            {isInitialLoading ? (
              <div className="dashboard-chart-loading">
                <Spin />
              </div>
            ) : (dashboardData?.revenueSeries.length ?? 0) === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.charts.noData', 'No data')}
              />
            ) : (
              <div className="dashboard-revenue-chart">
                {dashboardData?.revenueSeries.map((point) => {
                  const heightPercent =
                    maxRevenueValue > 0 ? Math.max((point.value / maxRevenueValue) * 100, 6) : 0;

                  return (
                    <div key={point.key} className="dashboard-revenue-bar-item">
                      <Tooltip title={formatCurrency(point.value)}>
                        <div className="dashboard-revenue-bar-track">
                          <div
                            className="dashboard-revenue-bar-fill"
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      </Tooltip>
                      <Text type="secondary" className="dashboard-revenue-bar-label">
                        {point.label}
                      </Text>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10} className="dashboard-stretch-col">
          <Card
            bordered={false}
            className="dashboard-chart-card dashboard-surface-card"
            title={t('dashboard.charts.ordersByStatus', 'Orders by status')}
            extra={
              <Text type="secondary">
                {formatNumber(snapshot?.totals.orders ?? 0)} {t('orders.title', 'orders')}
              </Text>
            }
          >
            {isInitialLoading ? (
              <div className="dashboard-chart-loading">
                <Spin />
              </div>
            ) : (dashboardData?.statusDistribution.length ?? 0) === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.charts.noData', 'No data')}
              />
            ) : (
              <div className="dashboard-distribution-list">
                {dashboardData?.statusDistribution.map((point) => (
                  <div className="dashboard-distribution-item" key={point.status}>
                    <div className="dashboard-distribution-header">
                      <Text>{t(`orders.status.${point.status}`, point.status)}</Text>
                      <Text type="secondary">
                        {formatNumber(point.count)} ({point.percent.toFixed(1)}%)
                      </Text>
                    </div>
                    <Progress
                      percent={point.percent}
                      showInfo={false}
                      strokeColor={point.color}
                      trailColor="#f0f0f0"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dashboard-section dashboard-chart-row">
        <Col xs={24} className="dashboard-stretch-col">
          <Card
            bordered={false}
            className="dashboard-chart-card dashboard-surface-card"
            title={t(
              'dashboard.charts.revenueVsEstimatedProfit',
              'Revenue vs estimated profit'
            )}
            extra={
              <div className="dashboard-profit-chart-extra">
                <RangePicker
                  allowClear
                  value={selectedProfitRange}
                  onChange={handleProfitRangeChange}
                  format="DD/MM/YYYY"
                  className="dashboard-profit-range-picker"
                  placeholder={[
                    t('dashboard.charts.startDate', 'Start date'),
                    t('dashboard.charts.endDate', 'End date'),
                  ]}
                />
                <div className="dashboard-inline-metrics dashboard-profit-inline-metrics">
                  <Text type="secondary">
                    {t('dashboard.charts.totalRevenueInRange', 'Revenue: {{value}}', {
                      value: formatCurrency(
                        dashboardData?.profitComparison.totals.revenue ?? 0
                      ),
                    })}
                  </Text>
                  <Text type="secondary">
                    {t(
                      'dashboard.charts.totalEstimatedProfitInRange',
                      'Estimated profit: {{value}}',
                      {
                        value: formatCurrency(
                          dashboardData?.profitComparison.totals.estimatedProfit ?? 0
                        ),
                      }
                    )}
                  </Text>
                </div>
              </div>
            }
          >
            {isInitialLoading ? (
              <div className="dashboard-chart-loading">
                <Spin />
              </div>
            ) : (dashboardData?.profitComparison.points.length ?? 0) === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.charts.noData', 'No data')}
              />
            ) : (
              <>
                <div className="dashboard-profit-legend">
                  <div className="dashboard-profit-legend-item">
                    <span className="dashboard-profit-legend-dot dashboard-profit-legend-dot--revenue" />
                    <Text>{t('dashboard.charts.seriesRevenue', 'Revenue')}</Text>
                  </div>
                  <div className="dashboard-profit-legend-item">
                    <span className="dashboard-profit-legend-dot dashboard-profit-legend-dot--profit" />
                    <Text>{t('dashboard.charts.seriesEstimatedProfit', 'Estimated profit')}</Text>
                  </div>
                </div>
                <div className="dashboard-profit-chart">
                  {dashboardData?.profitComparison.points.map((point) => (
                    <div key={point.key} className="dashboard-profit-bar-item">
                      <div className="dashboard-profit-bar-track">
                        <div className="dashboard-profit-baseline" />
                        <div className="dashboard-profit-bar-column">
                          <Tooltip
                            title={`${t('dashboard.charts.seriesRevenue', 'Revenue')}: ${formatCurrency(
                              point.revenue
                            )}`}
                          >
                            <div
                              className={`dashboard-profit-bar dashboard-profit-bar--revenue ${
                                point.revenue < 0 ? 'is-negative' : ''
                              }`}
                              style={getComparisonBarStyle(
                                point.revenue,
                                maxProfitComparisonAbsValue
                              )}
                            />
                          </Tooltip>
                        </div>
                        <div className="dashboard-profit-bar-column">
                          <Tooltip
                            title={`${t(
                              'dashboard.charts.seriesEstimatedProfit',
                              'Estimated profit'
                            )}: ${formatCurrency(point.estimatedProfit)}`}
                          >
                            <div
                              className={`dashboard-profit-bar dashboard-profit-bar--profit ${
                                point.estimatedProfit < 0 ? 'is-negative' : ''
                              }`}
                              style={getComparisonBarStyle(
                                point.estimatedProfit,
                                maxProfitComparisonAbsValue
                              )}
                            />
                          </Tooltip>
                        </div>
                      </div>
                      <Text type="secondary" className="dashboard-revenue-bar-label">
                        {point.label}
                      </Text>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dashboard-section dashboard-chart-row">
        <Col xs={24} lg={12} className="dashboard-stretch-col">
          <Card
            bordered={false}
            className="dashboard-chart-card dashboard-surface-card"
            title={t('dashboard.charts.paymentMethods', 'Payment methods')}
            extra={
              <Text type="secondary">
                {formatNumber(snapshot?.totals.payments ?? 0)} {t('payments.title', 'payments')}
              </Text>
            }
          >
            {isInitialLoading ? (
              <div className="dashboard-chart-loading">
                <Spin />
              </div>
            ) : (dashboardData?.paymentMethodDistribution.length ?? 0) === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.charts.noData', 'No data')}
              />
            ) : (
              <div className="dashboard-distribution-list">
                {dashboardData?.paymentMethodDistribution.map((point) => (
                  <div className="dashboard-distribution-item" key={point.method}>
                    <div className="dashboard-distribution-header">
                      <Text>{t(getPaymentMethodTranslationKey(point.method), point.method)}</Text>
                      <Text type="secondary">
                        {formatCurrency(point.amount)} ({point.percent.toFixed(1)}%)
                      </Text>
                    </div>
                    <Progress
                      percent={point.percent}
                      showInfo={false}
                      strokeColor={point.color}
                      trailColor="#f0f0f0"
                    />
                    <Text type="secondary">
                      {t('dashboard.charts.transactions', '{{count}} transactions', {
                        count: point.count,
                      })}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12} className="dashboard-stretch-col">
          <Card
            bordered={false}
            className="dashboard-chart-card dashboard-surface-card"
            title={t('dashboard.charts.topProductsByQuantity', 'Top products by quantity')}
          >
            {isInitialLoading ? (
              <div className="dashboard-chart-loading">
                <Spin />
              </div>
            ) : (dashboardData?.topProducts.length ?? 0) === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.charts.noData', 'No data')}
              />
            ) : (
              <div className="dashboard-distribution-list">
                {dashboardData?.topProducts.map((product) => (
                  <div className="dashboard-distribution-item" key={product.key}>
                    <div className="dashboard-distribution-header">
                      <div className="dashboard-product-name">
                        <Text strong>
                          {product.productName || t('dashboard.charts.unknownProduct', 'Unknown product')}
                        </Text>
                        <Text type="secondary">{product.productCode}</Text>
                      </div>
                      <Text type="secondary">
                        {formatNumber(product.quantity)} {t('dashboard.charts.units', 'units')}
                      </Text>
                    </div>
                    <Progress
                      percent={product.percent}
                      showInfo={false}
                      strokeColor="#1677ff"
                      trailColor="#f0f0f0"
                    />
                    <Text type="secondary">{formatCurrency(product.revenue)}</Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="dashboard-section dashboard-bottom-row">
        <Col xs={24} lg={12} className="dashboard-stretch-col">
          <RecentActivity
            title={t('dashboard.recentActivity', 'Recent activity')}
            emptyText={t('dashboard.charts.noData', 'No data')}
            items={dashboardData?.recentActivities ?? []}
            loading={isInitialLoading}
            onItemClick={handleActivityClick}
          />
        </Col>
        <Col xs={24} lg={12} className="dashboard-stretch-col">
          <div className="dashboard-fill-card">
            <LowStockDashboard />
          </div>
        </Col>
      </Row>
    </div>
  );
};
