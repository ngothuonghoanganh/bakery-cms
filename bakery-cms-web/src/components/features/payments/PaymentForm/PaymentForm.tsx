/**
 * PaymentForm Component
 * Form for creating and editing payments using Ant Design Form
 */

import React, { useMemo, useEffect } from 'react';
import { Form, InputNumber, Select, Input, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import { AntModal } from '../../../core';
import { PaymentMethod, PaymentStatus } from '../../../../types/models/payment.model';
import { useOrders } from '../../../../hooks/useOrders';
import type { PaymentFormProps, PaymentFormValues } from './PaymentForm.types';

const { TextArea } = Input;

export const PaymentForm: React.FC<PaymentFormProps> = ({
  visible,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<PaymentFormValues>();
  const { orders, loading: ordersLoading } = useOrders({ autoFetch: true });

  const isEditMode = useMemo(() => !!initialValues, [initialValues]);

  const paymentMethodOptions = useMemo(
    () => [
      { label: t('payments.method.cash'), value: PaymentMethod.CASH },
      { label: t('payments.method.vietqr'), value: PaymentMethod.VIETQR },
      { label: t('payments.method.bankTransfer'), value: PaymentMethod.BANK_TRANSFER },
    ],
    [t]
  );

  const paymentStatusOptions = useMemo(
    () => [
      { label: t('payments.status.pending'), value: PaymentStatus.PENDING },
      { label: t('payments.status.paid'), value: PaymentStatus.PAID },
      { label: t('payments.status.failed'), value: PaymentStatus.FAILED },
      { label: t('payments.status.cancelled'), value: PaymentStatus.CANCELLED },
    ],
    [t]
  );

  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        label: `Order #${order.orderNumber} - ${order.customerName}`,
        value: order.id,
      })),
    [orders]
  );

  // Reset form when modal opens/closes or initialValues change
  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (!visible) {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleFinish = async (values: PaymentFormValues) => {
    await onSubmit(values);
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <AntModal
      title={isEditMode ? t('payments.form.editTitle') : t('payments.form.createTitle')}
      visible={visible}
      onOk={form.submit}
      onCancel={handleCancel}
      okText={isEditMode ? t('payments.form.updateButton') : t('payments.form.createButton')}
      okButtonProps={{ loading }}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          method: PaymentMethod.CASH,
          status: PaymentStatus.PENDING,
        }}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label={t('payments.form.order')}
              name="orderId"
              rules={[{ required: true, message: t('payments.form.orderRequired') }]}
            >
              <Select
                placeholder={t('payments.form.orderPlaceholder')}
                options={orderOptions}
                loading={ordersLoading}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                disabled={isEditMode}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('payments.form.amount')}
              name="amount"
              rules={[
                { required: true, message: t('payments.form.amountRequired') },
                { type: 'number', min: 0.01, message: t('payments.form.amountPositive') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('payments.form.amountPlaceholder')}
                min={0}
                precision={2}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('payments.form.method')}
              name="method"
              rules={[{ required: true, message: t('payments.form.methodRequired') }]}
            >
              <Select placeholder={t('payments.form.methodPlaceholder')} options={paymentMethodOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('payments.form.status')}
              name="status"
              rules={[{ required: true, message: t('payments.form.statusRequired') }]}
            >
              <Select placeholder={t('payments.form.statusPlaceholder')} options={paymentStatusOptions} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={t('payments.form.transactionId')} name="transactionId">
              <Input placeholder={t('payments.form.transactionIdPlaceholder')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label={t('payments.form.notes')} name="notes">
              <TextArea
                rows={3}
                placeholder={t('payments.form.notesPlaceholder')}
                maxLength={500}
                showCount
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </AntModal>
  );
};
