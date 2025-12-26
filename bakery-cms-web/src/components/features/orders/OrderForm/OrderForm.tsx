/**
 * OrderForm component
 * Modal form for creating and editing orders with items management
 */

import React, { useEffect, useMemo } from 'react';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      title={isEditMode ? t('orders.form.editTitle') : t('orders.form.createTitle')}
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
              label={t('orders.form.orderType')}
              rules={[{ required: true, message: t('orders.form.validation.orderTypeRequired') }]}
            >
              <Select placeholder={t('orders.form.orderTypePlaceholder')}>
                <Option value={OrderType.TEMPORARY}>{t('orders.orderType.temporary')}</Option>
                <Option value={OrderType.OFFICIAL}>{t('orders.orderType.official')}</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* Business Model */}
          <Col span={12}>
            <Form.Item
              name="businessModel"
              label={t('orders.form.businessModel')}
              rules={[{ required: true, message: t('orders.form.validation.businessModelRequired') }]}
            >
              <Select placeholder={t('orders.form.businessModelPlaceholder')}>
                <Option value={BusinessModel.MADE_TO_ORDER}>{t('orders.businessModel.madeToOrder')}</Option>
                <Option value={BusinessModel.READY_TO_SELL}>{t('orders.businessModel.readyToSell')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          {/* Customer Name */}
          <Col span={12}>
            <Form.Item
              name="customerName"
              label={t('orders.form.customerName')}
              rules={[{ max: 100, message: t('orders.form.validation.customerNameMax') }]}
            >
              <Input placeholder={t('orders.form.customerNamePlaceholder')} />
            </Form.Item>
          </Col>

          {/* Customer Phone */}
          <Col span={12}>
            <Form.Item
              name="customerPhone"
              label={t('orders.form.customerPhone')}
              rules={[
                { pattern: /^[0-9+\-() ]*$/, message: t('orders.form.validation.phoneInvalid') },
                { max: 20, message: t('orders.form.validation.phoneMax') },
              ]}
            >
              <Input placeholder={t('orders.form.customerPhonePlaceholder')} />
            </Form.Item>
          </Col>
        </Row>

        {/* Notes */}
        <Form.Item
          name="notes"
          label={t('orders.form.notes')}
          rules={[{ max: 500, message: t('orders.form.validation.notesMax') }]}
        >
          <TextArea rows={3} placeholder={t('orders.form.notesPlaceholder')} />
        </Form.Item>

        <Divider />

        {/* Order Items */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>{t('orders.form.orderItems')}</Title>
          <Text type="secondary">{t('orders.form.addItemsHint')}</Text>
        </div>

        <Form.List
          name="items"
          rules={[
            {
              validator: async (_, items) => {
                if (!items || items.length === 0) {
                  return Promise.reject(new Error(t('orders.form.validation.itemsRequired')));
                }
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors: listErrors }) => (
            <>
              {fields.map((field, index) => (
                <Space
                  key={field.key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  {/* Product Selection */}
                  <Form.Item
                    {...field}
                    name={[field.name, 'productId']}
                    rules={[{ required: true, message: t('orders.form.validation.productRequired') }]}
                    style={{ marginBottom: 0, width: 250 }}
                  >
                    <Select
                      placeholder={t('orders.form.selectProduct')}
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
                      { required: true, message: t('orders.form.validation.quantityRequired') },
                      { type: 'number', min: 1, message: t('orders.form.validation.quantityMin') },
                      { type: 'number', max: 9999, message: t('orders.form.validation.quantityMax') },
                    ]}
                    style={{ marginBottom: 0, width: 100 }}
                  >
                    <InputNumber placeholder={t('orders.form.quantityShort')} min={1} max={9999} style={{ width: '100%' }} />
                  </Form.Item>

                  {/* Unit Price */}
                  <Form.Item
                    {...field}
                    name={[field.name, 'unitPrice']}
                    rules={[
                      { required: true, message: t('orders.form.validation.priceRequired') },
                      { type: 'number', min: 0, message: t('orders.form.validation.priceMin') },
                    ]}
                    style={{ marginBottom: 0, width: 150 }}
                  >
                    <InputNumber
                      placeholder={t('orders.form.price')}
                      min={0}
                      formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/₫\s?|(,*)/g, '') as any}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>

                  {/* Subtotal Display */}
                  <Text strong style={{ width: 120, textAlign: 'right' }}>
                    {formatCurrency((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0))}
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
                  {t('orders.form.addItem')}
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
            {t('orders.form.total')}: <Text type="success">{formatCurrency(totalAmount)}</Text>
          </Title>
        </div>

        {/* Status (only visible in edit mode) */}
        {isEditMode && (
          <Form.Item
            name="status"
            label={t('orders.form.status')}
            rules={[{ required: true, message: t('orders.form.validation.statusRequired') }]}
          >
            <Select placeholder={t('orders.form.statusPlaceholder')}>
              <Option value={OrderStatus.DRAFT}>{t('orders.status.draft')}</Option>
              <Option value={OrderStatus.CONFIRMED}>{t('orders.status.confirmed')}</Option>
              <Option value={OrderStatus.PAID}>{t('orders.status.paid')}</Option>
              <Option value={OrderStatus.CANCELLED}>{t('orders.status.cancelled')}</Option>
            </Select>
          </Form.Item>
        )}

        {/* Form Actions */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>{t('common.actions.cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEditMode ? t('orders.form.updateButton') : t('orders.form.createButton')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </AntModal>
  );
};
