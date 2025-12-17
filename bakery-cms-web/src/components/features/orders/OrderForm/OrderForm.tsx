/**
 * OrderForm component
 * Modal form for creating and editing orders with items management
 */

import React, { useEffect, useMemo } from 'react';
import { Form, Input, Select, InputNumber, Button, Space, Typography, Divider, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { AntModal } from '../../../core';
import { OrderType, BusinessModel, OrderStatus } from '../../../../types/models/order.model';
import { useProducts } from '../../../../hooks/useProducts';
import { formatCurrency } from '../../../../utils/format.utils';
import type { OrderFormProps, OrderFormValues } from './OrderForm.types';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const OrderForm: React.FC<OrderFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues,
  loading = false,
}) => {
  const [form] = Form.useForm<OrderFormValues>();
  const isEditMode = !!initialValues;

  // Fetch products for selection
  const { products, loading: productsLoading } = useProducts({ autoFetch: true });

  // Watch items for total calculation
  const items = Form.useWatch('items', form) || [];

  // Calculate total amount
  const totalAmount = useMemo(() => {
    return items.reduce((sum: number, item: any) => {
      if (!item) return sum;
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + quantity * unitPrice;
    }, 0);
  }, [items]);

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialValues, form]);

  const handleFormSubmit = async (values: OrderFormValues) => {
    try {
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      // Error is handled by parent component
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  // Auto-fill unit price when product is selected
  const handleProductSelect = (productId: string, index: number) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      const items = form.getFieldValue('items') || [];
      items[index] = {
        ...items[index],
        unitPrice: product.price,
      };
      form.setFieldsValue({ items });
    }
  };

  return (
    <AntModal
      title={isEditMode ? 'Edit Order' : 'Create New Order'}
      open={open}
      onCancel={handleCancel}
      width={900}
      footer={null}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        initialValues={{
          orderType: OrderType.TEMPORARY,
          businessModel: BusinessModel.READY_TO_SELL,
          customerName: '',
          customerPhone: '',
          notes: '',
          items: [{ productId: '', quantity: 1, unitPrice: 0 }],
          status: OrderStatus.DRAFT,
        }}
      >
        <Row gutter={16}>
          {/* Order Type */}
          <Col span={12}>
            <Form.Item
              name="orderType"
              label="Order Type"
              rules={[{ required: true, message: 'Please select order type' }]}
            >
              <Select placeholder="Select order type">
                <Option value={OrderType.TEMPORARY}>Temporary</Option>
                <Option value={OrderType.OFFICIAL}>Official</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Business Model */}
          <Col span={12}>
            <Form.Item
              name="businessModel"
              label="Business Model"
              rules={[{ required: true, message: 'Please select business model' }]}
            >
              <Select placeholder="Select business model">
                <Option value={BusinessModel.MADE_TO_ORDER}>Made to Order</Option>
                <Option value={BusinessModel.READY_TO_SELL}>Ready to Sell</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Customer Name */}
          <Col span={12}>
            <Form.Item
              name="customerName"
              label="Customer Name"
              rules={[{ max: 100, message: 'Customer name cannot exceed 100 characters' }]}
            >
              <Input placeholder="Enter customer name (optional)" />
            </Form.Item>
          </Col>

          {/* Customer Phone */}
          <Col span={12}>
            <Form.Item
              name="customerPhone"
              label="Customer Phone"
              rules={[
                { pattern: /^[0-9+\-() ]*$/, message: 'Invalid phone number format' },
                { max: 20, message: 'Phone number cannot exceed 20 characters' },
              ]}
            >
              <Input placeholder="Enter customer phone (optional)" />
            </Form.Item>
          </Col>
        </Row>

        {/* Notes */}
        <Form.Item
          name="notes"
          label="Notes"
          rules={[{ max: 500, message: 'Notes cannot exceed 500 characters' }]}
        >
          <TextArea rows={3} placeholder="Enter any additional notes (optional)" />
        </Form.Item>

        <Divider />

        {/* Order Items */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>Order Items</Title>
          <Text type="secondary">Add products to this order</Text>
        </div>

        <Form.List
          name="items"
          rules={[
            {
              validator: async (_, items) => {
                if (!items || items.length === 0) {
                  return Promise.reject(new Error('At least one item is required'));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors: listErrors }) => (
            <>
              {fields.map((field, index) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  {/* Product Selection */}
                  <Form.Item
                    {...field}
                    name={[field.name, 'productId']}
                    rules={[{ required: true, message: 'Select product' }]}
                    style={{ marginBottom: 0, width: 250 }}
                  >
                    <Select
                      placeholder="Select product"
                      loading={productsLoading}
                      onChange={(value) => handleProductSelect(value, index)}
                      showSearch
                      optionFilterProp="children"
                    >
                      {products?.map((product) => (
                        <Option key={product.id} value={product.id}>
                          {product.name} ({formatCurrency(product.price)})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Quantity */}
                  <Form.Item
                    {...field}
                    name={[field.name, 'quantity']}
                    rules={[
                      { required: true, message: 'Required' },
                      { type: 'number', min: 1, message: 'Min 1' },
                      { type: 'number', max: 9999, message: 'Max 9999' },
                    ]}
                    style={{ marginBottom: 0, width: 100 }}
                  >
                    <InputNumber
                      placeholder="Qty"
                      min={1}
                      max={9999}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  {/* Unit Price */}
                  <Form.Item
                    {...field}
                    name={[field.name, 'unitPrice']}
                    rules={[
                      { required: true, message: 'Required' },
                      { type: 'number', min: 0, message: 'Min 0' },
                    ]}
                    style={{ marginBottom: 0, width: 150 }}
                  >
                    <InputNumber
                      placeholder="Unit Price"
                      min={0}
                      formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/₫\s?|(,*)/g, '') as any}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  {/* Subtotal Display */}
                  <Text strong style={{ width: 120, textAlign: 'right' }}>
                    {formatCurrency(
                      (items[index]?.quantity || 0) * (items[index]?.unitPrice || 0)
                    )}
                  </Text>

                  {/* Remove Button */}
                  {fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  )}
                </Space>
              ))}

              {/* Add Item Button */}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add({ productId: '', quantity: 1, unitPrice: 0 })}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Item
                </Button>
              </Form.Item>

              {/* List Errors */}
              <Form.ErrorList errors={listErrors} />
            </>
          )}
        </Form.List>

        <Divider />

        {/* Total Amount */}
        <div style={{ marginBottom: 24, textAlign: 'right' }}>
          <Title level={4}>
            Total: <Text type="success">{formatCurrency(totalAmount)}</Text>
          </Title>
        </div>

        {/* Status (only visible in edit mode) */}
        {isEditMode && (
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value={OrderStatus.DRAFT}>Draft</Option>
              <Option value={OrderStatus.CONFIRMED}>Confirmed</Option>
              <Option value={OrderStatus.COMPLETED}>Completed</Option>
              <Option value={OrderStatus.CANCELLED}>Cancelled</Option>
            </Select>
          </Form.Item>
        )}

        {/* Form Actions */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? 'Update Order' : 'Create Order'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </AntModal>
  );
};
