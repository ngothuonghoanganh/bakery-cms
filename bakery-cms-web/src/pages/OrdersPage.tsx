/**
 * OrdersPage
 * Container page for managing orders
 */

import React, { useState } from 'react';
import { OrderList } from '../components/features/orders/OrderList/OrderList';
import { useOrders } from '../hooks/useOrders';
import { createOrder, updateOrder, deleteOrder, confirmOrder, cancelOrder } from '../services/order.service';
import type { OrderFiltersValue } from '../components/features/orders/OrderFilters/OrderFilters.types';
import type { OrderFormValues } from '../components/features/orders/OrderForm/OrderForm.types';

export const OrdersPage: React.FC = () => {
  // Filters state
  const [filters, setFilters] = useState<OrderFiltersValue>({});

  // Fetch orders with filters
  const { orders, loading, refetch } = useOrders({
    filters: {
      status: filters.status,
      orderType: filters.orderType,
      businessModel: filters.businessModel,
      customerPhone: filters.search, // Use search for customer phone
      dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
      dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
    },
    autoFetch: true,
  });

  // Handle filters change
  const handleFiltersChange = (newFilters: OrderFiltersValue) => {
    setFilters(newFilters);
  };

  // Handle filters reset
  const handleFiltersReset = () => {
    setFilters({});
  };

  // Handle create order
  const handleCreate = async (values: OrderFormValues) => {
    const result = await createOrder({
      orderType: values.orderType,
      businessModel: values.businessModel,
      customerName: values.customerName || undefined,
      customerPhone: values.customerPhone || undefined,
      notes: values.notes || undefined,
      items: values.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    if (result.success) {
      refetch();
    } else {
      throw new Error(result.error.message);
    }
  };

  // Handle update order
  const handleUpdate = async (id: string, values: OrderFormValues) => {
    const result = await updateOrder(id, {
      customerName: values.customerName || undefined,
      customerPhone: values.customerPhone || undefined,
      notes: values.notes || undefined,
      items: values.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });

    if (result.success) {
      refetch();
    } else {
      throw new Error(result.error.message);
    }
  };

  // Handle delete order
  const handleDelete = async (id: string) => {
    const result = await deleteOrder(id);

    if (result.success) {
      refetch();
    } else {
      throw new Error(result.error.message);
    }
  };

  // Handle confirm order
  const handleConfirm = async (id: string) => {
    const result = await confirmOrder(id);

    if (result.success) {
      refetch();
    } else {
      throw new Error(result.error.message);
    }
  };

  // Handle cancel order
  const handleCancel = async (id: string) => {
    const result = await cancelOrder(id);

    if (result.success) {
      refetch();
    } else {
      throw new Error(result.error.message);
    }
  };

  return (
    <OrderList
      orders={orders}
      loading={loading}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onFiltersReset={handleFiltersReset}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};
