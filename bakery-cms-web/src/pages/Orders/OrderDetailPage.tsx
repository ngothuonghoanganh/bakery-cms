/**
 * OrderDetailPage
 * Container page for viewing and managing a single order
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderDetail } from '../../components/features/orders/OrderDetail/OrderDetail';
import { OrderForm } from '../../components/features/orders/OrderForm/OrderForm';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState/EmptyState';
import { useModal } from '../../hooks/useModal';
import { useNotification } from '../../hooks/useNotification';
import {
  getOrderById,
  updateOrder,
  deleteOrder,
  confirmOrder,
  cancelOrder,
} from '../../services/order.service';
import type { Order } from '../../types/models/order.model';
import type { OrderFormValues } from '../../components/features/orders/OrderForm/OrderForm.types';

export const OrderDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { visible, open, close } = useModal();
  const { success, error: showError } = useNotification();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getOrderById(id);

        if (result.success) {
          setOrder(result.data);
        } else {
          showError(result.error.message);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t('orders.notifications.operationFailed', 'Failed to fetch order');
        showError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, showError, t]);

  // Handle edit order
  const handleEdit = () => {
    open();
  };

  // Handle update order
  const handleUpdate = async (values: OrderFormValues) => {
    if (!order) return;

    try {
      setSubmitting(true);

      // Convert form values to update payload
      const updatePayload = {
        orderType: values.orderType,
        businessModel: values.businessModel,
        customerName: values.customerName || undefined,
        customerPhone: values.customerPhone || undefined,
        notes: values.notes || undefined,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        status: values.status,
      };

      const result = await updateOrder(order.id, updatePayload);

      if (result.success) {
        setOrder(result.data);
        success(t('orders.notifications.updated', 'Order updated successfully'));
        close();
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('orders.notifications.operationFailed', 'Failed to update order');
      showError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete order
  const handleDelete = async () => {
    if (!order) return;

    try {
      const result = await deleteOrder(order.id);

      if (result.success) {
        success(t('orders.notifications.deleted', 'Order deleted successfully'));
        navigate('/orders');
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('orders.notifications.deleteFailed', 'Failed to delete order');
      showError(message);
    }
  };

  // Handle confirm order
  const handleConfirm = async () => {
    if (!order) return;

    try {
      const result = await confirmOrder(order.id);

      if (result.success) {
        setOrder(result.data);
        success(t('orders.notifications.confirmed', 'Order confirmed successfully'));
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('orders.notifications.confirmFailed', 'Failed to confirm order');
      showError(message);
    }
  };

  // Handle cancel order
  const handleCancel = async () => {
    if (!order) return;

    try {
      const result = await cancelOrder(order.id);

      if (result.success) {
        setOrder(result.data);
        success(t('orders.notifications.cancelled', 'Order cancelled successfully'));
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('orders.notifications.cancelFailed', 'Failed to cancel order');
      showError(message);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/orders');
  };

  // Convert order to form initial values
  const getFormInitialValues = (): OrderFormValues | undefined => {
    if (!order) return undefined;

    return {
      orderType: order.orderType,
      businessModel: order.businessModel,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      notes: order.notes || '',
      items:
        order.items?.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) || [],
      status: order.status,
    };
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Order not found
  if (!order) {
    return <EmptyState description={t('orders.list.noOrders', "The order you're looking for doesn't exist.")} />;
  }

  return (
    <>
      <OrderDetail
        order={order}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        onBack={handleBack}
      />

      <OrderForm
        open={visible}
        onClose={close}
        onSubmit={handleUpdate}
        initialValues={getFormInitialValues()}
        loading={submitting}
      />
    </>
  );
};
