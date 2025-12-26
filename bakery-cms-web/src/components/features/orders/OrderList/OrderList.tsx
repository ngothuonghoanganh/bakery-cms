/**
 * OrderList component
 * Orchestrates OrderTable, OrderForm, and OrderFilters
 */

import React, { useState } from 'react';
import { Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { OrderTable } from '../OrderTable/OrderTable';
import { OrderForm } from '../OrderForm/OrderForm';
import { OrderFilters } from '../OrderFilters/OrderFilters';
import { PageHeader } from '../../../shared/PageHeader/PageHeader';
import { useModal } from '../../../../hooks/useModal';
import { useNotification } from '../../../../hooks/useNotification';
import type { Order } from '../../../../types/models/order.model';
import type { OrderFormValues } from '../OrderForm/OrderForm.types';
import type { OrderFiltersValue } from '../OrderFilters/OrderFilters.types';

export type OrderListProps = {
  orders: Order[];
  loading: boolean;
  filters: OrderFiltersValue;
  onFiltersChange: (filters: OrderFiltersValue) => void;
  onFiltersReset: () => void;
  onCreate: (values: OrderFormValues) => Promise<void>;
  onUpdate: (id: string, values: OrderFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConfirm: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
};

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading,
  filters,
  onFiltersChange,
  onFiltersReset,
  onCreate,
  onUpdate,
  onDelete,
  onConfirm,
  onCancel,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { visible, open, close } = useModal();
  const { success, error: showError } = useNotification();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Handle create order
  const handleCreate = () => {
    setSelectedOrder(null);
    open();
  };

  // Handle edit order
  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    open();
  };

  // Handle view order
  const handleView = (order: Order) => {
    navigate(`/orders/${order.id}`);
  };

  // Handle form submit
  const handleFormSubmit = async (values: OrderFormValues) => {
    try {
      setSubmitting(true);

      if (selectedOrder) {
        await onUpdate(selectedOrder.id, values);
        success(t('orders.notifications.updated', 'Order updated successfully'));
      } else {
        await onCreate(values);
        success(t('orders.notifications.created', 'Order created successfully'));
      }

      close();
      setSelectedOrder(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('orders.notifications.operationFailed', 'Operation failed');
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete order
  const handleDelete = async (orderId: string) => {
    try {
      await onDelete(orderId);
      success(t('orders.notifications.deleted', 'Order deleted successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('orders.notifications.deleteFailed', 'Failed to delete order');
      showError(message);
    }
  };

  // Handle confirm order
  const handleConfirm = async (orderId: string) => {
    try {
      await onConfirm(orderId);
      success(t('orders.notifications.confirmed', 'Order confirmed successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('orders.notifications.confirmFailed', 'Failed to confirm order');
      showError(message);
    }
  };

  // Handle cancel order
  const handleCancel = async (orderId: string) => {
    try {
      await onCancel(orderId);
      success(t('orders.notifications.cancelled', 'Order cancelled successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('orders.notifications.cancelFailed', 'Failed to cancel order');
      showError(message);
    }
  };

  // Convert order to form initial values
  const getFormInitialValues = (): OrderFormValues | undefined => {
    if (!selectedOrder) return undefined;

    return {
      orderType: selectedOrder.orderType,
      businessModel: selectedOrder.businessModel,
      customerName: selectedOrder.customerName || '',
      customerPhone: selectedOrder.customerPhone || '',
      notes: selectedOrder.notes || '',
      items:
        selectedOrder.items?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      status: selectedOrder.status,
    };
  };

  return (
    <>
      <PageHeader
        title={t('orders.title')}
        subtitle={t('orders.subtitle')}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('orders.add')}
            </Button>
          </Space>
        }
      />

      <OrderFilters value={filters} onChange={onFiltersChange} onReset={onFiltersReset} />

      <OrderTable
        orders={orders}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <OrderForm
        open={visible}
        onClose={close}
        onSubmit={handleFormSubmit}
        initialValues={getFormInitialValues()}
        loading={submitting}
      />
    </>
  );
};
