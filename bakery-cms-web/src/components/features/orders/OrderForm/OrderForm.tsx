/**
 * OrderForm component
 * Modal form for creating and editing orders with items management
 */

import React, { useEffect, useMemo, useState } from 'react';
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
import {
  OrderType,
  BusinessModel,
  OrderStatus,
  SaleUnitType,
} from '../../../../types/models/order.model';
import { useProducts } from '../../../../hooks/useProducts';
import { formatCurrency } from '../../../../utils/format.utils';
import { settingsService } from '../../../../services/settings.service';
import {
  calculateOrderItemSubtotal,
  getQuantityRuleBySaleUnit,
  getSaleUnitPriceSuffix,
  isValidQuantityBySaleUnit,
} from '../../../../utils/sale-unit.utils';
import type {
  OrderExtraFeeFormValue,
  OrderFormProps,
  OrderFormValues,
} from './OrderForm.types';
import type { OrderExtraFeeTemplate } from '../../../../types/models/settings.model';

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
  const [loadingDefaultExtras, setLoadingDefaultExtras] = useState(false);
  const [extraFeeTemplates, setExtraFeeTemplates] = useState<OrderExtraFeeTemplate[]>([]);
  const productById = useMemo(
    () => new Map((products || []).map((product) => [product.id, product])),
    [products]
  );

  // Watch items for total calculation
  const items = Form.useWatch('items', form) || [];
  const extraFees = Form.useWatch('extraFees', form) || [];

  // Calculate item total amount
  const itemsTotalAmount = useMemo(() => {
    return items.reduce((sum: number, item: any) => {
      if (!item) return sum;
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      const saleUnitType = item.saleUnitType || SaleUnitType.PIECE;
      return sum + calculateOrderItemSubtotal(quantity, unitPrice, saleUnitType);
    }, 0);
  }, [items]);

  // Calculate extra fees total amount
  const extraFeesTotalAmount = useMemo(() => {
    return extraFees.reduce((sum: number, fee: any) => {
      if (!fee) return sum;
      return sum + (Number(fee.amount) || 0);
    }, 0);
  }, [extraFees]);

  const totalAmount = useMemo(
    () => itemsTotalAmount + extraFeesTotalAmount,
    [itemsTotalAmount, extraFeesTotalAmount]
  );

  const templateById = useMemo(
    () => new Map(extraFeeTemplates.map((template) => [template.id, template])),
    [extraFeeTemplates]
  );

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    let isMounted = true;

    const syncFormValues = async () => {
      if (!open) {
        return;
      }

      setLoadingDefaultExtras(true);

      const settingsResult = await settingsService.getSystemSettings();

      if (!isMounted) {
        return;
      }

      if (settingsResult.success) {
        const templates = [...(settingsResult.data.orderExtraFees || [])];

        if (initialValues) {
          const mappedInitialFees = (initialValues.extraFees || [])
            .map((fee) => {
              const byId = fee.id ? templates.find((template) => template.id === fee.id) : undefined;
              const byName = !byId
                ? templates.find((template) => template.name === fee.name)
                : undefined;
              const matched = byId || byName;
              if (!matched) {
                return null;
              }
              return {
                id: matched.id,
                name: matched.name,
                amount: Number(fee.amount) || 0,
              };
            })
            .filter(
              (fee): fee is { id: string; name: string; amount: number } => fee !== null
            );

          setExtraFeeTemplates(templates);
          form.setFieldsValue({
            ...initialValues,
            items: (initialValues.items || []).map((item) => ({
              ...item,
              saleUnitType: item.saleUnitType || SaleUnitType.PIECE,
            })),
            extraFees: mappedInitialFees,
          });
        } else {
          form.resetFields();
          setExtraFeeTemplates(templates);
          form.setFieldsValue({
            extraFees: templates.map((fee) => ({
              id: fee.id,
              name: fee.name,
              amount: fee.defaultAmount,
            })),
          });
        }
      } else if (initialValues) {
        const fallbackTemplateMap = new Map<string, OrderExtraFeeTemplate>();
        (initialValues.extraFees || []).forEach((fee) => {
          const id = String(fee.id || '').trim();
          const name = String(fee.name || '').trim();
          if (!id || !name || fallbackTemplateMap.has(id)) {
            return;
          }
          fallbackTemplateMap.set(id, {
            id,
            name,
            defaultAmount: Number(fee.amount) || 0,
          });
        });

        setExtraFeeTemplates(Array.from(fallbackTemplateMap.values()));
        form.setFieldsValue({
          ...initialValues,
          items: (initialValues.items || []).map((item) => ({
            ...item,
            saleUnitType: item.saleUnitType || SaleUnitType.PIECE,
          })),
          extraFees: initialValues.extraFees || [],
        });
      } else {
        form.resetFields();
        setExtraFeeTemplates([]);
      }

      setLoadingDefaultExtras(false);
    };

    void syncFormValues();

    return () => {
      isMounted = false;
    };
  }, [open, initialValues, form]);

  const handleFormSubmit = async (values: OrderFormValues) => {
    try {
      const normalizedExtras = (values.extraFees || [])
        .map((fee): OrderExtraFeeFormValue | null => {
          const template = templateById.get(fee.id || '');
          const amount = Number(fee.amount) || 0;

          if (!template && fee.id) {
            const fallbackName = fee.name?.trim();
            return {
              id: fee.id,
              amount,
              ...(fallbackName ? { name: fallbackName } : {}),
            };
          }
          if (!template) {
            return null;
          }
          return {
            id: template.id,
            name: template.name,
            amount,
          };
        })
        .filter((fee): fee is OrderExtraFeeFormValue => fee !== null);
      const normalizedItems = (values.items || []).map((item) => ({
        ...item,
        saleUnitType: item.saleUnitType || SaleUnitType.PIECE,
      }));

      await onSubmit({
        ...values,
        items: normalizedItems,
        extraFees: normalizedExtras,
      });
      form.resetFields();
    } catch (_error) {
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
      const currentItems = form.getFieldValue('items') || [];
      const currentItem = currentItems[index] || {};
      const saleUnitType = product.saleUnitType || SaleUnitType.PIECE;
      const quantityRules = getQuantityRuleBySaleUnit(saleUnitType);
      const currentQuantity = Number(currentItem.quantity ?? 0);
      const normalizedQuantity = isValidQuantityBySaleUnit(currentQuantity, saleUnitType)
        ? currentQuantity
        : quantityRules.min;

      currentItems[index] = {
        ...currentItem,
        unitPrice: product.price,
        saleUnitType,
        quantity: normalizedQuantity,
      };
      form.setFieldsValue({ items: currentItems });
    }
  };

  const handleExtraTemplateSelect = (templateId: string, index: number) => {
    const template = templateById.get(templateId);
    if (!template) {
      return;
    }

    const currentExtraFees = form.getFieldValue('extraFees') || [];
    currentExtraFees[index] = {
      ...currentExtraFees[index],
      id: template.id,
      name: template.name,
      amount:
        typeof currentExtraFees[index]?.amount === 'number'
          ? currentExtraFees[index].amount
          : template.defaultAmount,
    };
    form.setFieldsValue({ extraFees: currentExtraFees });
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
          customerAddress: '',
          notes: '',
          items: [
            {
              productId: '',
              saleUnitType: SaleUnitType.PIECE,
              quantity: 1,
              unitPrice: 0,
              notes: '',
            },
          ],
          extraFees: [],
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

        <Form.Item
          name="customerAddress"
          label={t('orders.form.shippingAddress')}
          rules={[{ max: 1000, message: t('orders.form.validation.customerAddressMax') }]}
        >
          <TextArea
            rows={2}
            placeholder={t(
              'orders.form.shippingAddressPlaceholder',
              'Enter receiving address (optional)'
            )}
          />
        </Form.Item>

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
              {fields.map((field, index) => {
                const selectedProductId = items[index]?.productId;
                const selectedProduct = selectedProductId
                  ? productById.get(selectedProductId)
                  : undefined;
                const saleUnitType =
                  items[index]?.saleUnitType ||
                  selectedProduct?.saleUnitType ||
                  SaleUnitType.PIECE;
                const quantityRule = getQuantityRuleBySaleUnit(saleUnitType);
                const subtotal = calculateOrderItemSubtotal(
                  Number(items[index]?.quantity || 0),
                  Number(items[index]?.unitPrice || 0),
                  saleUnitType
                );
                const isWeight = saleUnitType === SaleUnitType.WEIGHT;

                return (
                  <div key={field.key} style={{ marginBottom: 12 }}>
                    <Space
                      style={{ display: 'flex', marginBottom: 8 }}
                      align="baseline"
                      wrap
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
                              {product.name} (
                              {`${formatCurrency(product.price)} ${getSaleUnitPriceSuffix(product.saleUnitType)}`}
                              )
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'saleUnitType']}
                        style={{ marginBottom: 0, display: 'none' }}
                      >
                        <Input />
                      </Form.Item>

                      {/* Quantity */}
                      <Form.Item
                        {...field}
                        name={[field.name, 'quantity']}
                        rules={[
                          { required: true, message: t('orders.form.validation.quantityRequired') },
                          { type: 'number', message: t('validation.number', 'Please enter a valid number') },
                          {
                            validator: async (_, value) => {
                              const quantity = Number(value);
                              if (!isValidQuantityBySaleUnit(quantity, saleUnitType)) {
                                if (saleUnitType === SaleUnitType.WEIGHT) {
                                  throw new Error(
                                    t(
                                      'orders.form.validation.weightQuantityRule',
                                      'Khối lượng phải là số gram nguyên, tối thiểu 100g và bội số của 100g.'
                                    )
                                  );
                                }

                                throw new Error(
                                  t(
                                    'orders.form.validation.quantityMin',
                                    'Quantity must be at least 1'
                                  )
                                );
                              }
                            },
                          },
                        ]}
                        style={{ marginBottom: 0, width: 130 }}
                      >
                        <InputNumber
                          placeholder={
                            isWeight
                              ? t('orders.form.quantityWeightPlaceholder', 'Gram (100g step)')
                              : t('orders.form.quantityShort')
                          }
                          min={quantityRule.min}
                          step={quantityRule.step}
                          precision={0}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      {/* Unit Price */}
                      <Form.Item
                        {...field}
                        name={[field.name, 'unitPrice']}
                        rules={[
                          { required: true, message: t('orders.form.validation.priceRequired') },
                          { type: 'number', min: 0, message: t('orders.form.validation.priceMin') },
                        ]}
                        style={{ marginBottom: 0, width: 170 }}
                      >
                        <InputNumber
                          placeholder={`${t('orders.form.price')} ${getSaleUnitPriceSuffix(saleUnitType)}`}
                          min={0}
                          precision={0}
                          formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={(value) => value?.replace(/₫\s?|(,*)/g, '') as any}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      {/* Subtotal Display */}
                      <Text strong style={{ width: 170, textAlign: 'right' }}>
                        {formatCurrency(subtotal)}
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

                    <Form.Item
                      {...field}
                      name={[field.name, 'notes']}
                      rules={[{ max: 500, message: t('orders.form.validation.itemNotesMax') }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder={t(
                          'orders.form.itemNotesPlaceholder',
                          'Item note (optional)'
                        )}
                      />
                    </Form.Item>
                  </div>
                );
              })}

              {/* Add Item Button */}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      productId: '',
                      saleUnitType: SaleUnitType.PIECE,
                      quantity: 1,
                      unitPrice: 0,
                      notes: '',
                    })
                  }
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

        {/* Extra Fees */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>{t('orders.form.extraFees', 'Extra Fees')}</Title>
          <Text type="secondary">
            {loadingDefaultExtras
              ? t('orders.form.loadingExtraFees', 'Loading default extra fees...')
              : t(
                  'orders.form.extraFeesHint',
                  'Shipping fee, packaging fee, and other custom fees can be added here.'
                )}
          </Text>
        </div>

        <Form.List name="extraFees">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Space
                  key={field.key}
                  style={{ display: 'flex', marginBottom: 8 }}
                  align="baseline"
                >
                  <Form.Item
                    {...field}
                    name={[field.name, 'id']}
                    rules={[
                      {
                        required: true,
                        message: t('orders.form.validation.extraFeeNameRequired', 'Required'),
                      },
                    ]}
                    style={{ marginBottom: 0, width: 360 }}
                  >
                    <Select
                      placeholder={t(
                        'orders.form.extraFeeNamePlaceholder',
                        'Fee name'
                      )}
                      options={extraFeeTemplates.map((template) => ({
                        value: template.id,
                        label: template.name,
                      }))}
                      disabled={loadingDefaultExtras || extraFeeTemplates.length === 0}
                      onChange={(value) => handleExtraTemplateSelect(value, index)}
                    />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    name={[field.name, 'name']}
                    style={{ marginBottom: 0, display: 'none' }}
                  >
                    <Input />
                  </Form.Item>

                  <Form.Item
                    {...field}
                    name={[field.name, 'amount']}
                    rules={[
                      {
                        required: true,
                        message: t(
                          'orders.form.validation.extraFeeAmountRequired',
                          'Required'
                        ),
                      },
                      {
                        type: 'number',
                        min: 0,
                        message: t(
                          'orders.form.validation.extraFeeAmountMin',
                          'Must be at least 0'
                        ),
                      },
                    ]}
                    style={{ marginBottom: 0, width: 180 }}
                  >
                    <InputNumber
                      placeholder={t('orders.form.extraFeeAmountPlaceholder', 'Amount')}
                      min={0}
                      style={{ width: '100%' }}
                      formatter={(value) => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value?.replace(/₫\s?|(,*)/g, '') as any}
                    />
                  </Form.Item>

                  <Text strong style={{ width: 120, textAlign: 'right' }}>
                    {formatCurrency(Number(extraFees[field.name]?.amount || 0))}
                  </Text>

                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  />
                </Space>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => {
                    if (loadingDefaultExtras || extraFeeTemplates.length === 0) {
                      return;
                    }

                    const currentExtraFees = form.getFieldValue('extraFees') || [];
                    const usedIds = new Set(
                      currentExtraFees
                        .map((fee: { id?: string }) => fee.id)
                        .filter(Boolean)
                    );
                    const templateToAdd =
                      extraFeeTemplates.find((template) => !usedIds.has(template.id)) ||
                      extraFeeTemplates[0];

                    add({
                      id: templateToAdd?.id || '',
                      name: templateToAdd?.name || '',
                      amount: templateToAdd?.defaultAmount || 0,
                    });
                  }}
                  disabled={loadingDefaultExtras || extraFeeTemplates.length === 0}
                  block
                  icon={<PlusOutlined />}
                >
                  {t('orders.form.addExtraFee', 'Add Extra Fee')}
                </Button>
              </Form.Item>
              {!loadingDefaultExtras && extraFeeTemplates.length === 0 && (
                <Text type="secondary">
                  {t(
                    'orders.form.noExtraFeeTemplates',
                    'No extra fee templates configured in settings.'
                  )}
                </Text>
              )}
            </>
          )}
        </Form.List>

        <Divider />

        {/* Total Amount */}
        <div style={{ marginBottom: 24, textAlign: 'right' }}>
          <Space direction="vertical" size={2} style={{ textAlign: 'right' }}>
            <Text type="secondary">
              {t('orders.form.itemsTotal', 'Items Total')}: {formatCurrency(itemsTotalAmount)}
            </Text>
            <Text type="secondary">
              {t('orders.form.extraFeesTotal', 'Extra Fees Total')}: {formatCurrency(extraFeesTotalAmount)}
            </Text>
            <Title level={4} style={{ margin: 0 }}>
              {t('orders.form.total')}: <Text type="success">{formatCurrency(totalAmount)}</Text>
            </Title>
          </Space>
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
