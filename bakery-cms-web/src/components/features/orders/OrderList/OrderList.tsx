/**
 * OrderList component
 * Orchestrates OrderTable, OrderForm, and OrderFilters
 */

import React, { useState } from 'react';
import { Button, Image, Modal, Select, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PaymentMethod, PaymentType } from '@bakery-cms/common';
import { OrderTable } from '../OrderTable/OrderTable';
import { OrderForm } from '../OrderForm/OrderForm';
import { OrderFilters } from '../OrderFilters/OrderFilters';
import { PageHeader } from '../../../shared/PageHeader/PageHeader';
import { useModal } from '../../../../hooks/useModal';
import { useNotification } from '../../../../hooks/useNotification';
import { useCrudErrorNotification } from '../../../../hooks/useCrudErrorNotification';
import type { Order } from '../../../../types/models/order.model';
import type { VietQRData } from '../../../../types/models/payment.model';
import type { OrderFormValues } from '../OrderForm/OrderForm.types';
import type { OrderFiltersValue } from '../OrderFilters/OrderFilters.types';

const { Text } = Typography;

export type OrderListProps = {
  orders: Order[];
  loading: boolean;
  filters: OrderFiltersValue;
  onFiltersChange: (filters: OrderFiltersValue) => void;
  onFiltersReset: () => void;
  onCreate: (values: OrderFormValues) => Promise<void>;
  onUpdate: (id: string, values: OrderFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onConfirm: (id: string, paymentMethod: PaymentMethod) => Promise<{ vietqr: VietQRData | null }>;
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
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [confirmingPaymentMethod, setConfirmingPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [vietQRData, setVietQRData] = useState<VietQRData | null>(null);
  const [vietQRModalVisible, setVietQRModalVisible] = useState(false);

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
      showCrudError(error);
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
      showCrudError(error);
    }
  };

  const openConfirmModal = (orderId: string) => {
    setConfirmingOrderId(orderId);
    setConfirmingPaymentMethod(PaymentMethod.CASH);
  };

  const closeConfirmModal = () => {
    if (confirmingPayment) {
      return;
    }
    setConfirmingOrderId(null);
  };

  // Handle confirm order with payment method
  const handleConfirm = async () => {
    if (!confirmingOrderId) {
      return;
    }

    try {
      setConfirmingPayment(true);
      const result = await onConfirm(confirmingOrderId, confirmingPaymentMethod);

      success(t('orders.notifications.confirmed', 'Order confirmed successfully'));

      setConfirmingOrderId(null);

      if (result.vietqr?.qrDataURL) {
        setVietQRData(result.vietqr);
        setVietQRModalVisible(true);
      }
    } catch (error) {
      showCrudError(error);
    } finally {
      setConfirmingPayment(false);
    }
  };

  // Handle cancel order
  const handleCancel = async (orderId: string) => {
    try {
      await onCancel(orderId);
      success(t('orders.notifications.cancelled', 'Order cancelled successfully'));
    } catch (error) {
      showCrudError(error);
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
      customerAddress: selectedOrder.customerAddress || '',
      notes: selectedOrder.notes || '',
      items:
        selectedOrder.items?.map((item) => ({
          productId: item.productId,
          saleUnitType: item.saleUnitType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || '',
        })) || [],
      extraFees:
        selectedOrder.extraFees?.map((fee) => ({
          id: fee.id,
          name: fee.name,
          amount: fee.amount,
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
        onConfirm={openConfirmModal}
        onCancel={handleCancel}
      />

      <Modal
        title={t('orders.confirm.selectPaymentMethodTitle')}
        open={Boolean(confirmingOrderId)}
        onCancel={closeConfirmModal}
        onOk={handleConfirm}
        okText={t('orders.actions.confirmOrder')}
        cancelText={t('orders.confirm.no')}
        confirmLoading={confirmingPayment}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <Text>{t('orders.confirm.paymentMethodDescription')}</Text>
          <div>
            <Text strong>{t('payments.detail.paymentType')}</Text>
          </div>
          <Select<PaymentType>
            value={PaymentType.PAYMENT}
            disabled
            options={[{ value: PaymentType.PAYMENT, label: t('payments.type.payment') }]}
            style={{ width: '100%' }}
          />
          <div>
            <Text strong>{t('orders.confirm.paymentMethodLabel')}</Text>
          </div>
          <Select<PaymentMethod>
            value={confirmingPaymentMethod}
            onChange={setConfirmingPaymentMethod}
            options={[
              { value: PaymentMethod.CASH, label: t('payments.method.cash') },
              { value: PaymentMethod.BANK_TRANSFER, label: t('payments.method.bankTransfer') },
              { value: PaymentMethod.VIETQR, label: t('payments.method.vietqr') },
            ]}
            style={{ width: '100%' }}
          />
        </div>
      </Modal>

      <Modal
        title={t('orders.confirm.vietqrTitle')}
        open={vietQRModalVisible}
        onCancel={() => {
          setVietQRModalVisible(false);
          setVietQRData(null);
        }}
        footer={null}
      >
        <div style={{ display: 'grid', gap: 12, textAlign: 'center' }}>
          <Text>{t('orders.confirm.vietqrDescription')}</Text>
          {vietQRData?.qrDataURL && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Image src={vietQRData.qrDataURL} width={280} preview={false} />
            </div>
          )}
          {vietQRData && (
            <div style={{ display: 'grid', gap: 4 }}>
              <Text>{vietQRData.accountName}</Text>
              <Text>{vietQRData.accountNo}</Text>
              <Text>{vietQRData.addInfo}</Text>
            </div>
          )}
        </div>
      </Modal>

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
