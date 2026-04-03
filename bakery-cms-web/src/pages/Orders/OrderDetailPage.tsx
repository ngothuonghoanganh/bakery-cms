/**
 * OrderDetailPage
 * Container page for viewing and managing a single order
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Form, Image, Input, InputNumber, Modal, Select, Space, Spin, Table, Tag, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { PaymentMethod, PaymentStatus, PaymentType } from '@bakery-cms/common';
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
import { getAllPayments, refundOrderPayment } from '../../services/payment.service';
import type { Order } from '../../types/models/order.model';
import type { Payment, VietQRData } from '../../types/models/payment.model';
import type { OrderFormValues } from '../../components/features/orders/OrderForm/OrderForm.types';
import type { ColumnsType } from 'antd/es/table';
import { formatCurrency, formatDateTime } from '../../utils/format.utils';

const { Text } = Typography;

type RefundFormValues = {
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
};

export const OrderDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { visible, open, close } = useModal();
  const { success, error: showError } = useNotification();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmPaymentMethod, setConfirmPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [vietQRData, setVietQRData] = useState<VietQRData | null>(null);
  const [vietQRModalVisible, setVietQRModalVisible] = useState(false);
  const [paymentsModalVisible, setPaymentsModalVisible] = useState(false);
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [orderPaymentsLoading, setOrderPaymentsLoading] = useState(false);
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [loadingRefundable, setLoadingRefundable] = useState(false);
  const [refundableAmount, setRefundableAmount] = useState(0);
  const [refundForm] = Form.useForm<RefundFormValues>();

  const paymentColumns: ColumnsType<Payment> = useMemo(
    () => [
      {
        title: t('payments.table.paymentId'),
        dataIndex: 'id',
        key: 'id',
        ellipsis: true,
      },
      {
        title: t('payments.table.amount'),
        dataIndex: 'amount',
        key: 'amount',
        width: 140,
        align: 'right',
        render: (amount: number) => formatCurrency(amount),
      },
      {
        title: t('payments.table.paymentType'),
        dataIndex: 'paymentType',
        key: 'paymentType',
        width: 130,
        render: (paymentType: PaymentType) => {
          const labelMap: Record<PaymentType, string> = {
            [PaymentType.PAYMENT]: t('payments.type.payment'),
            [PaymentType.REFUND]: t('payments.type.refund'),
          };

          return (
            <Tag color={paymentType === PaymentType.REFUND ? 'magenta' : 'blue'}>
              {labelMap[paymentType] || paymentType}
            </Tag>
          );
        },
      },
      {
        title: t('payments.table.method'),
        dataIndex: 'method',
        key: 'method',
        width: 140,
        render: (method: PaymentMethod) => {
          const labelMap: Record<PaymentMethod, string> = {
            [PaymentMethod.CASH]: t('payments.method.cash'),
            [PaymentMethod.VIETQR]: t('payments.method.vietqr'),
            [PaymentMethod.BANK_TRANSFER]: t('payments.method.bankTransfer'),
          };
          return labelMap[method] || method;
        },
      },
      {
        title: t('payments.table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (status: PaymentStatus) => {
          const statusColorMap: Record<PaymentStatus, string> = {
            [PaymentStatus.PENDING]: 'warning',
            [PaymentStatus.PAID]: 'success',
            [PaymentStatus.FAILED]: 'error',
            [PaymentStatus.CANCELLED]: 'default',
          };
          const labelMap: Record<PaymentStatus, string> = {
            [PaymentStatus.PENDING]: t('payments.status.pending'),
            [PaymentStatus.PAID]: t('payments.status.paid'),
            [PaymentStatus.FAILED]: t('payments.status.failed'),
            [PaymentStatus.CANCELLED]: t('payments.status.cancelled'),
          };
          return <Tag color={statusColorMap[status]}>{labelMap[status] || status}</Tag>;
        },
      },
      {
        title: t('payments.table.createdAt'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (createdAt: Date) => formatDateTime(createdAt),
      },
      {
        title: t('payments.table.actions'),
        key: 'actions',
        width: 120,
        render: (_, record) => (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setPaymentsModalVisible(false);
              navigate(`/payments/${record.id}`);
            }}
          >
            {t('payments.actions.view')}
          </Button>
        ),
      },
    ],
    [navigate, t]
  );

  const toMoney = (value: number): number => Math.round(value * 100) / 100;

  const calculateRefundableAmount = (payments: Payment[]): number => {
    const totalPaid = payments
      .filter(
        (payment) =>
          payment.paymentType === PaymentType.PAYMENT &&
          payment.status === PaymentStatus.PAID
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    const totalRefunded = payments
      .filter(
        (payment) =>
          payment.paymentType === PaymentType.REFUND &&
          payment.status === PaymentStatus.PAID
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    return Math.max(toMoney(totalPaid - totalRefunded), 0);
  };

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

  const openConfirmModal = () => {
    setConfirmPaymentMethod(PaymentMethod.CASH);
    setConfirmModalVisible(true);
  };

  const closeConfirmModal = () => {
    if (confirmingPayment) {
      return;
    }
    setConfirmModalVisible(false);
  };

  // Handle confirm order
  const handleConfirm = async () => {
    if (!order) return;

    try {
      setConfirmingPayment(true);
      const result = await confirmOrder(order.id, confirmPaymentMethod);

      if (result.success) {
        setOrder(result.data.order);
        setConfirmModalVisible(false);
        success(t('orders.notifications.confirmed', 'Order confirmed successfully'));

        if (result.data.vietqr?.qrDataURL) {
          setVietQRData(result.data.vietqr);
          setVietQRModalVisible(true);
        }
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('orders.notifications.confirmFailed', 'Failed to confirm order');
      showError(message);
    } finally {
      setConfirmingPayment(false);
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

  const handleViewPayments = async () => {
    if (!order) return;

    setPaymentsModalVisible(true);
    setOrderPaymentsLoading(true);
    setOrderPayments([]);

    try {
      const result = await getAllPayments({ orderId: order.id });
      if (result.success) {
        setOrderPayments([...(result.data.payments || [])]);
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('payments.notifications.operationFailed', 'Failed to fetch payments');
      showError(message);
    } finally {
      setOrderPaymentsLoading(false);
    }
  };

  const openRefundModal = async () => {
    if (!order) return;

    try {
      setLoadingRefundable(true);
      const result = await getAllPayments({ orderId: order.id });

      if (!result.success) {
        showError(result.error.message);
        return;
      }

      const refundable = calculateRefundableAmount(result.data.payments || []);
      if (refundable <= 0) {
        showError(
          t(
            'orders.refund.noRefundableBalance',
            'No refundable amount remaining for this order.'
          )
        );
        return;
      }

      setRefundableAmount(refundable);
      refundForm.setFieldsValue({
        amount: refundable,
        method: PaymentMethod.BANK_TRANSFER,
        transactionId: '',
        notes: '',
      });
      setRefundModalVisible(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t(
              'orders.notifications.operationFailed',
              'Failed to calculate refundable amount'
            );
      showError(message);
    } finally {
      setLoadingRefundable(false);
    }
  };

  const handleRefund = async (values: RefundFormValues) => {
    if (!order) return;

    try {
      setRefundSubmitting(true);

      const payload = {
        amount: toMoney(values.amount),
        method: values.method,
        transactionId: values.transactionId?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };

      const result = await refundOrderPayment(order.id, payload);

      if (result.success) {
        success(t('orders.notifications.refunded', 'Refund created successfully'));
        setRefundModalVisible(false);
        refundForm.resetFields();

        const refreshedOrder = await getOrderById(order.id);
        if (refreshedOrder.success) {
          setOrder(refreshedOrder.data);
        }

        if (paymentsModalVisible) {
          await handleViewPayments();
        }
      } else {
        showError(result.error.message);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t('orders.notifications.refundFailed', 'Failed to create refund');
      showError(message);
    } finally {
      setRefundSubmitting(false);
    }
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
        onConfirm={openConfirmModal}
        onCancel={handleCancel}
        onViewPayments={handleViewPayments}
        onRefund={openRefundModal}
        onBack={handleBack}
      />

      <Modal
        title={t('orders.confirm.selectPaymentMethodTitle')}
        open={confirmModalVisible}
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
            value={confirmPaymentMethod}
            onChange={setConfirmPaymentMethod}
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

      <Modal
        title={t('orders.refund.modalTitle', 'Create Refund')}
        open={refundModalVisible}
        onCancel={() => {
          if (refundSubmitting) return;
          setRefundModalVisible(false);
          refundForm.resetFields();
        }}
        onOk={() => refundForm.submit()}
        okText={t('orders.refund.submit', 'Refund')}
        cancelText={t('orders.confirm.no')}
        confirmLoading={refundSubmitting || loadingRefundable}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Text type="secondary">
            {t('orders.refund.availableAmount', 'Refundable amount')}: {formatCurrency(refundableAmount)}
          </Text>
          <Form<RefundFormValues>
            form={refundForm}
            layout="vertical"
            onFinish={handleRefund}
          >
            <Form.Item
              label={t('payments.form.amount')}
              name="amount"
              rules={[
                { required: true, message: t('payments.form.amountRequired') },
                { type: 'number', min: 0.01, message: t('payments.form.amountPositive') },
                {
                  validator: async (_, value?: number) => {
                    if (!value) return Promise.resolve();
                    if (value > refundableAmount) {
                      return Promise.reject(
                        new Error(
                          t(
                            'orders.refund.exceedsRefundable',
                            'Refund amount exceeds refundable balance'
                          )
                        )
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={refundableAmount}
                precision={2}
                placeholder={t('payments.form.amountPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              label={t('payments.form.method')}
              name="method"
              rules={[{ required: true, message: t('payments.form.methodRequired') }]}
            >
              <Select<PaymentMethod>
                options={[
                  { value: PaymentMethod.CASH, label: t('payments.method.cash') },
                  { value: PaymentMethod.BANK_TRANSFER, label: t('payments.method.bankTransfer') },
                  { value: PaymentMethod.VIETQR, label: t('payments.method.vietqr') },
                ]}
                placeholder={t('payments.form.methodPlaceholder')}
              />
            </Form.Item>

            <Form.Item label={t('payments.form.transactionId')} name="transactionId">
              <Input placeholder={t('payments.form.transactionIdPlaceholder')} />
            </Form.Item>

            <Form.Item label={t('payments.form.notes')} name="notes">
              <Input.TextArea
                rows={3}
                maxLength={500}
                showCount
                placeholder={t('payments.form.notesPlaceholder')}
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>

      <Modal
        title={`${t('orders.actions.viewPayments')} #${order.orderNumber}`}
        open={paymentsModalVisible}
        onCancel={() => setPaymentsModalVisible(false)}
        footer={null}
        width={980}
      >
        {orderPaymentsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Spin />
          </div>
        ) : orderPayments.length === 0 ? (
          <EmptyState description={t('payments.list.noPayments')} />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Text type="secondary">{t('payments.table.totalPayments', { total: orderPayments.length })}</Text>
            <Table<Payment>
              rowKey="id"
              columns={paymentColumns}
              dataSource={orderPayments}
              pagination={false}
              scroll={{ x: 860 }}
            />
          </Space>
        )}
      </Modal>

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
