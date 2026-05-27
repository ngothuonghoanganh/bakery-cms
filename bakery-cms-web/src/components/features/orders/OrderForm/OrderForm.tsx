/**
 * OrderForm component
 * Modal form for creating and editing orders with items management
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { stockService } from '../../../../services/stock.service';
import { StockPurchaseUnit } from '@bakery-cms/common';
import { subscribeRecipeChangedEvent } from '../../../../utils/recipe-events';
import type {
  OrderExtraFeeFormValue,
  OrderFormProps,
  OrderFormValues,
} from './OrderForm.types';
import type { OrderExtraFeeTemplate } from '../../../../types/models/settings.model';

const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

type RecipeVersionOption = {
  value: string;
  label: string;
  estimatedCost: number;
};

const getDefaultSaleUnit = (saleUnitType: SaleUnitType): StockPurchaseUnit =>
  saleUnitType === SaleUnitType.WEIGHT
    ? StockPurchaseUnit.GRAM
    : StockPurchaseUnit.PIECE;

const toWeightQuantityGram = (
  quantity: number,
  saleUnit: StockPurchaseUnit
): number => {
  if (saleUnit === StockPurchaseUnit.KILOGRAM) {
    return quantity * 1000;
  }
  return quantity;
};

const isQuantityValidForForm = (
  quantity: number,
  saleUnitType: SaleUnitType,
  saleUnit: StockPurchaseUnit
): boolean => {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return false;
  }

  if (saleUnitType === SaleUnitType.WEIGHT) {
    const quantityInGram = toWeightQuantityGram(quantity, saleUnit);
    return (
      Number.isInteger(quantityInGram) &&
      isValidQuantityBySaleUnit(quantityInGram, SaleUnitType.WEIGHT)
    );
  }

  return isValidQuantityBySaleUnit(quantity, saleUnitType);
};

const getQuantityInputConfig = (
  saleUnitType: SaleUnitType,
  saleUnit: StockPurchaseUnit
): { min: number; step: number; precision: number } => {
  if (saleUnitType === SaleUnitType.WEIGHT) {
    if (saleUnit === StockPurchaseUnit.KILOGRAM) {
      return {
        min: 0.1,
        step: 0.1,
        precision: 3,
      };
    }

    return {
      min: 100,
      step: 100,
      precision: 0,
    };
  }

  return {
    min: 1,
    step: 1,
    precision: 0,
  };
};

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
  const [recipeOptionsByProductId, setRecipeOptionsByProductId] = useState<
    Record<string, RecipeVersionOption[]>
  >({});
  const [loadingRecipesByProductId, setLoadingRecipesByProductId] = useState<
    Record<string, boolean>
  >({});
  const recipeOptionsCacheRef = useRef<Record<string, RecipeVersionOption[]>>({});
  const loadingRecipeProductIdsRef = useRef<Set<string>>(new Set());
  const inFlightRecipeRequestsRef = useRef<Map<string, Promise<RecipeVersionOption[]>>>(
    new Map()
  );
  const productById = useMemo(
    () => new Map((products || []).map((product) => [product.id, product])),
    [products]
  );

  // Watch items for total calculation
  const watchedItems = Form.useWatch('items', form);
  const watchedExtraFees = Form.useWatch('extraFees', form);
  const items = useMemo(() => watchedItems || [], [watchedItems]);
  const extraFees = useMemo(() => watchedExtraFees || [], [watchedExtraFees]);

  // Calculate item total amount
  const itemsTotalAmount = useMemo(() => {
    return items.reduce((sum: number, item: any) => {
      if (!item) return sum;
      const quantity = Number(item.quantity || 0);
      const unitPrice = item.unitPrice || 0;
      const saleUnitType = item.saleUnitType || SaleUnitType.PIECE;
      const saleUnit = (item.saleUnit as StockPurchaseUnit | undefined) ?? getDefaultSaleUnit(saleUnitType);
      const normalizedQuantity =
        saleUnitType === SaleUnitType.WEIGHT
          ? toWeightQuantityGram(quantity, saleUnit)
          : quantity;
      return sum + calculateOrderItemSubtotal(normalizedQuantity, unitPrice, saleUnitType);
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

  const syncRecipeOptionsState = useCallback(
    (productId: string, recipeOptions: RecipeVersionOption[]): void => {
      setRecipeOptionsByProductId((prev) => {
        const currentOptions = prev[productId] || [];
        if (
          currentOptions.length === recipeOptions.length &&
          currentOptions.every(
            (option, index) =>
              option.value === recipeOptions[index]?.value &&
              option.label === recipeOptions[index]?.label &&
              option.estimatedCost === recipeOptions[index]?.estimatedCost
          )
        ) {
          return prev;
        }

        return {
          ...prev,
          [productId]: recipeOptions,
        };
      });
    },
    []
  );

  const syncRecipeLoadingState = useCallback(
    (productId: string, isLoading: boolean): void => {
      setLoadingRecipesByProductId((prev) => {
        if ((prev[productId] || false) === isLoading) {
          return prev;
        }
        return {
          ...prev,
          [productId]: isLoading,
        };
      });
    },
    []
  );

  const syncRecipeSelectionForProduct = useCallback(
    (productId: string, recipeOptions: RecipeVersionOption[]): void => {
      const currentItems = form.getFieldValue('items') || [];
      const nextRecipeVersionId = recipeOptions[0]?.value;
      let hasChanges = false;

      const nextItems = currentItems.map((item: Record<string, unknown>) => {
        if (String(item?.productId || '').trim() !== productId) {
          return item;
        }

        const currentRecipeVersionId = String(item?.recipeVersionId || '').trim();
        const hasCurrentRecipeOption = recipeOptions.some(
          (option) => option.value === currentRecipeVersionId
        );
        const normalizedRecipeVersionId = hasCurrentRecipeOption
          ? currentRecipeVersionId
          : nextRecipeVersionId || undefined;

        if (
          normalizedRecipeVersionId === item.recipeVersionId ||
          (!normalizedRecipeVersionId && !item.recipeVersionId)
        ) {
          return item;
        }

        hasChanges = true;
        return {
          ...item,
          recipeVersionId: normalizedRecipeVersionId,
        };
      });

      if (hasChanges) {
        form.setFieldsValue({ items: nextItems });
      }
    },
    [form]
  );

  const invalidateRecipeOptionsForProduct = useCallback(
    (productId: string): void => {
      if (!productId) {
        return;
      }

      delete recipeOptionsCacheRef.current[productId];
      loadingRecipeProductIdsRef.current.delete(productId);
      inFlightRecipeRequestsRef.current.delete(productId);

      setRecipeOptionsByProductId((prev) => {
        if (!(productId in prev)) {
          return prev;
        }
        const next = { ...prev };
        delete next[productId];
        return next;
      });

      syncRecipeLoadingState(productId, false);
    },
    [syncRecipeLoadingState]
  );

  const loadRecipeOptions = useCallback(async (
    productId: string,
    options?: { force?: boolean }
  ): Promise<RecipeVersionOption[]> => {
    if (!productId) {
      return [];
    }

    const force = Boolean(options?.force);

    if (!force) {
      const cachedRecipeOptions = recipeOptionsCacheRef.current[productId];
      if (cachedRecipeOptions) {
        syncRecipeOptionsState(productId, cachedRecipeOptions);
        return cachedRecipeOptions;
      }
    }

    const existingInFlightRequest =
      inFlightRecipeRequestsRef.current.get(productId) || null;
    if (existingInFlightRequest) {
      return existingInFlightRequest;
    }

    if (loadingRecipeProductIdsRef.current.has(productId)) {
      return [];
    }

    loadingRecipeProductIdsRef.current.add(productId);
    syncRecipeLoadingState(productId, true);

    const request = (async (): Promise<RecipeVersionOption[]> => {
      const result = await stockService.getRecipesByProduct(productId);
      if (!result.success) {
        recipeOptionsCacheRef.current[productId] = [];
        syncRecipeOptionsState(productId, []);
        return [];
      }

      const recipeOptions: RecipeVersionOption[] = result.data
        .filter((recipe) => recipe.status === 'active')
        .flatMap((recipe) =>
          (recipe.versions || [])
            .filter((version) => version.status === 'active')
            .sort((a, b) => b.versionNumber - a.versionNumber)
            .map((version) => ({
              value: version.id,
              label: `${recipe.name} v${version.versionNumber}`,
              estimatedCost: version.estimatedCost,
            }))
        );

      recipeOptionsCacheRef.current[productId] = recipeOptions;
      syncRecipeOptionsState(productId, recipeOptions);
      return recipeOptions;
    })().finally(() => {
      loadingRecipeProductIdsRef.current.delete(productId);
      inFlightRecipeRequestsRef.current.delete(productId);
      syncRecipeLoadingState(productId, false);
    });

    inFlightRecipeRequestsRef.current.set(productId, request);
    return request;
  }, [syncRecipeLoadingState, syncRecipeOptionsState]);

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
              saleUnit:
                (item.saleUnit as StockPurchaseUnit | undefined) ??
                getDefaultSaleUnit(item.saleUnitType || SaleUnitType.PIECE),
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
            saleUnit:
              (item.saleUnit as StockPurchaseUnit | undefined) ??
              getDefaultSaleUnit(item.saleUnitType || SaleUnitType.PIECE),
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

  const productIds = useMemo(
    () =>
      Array.from(
        new Set(
          (items || [])
            .map((item: any) => String(item?.productId || '').trim())
            .filter((value) => value.length > 0)
        )
      ),
    [items]
  );

  const productIdsKey = useMemo(() => JSON.stringify(productIds), [productIds]);

  useEffect(() => {
    if (!open || !productIdsKey) {
      return;
    }

    const selectedProductIds = JSON.parse(productIdsKey) as string[];
    selectedProductIds.forEach((productId) => {
      void loadRecipeOptions(productId);
    });
  }, [loadRecipeOptions, open, productIdsKey]);

  useEffect(() => {
    const unsubscribe = subscribeRecipeChangedEvent(({ productId }) => {
      invalidateRecipeOptionsForProduct(productId);

      if (!open || !productId) {
        return;
      }

      const currentItems = form.getFieldValue('items') || [];
      const hasProductInOrder = currentItems.some(
        (item: { productId?: string }) => item.productId === productId
      );
      if (!hasProductInOrder) {
        return;
      }

      void loadRecipeOptions(productId, { force: true }).then((recipeOptions) => {
        syncRecipeSelectionForProduct(productId, recipeOptions);
      });
    });

    return unsubscribe;
  }, [
    form,
    invalidateRecipeOptionsForProduct,
    loadRecipeOptions,
    open,
    syncRecipeSelectionForProduct,
  ]);

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
        saleUnit:
          (item.saleUnit as StockPurchaseUnit | undefined) ??
          getDefaultSaleUnit(item.saleUnitType || SaleUnitType.PIECE),
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

  // Auto-fill unit price and recipe when product is selected
  const handleProductSelect = async (productId: string, index: number) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      const recipeOptions = await loadRecipeOptions(productId);
      const currentItems = form.getFieldValue('items') || [];
      const currentItem = currentItems[index] || {};
      const productChanged = currentItem.productId !== productId;
      const saleUnitType = product.saleUnitType || SaleUnitType.PIECE;
      const defaultSaleUnit = getDefaultSaleUnit(saleUnitType);
      const quantityRules = getQuantityRuleBySaleUnit(saleUnitType);
      const currentQuantity = Number(currentItem.quantity ?? 0);
      const normalizedQuantity = isQuantityValidForForm(
        currentQuantity,
        saleUnitType,
        defaultSaleUnit
      )
        ? currentQuantity
        : quantityRules.min;
      const currentRecipeVersionId = String(currentItem.recipeVersionId || '').trim();
      const hasCurrentRecipeOption = recipeOptions.some(
        (option) => option.value === currentRecipeVersionId
      );

      currentItems[index] = {
        ...currentItem,
        productId,
        unitPrice: product.price,
        saleUnitType,
        saleUnit: defaultSaleUnit,
        quantity: normalizedQuantity,
        recipeVersionId:
          !productChanged && hasCurrentRecipeOption
            ? currentRecipeVersionId
            : recipeOptions[0]?.value || undefined,
      };
      form.setFieldsValue({ items: currentItems });
    }
  };

  const handleSaleUnitChange = (
    value: StockPurchaseUnit,
    index: number,
    saleUnitType: SaleUnitType
  ): void => {
    const currentItems = form.getFieldValue('items') || [];
    const currentItem = currentItems[index] || {};
    const quantity = Number(currentItem.quantity || 0);
    const quantityInputConfig = getQuantityInputConfig(saleUnitType, value);

    currentItems[index] = {
      ...currentItem,
      saleUnit: value,
      quantity: isQuantityValidForForm(quantity, saleUnitType, value)
        ? quantity
        : quantityInputConfig.min,
    };

    form.setFieldsValue({ items: currentItems });
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
              saleUnit: StockPurchaseUnit.PIECE,
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
                const saleUnit =
                  (items[index]?.saleUnit as StockPurchaseUnit | undefined) ||
                  getDefaultSaleUnit(saleUnitType);
                const quantityInputConfig = getQuantityInputConfig(
                  saleUnitType,
                  saleUnit
                );
                const quantityValue = Number(items[index]?.quantity || 0);
                const normalizedQuantityForSubtotal =
                  saleUnitType === SaleUnitType.WEIGHT
                    ? toWeightQuantityGram(quantityValue, saleUnit)
                    : quantityValue;
                const subtotal = calculateOrderItemSubtotal(
                  normalizedQuantityForSubtotal,
                  Number(items[index]?.unitPrice || 0),
                  saleUnitType
                );
                const isWeight = saleUnitType === SaleUnitType.WEIGHT;
                const recipeOptions = selectedProductId
                  ? recipeOptionsByProductId[selectedProductId] || []
                  : [];
                const selectedRecipeOption = recipeOptions.find(
                  (option) => option.value === items[index]?.recipeVersionId
                );

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

                      <Form.Item
                        {...field}
                        name={[field.name, 'saleUnit']}
                        rules={[{ required: true, message: t('orders.form.validation.saleUnitRequired', 'Unit is required') }]}
                        style={{ marginBottom: 0, width: 130 }}
                      >
                        <Select
                          placeholder={t('orders.form.unit', 'Unit')}
                          disabled={!selectedProductId}
                          onChange={(value) =>
                            handleSaleUnitChange(
                              value as StockPurchaseUnit,
                              index,
                              saleUnitType
                            )
                          }
                        >
                          {saleUnitType === SaleUnitType.WEIGHT ? (
                            <>
                              <Option value={StockPurchaseUnit.GRAM}>
                                {t('orders.form.unitGram', 'Gram')}
                              </Option>
                              <Option value={StockPurchaseUnit.KILOGRAM}>
                                {t('orders.form.unitKilogram', 'Kilogram')}
                              </Option>
                            </>
                          ) : (
                            <Option value={StockPurchaseUnit.PIECE}>
                              {t('orders.form.unitPiece', 'Piece')}
                            </Option>
                          )}
                        </Select>
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
                              if (!isQuantityValidForForm(quantity, saleUnitType, saleUnit)) {
                                if (saleUnitType === SaleUnitType.WEIGHT) {
                                  throw new Error(
                                    t(
                                      'orders.form.validation.weightQuantityRule',
                                      'Weight must be at least 100g and in 100g increments.'
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
                              ? saleUnit === StockPurchaseUnit.KILOGRAM
                                ? t('orders.form.quantityWeightKgPlaceholder', 'Kilogram (0.1kg step)')
                                : t('orders.form.quantityWeightPlaceholder', 'Gram (100g step)')
                              : t('orders.form.quantityShort')
                          }
                          min={quantityInputConfig.min}
                          step={quantityInputConfig.step}
                          precision={quantityInputConfig.precision}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, 'recipeVersionId']}
                        style={{ marginBottom: 0, width: 220 }}
                      >
                        <Select
                          placeholder={t('orders.form.recipeVersion', 'Recipe version')}
                          allowClear
                          disabled={!selectedProductId}
                          loading={selectedProductId ? loadingRecipesByProductId[selectedProductId] : false}
                        >
                          {recipeOptions.map((option) => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
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

                    {selectedRecipeOption ? (
                      <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                        {t('orders.form.recipeEstimatedCost', 'Estimated recipe cost')}: {formatCurrency(selectedRecipeOption.estimatedCost || 0)}
                      </Text>
                    ) : null}
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
                      saleUnit: StockPurchaseUnit.PIECE,
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
