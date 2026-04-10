/**
 * ProductRecipe component
 * Displays and manages product recipe (list of stock items required to make a product)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, Table, Button, Space, Popconfirm, Typography, Spin, Alert, Modal, Form, InputNumber, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useProductRecipe } from '@/hooks/useProductRecipe';
import { useStockItems } from '@/hooks/useStockItems';
import { stockService } from '@/services/stock.service';
import { useNotification } from '@/hooks/useNotification';
import { useCrudErrorNotification } from '@/hooks/useCrudErrorNotification';
import { ErrorCode } from '@/types/common/error.types';
import type { ProductRecipeProps, ProductStockItemFormValues } from './ProductRecipe.types';
import type { ProductStockItem, StockItemBrand } from '@/types/models/stock.model';

const { Text } = Typography;
const { TextArea } = Input;

export const ProductRecipe: React.FC<ProductRecipeProps> = ({ productId, onRecipeChange }) => {
  const { t } = useTranslation();
  const { recipe, cost, loading, error, refetchAll } = useProductRecipe({ productId });
  const { stockItems } = useStockItems({ pagination: { limit: 100 } });
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const [form] = Form.useForm<ProductStockItemFormValues>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductStockItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [brandOptions, setBrandOptions] = useState<readonly StockItemBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const selectedStockItemId = Form.useWatch('stockItemId', form);
  const linkedStockItemIds = useMemo(
    () => new Set((recipe?.stockItems || []).map((item) => item.stockItemId)),
    [recipe?.stockItems]
  );
  const selectableStockItems = useMemo(() => {
    if (!stockItems) {
      return [];
    }
    if (editingItem) {
      return stockItems;
    }
    return stockItems.filter((item) => !linkedStockItemIds.has(item.id));
  }, [stockItems, editingItem, linkedStockItemIds]);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
    setBrandOptions([]);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback((item: ProductStockItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      stockItemId: item.stockItemId,
      quantity: item.quantity,
      preferredBrandId: item.preferredBrandId || undefined,
      notes: item.notes || undefined,
    });
    setModalVisible(true);
  }, [form]);

  useEffect(() => {
    if (!modalVisible || !selectedStockItemId) {
      setBrandOptions([]);
      setBrandsLoading(false);
      return;
    }

    let isMounted = true;

    const loadBrands = async (): Promise<void> => {
      setBrandsLoading(true);
      const result = await stockService.getStockItemBrands(selectedStockItemId);

      if (!isMounted) {
        return;
      }

      if (result.success) {
        setBrandOptions(result.data);
        const selectedBrandId = form.getFieldValue('preferredBrandId');
        if (selectedBrandId && !result.data.some((brand) => brand.brandId === selectedBrandId)) {
          form.setFieldValue('preferredBrandId', undefined);
        }
      } else {
        setBrandOptions([]);
        showCrudError(result.error);
      }

      setBrandsLoading(false);
    };

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, [form, modalVisible, selectedStockItemId, showCrudError]);

  const handleDelete = useCallback(async (stockItemId: string) => {
    try {
      const result = await stockService.removeStockItemFromProduct(productId, stockItemId);
      if (result.success) {
        success(t('stock.recipe.removed'), t('stock.recipe.removedMessage'));
        refetchAll();
        onRecipeChange?.();
      } else {
        showCrudError(result.error);
      }
    } catch (err) {
      showCrudError(err);
    }
  }, [onRecipeChange, productId, refetchAll, showCrudError, success, t]);

  const handleSubmit = useCallback(async (values: ProductStockItemFormValues) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        // Update existing
        const result = await stockService.updateProductStockItem(productId, editingItem.stockItemId, {
          quantity: values.quantity,
          preferredBrandId: values.preferredBrandId,
          notes: values.notes,
        });
        if (result.success) {
          success(t('stock.recipe.updated'), t('stock.recipe.updatedMessage'));
          setModalVisible(false);
          refetchAll();
          onRecipeChange?.();
        } else {
          showCrudError(result.error);
        }
      } else {
        // Add new
        if (!values.preferredBrandId) {
          showCrudError({
            code: ErrorCode.MISSING_REQUIRED_FIELD,
            message: t('stock.recipe.selectPreferredBrandRequired'),
            statusCode: 400,
            timestamp: new Date(),
            details: [
              {
                field: 'preferredBrandId',
                message: t('stock.recipe.selectPreferredBrandRequired'),
              },
            ],
          });
          return;
        }

        const result = await stockService.addStockItemToProduct(productId, {
          stockItemId: values.stockItemId,
          quantity: values.quantity,
          preferredBrandId: values.preferredBrandId,
          notes: values.notes,
        });
        if (result.success) {
          success(t('stock.recipe.added'), t('stock.recipe.addedMessage'));
          setModalVisible(false);
          refetchAll();
          onRecipeChange?.();
        } else {
          showCrudError(result.error);
        }
      }
    } catch (err) {
      showCrudError(err);
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, onRecipeChange, productId, refetchAll, showCrudError, success, t]);

  const columns = useMemo(
    () => [
      {
        title: t('stock.recipe.stockItem'),
        dataIndex: 'stockItemName',
        key: 'stockItemName',
      },
      {
        title: t('stock.recipe.quantity'),
        dataIndex: 'quantity',
        key: 'quantity',
        render: (quantity: number, record: ProductStockItem) =>
          `${quantity} ${record.unitOfMeasure}`,
      },
      {
        title: t('stock.recipe.preferredBrand'),
        dataIndex: 'preferredBrandName',
        key: 'preferredBrandName',
        render: (name: string | null) => name || <Text type="secondary">{t('stock.recipe.noPreference')}</Text>,
      },
      {
        title: t('stock.recipe.notes'),
        dataIndex: 'notes',
        key: 'notes',
        render: (notes: string | null) => notes || <Text type="secondary">-</Text>,
      },
      {
        title: t('common.table.actions'),
        key: 'action',
        render: (_: unknown, record: ProductStockItem) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              {t('common.actions.edit')}
            </Button>
            <Popconfirm
              title={t('stock.recipe.removeConfirm')}
              onConfirm={() => handleDelete(record.stockItemId)}
              okText={t('common.confirm.yes')}
              cancelText={t('common.confirm.no')}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                {t('common.actions.remove')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, handleEdit, handleDelete]
  );

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert message={t('common.status.error')} description={error.message} type="error" showIcon />
      </Card>
    );
  }

  return (
    <>
      <Card
        title={t('stock.recipe.title')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            {t('stock.recipe.addIngredient')}
          </Button>
        }
      >
        {cost && (
          <Alert
            message={
              <Space>
                <DollarOutlined />
                <Text strong>{t('stock.recipe.estimatedCost', { cost: cost.totalCost.toLocaleString() })}</Text>
              </Space>
            }
            type="info"
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Table
          columns={columns}
          dataSource={recipe?.stockItems || []}
          rowKey="id"
          pagination={false}
        />
      </Card>

      <Modal
        title={editingItem ? t('stock.recipe.editIngredient') : t('stock.recipe.addIngredient')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="stockItemId"
            label={t('stock.recipe.stockItem')}
            rules={[{ required: true, message: t('stock.recipe.selectStockItemRequired') }]}
          >
            <Select
              placeholder={t('stock.recipe.selectStockItem')}
              showSearch
              optionFilterProp="children"
              disabled={!!editingItem}
              onChange={() => form.setFieldValue('preferredBrandId', undefined)}
              notFoundContent={t('stock.recipe.noAvailableStockItems')}
            >
              {selectableStockItems.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name} ({item.unitOfMeasure})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label={t('stock.recipe.quantity')}
            rules={[{ required: true, message: t('stock.recipe.quantityRequired') }]}
          >
            <InputNumber min={0.001} step={0.001} precision={3} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="preferredBrandId"
            label={t('stock.recipe.preferredBrand')}
            rules={[
              {
                required: !editingItem,
                message: t('stock.recipe.selectPreferredBrandRequired'),
              },
            ]}
          >
            <Select
              placeholder={t('stock.recipe.selectPreferredBrand')}
              allowClear={!!editingItem}
              loading={brandsLoading}
              disabled={!selectedStockItemId}
              notFoundContent={
                selectedStockItemId
                  ? t('stock.recipe.noBrandsAvailable')
                  : t('stock.recipe.selectStockItemFirst')
              }
            >
              {brandOptions.map((brand) => (
                <Select.Option key={brand.brandId} value={brand.brandId}>
                  {brand.brandName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label={t('stock.recipe.notes')}>
            <TextArea rows={3} placeholder={t('stock.recipe.notesPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
