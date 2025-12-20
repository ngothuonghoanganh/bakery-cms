/**
 * PaymentForm Component
 * Form for creating and editing payments using Ant Design Form
 */

import React, { useMemo, useEffect } from 'react';
import { Form, InputNumber, Select, Input, Row, Col } from 'antd';
import { AntModal } from '../../../core';
import { PaymentMethod, PaymentStatus } from '../../../../types/models/payment.model';
import { useOrders } from '../../../../hooks/useOrders';
import type { PaymentFormProps, PaymentFormValues } from './PaymentForm.types';

const { TextArea } = Input;

const PAYMENT_METHOD_OPTIONS = [
  { label: 'Cash', value: PaymentMethod.CASH },
  { label: 'VietQR', value: PaymentMethod.VIETQR },
  { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: 'Pending', value: PaymentStatus.PENDING },
  { label: 'Paid', value: PaymentStatus.PAID },
  { label: 'Failed', value: PaymentStatus.FAILED },
  { label: 'Cancelled', value: PaymentStatus.CANCELLED },
];

export const PaymentForm: React.FC<PaymentFormProps> = ({
  visible,
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm<PaymentFormValues>();
  const { orders, loading: ordersLoading } = useOrders({ autoFetch: true });

  const isEditMode = useMemo(() => !!initialValues, [initialValues]);

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
      title={isEditMode ? 'Edit Payment' : 'Create Payment'}
      visible={visible}
      onOk={form.submit}
      onCancel={handleCancel}
      okText={isEditMode ? 'Update' : 'Create'}
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
              label="Order"
              name="orderId"
              rules={[{ required: true, message: 'Please select an order' }]}
            >
              <Select
                placeholder="Select an order"
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
              label="Amount"
              name="amount"
              rules={[
                { required: true, message: 'Please enter amount' },
                { type: 'number', min: 0.01, message: 'Amount must be positive' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter amount"
                min={0}
                precision={2}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Payment Method"
              name="method"
              rules={[{ required: true, message: 'Please select payment method' }]}
            >
              <Select placeholder="Select payment method" options={PAYMENT_METHOD_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status" options={PAYMENT_STATUS_OPTIONS} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Transaction ID" name="transactionId">
              <Input placeholder="Enter transaction ID (optional)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="Notes" name="notes">
              <TextArea
                rows={3}
                placeholder="Enter additional notes (optional)"
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
