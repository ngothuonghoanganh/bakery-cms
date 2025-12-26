/**
 * ProductRecipe component
 * Displays and manages product recipe (list of stock items required to make a product)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Card, Table, Button, Space, Popconfirm, Typography, Spin, Alert, Modal, Form, InputNumber, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useProductRecipe } from '@/hooks/useProductRecipe';
import { useStockItems } from '@/hooks/useStockItems';
import { stockService } from '@/services/stock.service';
import { useNotification } from '@/hooks/useNotification';
import type { ProductRecipeProps, ProductStockItemFormValues } from './ProductRecipe.types';
import type { ProductStockItem } from '@/types/models/stock.model';

const { Text } = Typography;
const { TextArea } = Input;

export const ProductRecipe: React.FC<ProductRecipeProps> = ({ productId, onRecipeChange }) => {
  const { t } = useTranslation();
  const { recipe, cost, loading, error, refetchAll } = useProductRecipe({ productId });
  const { stockItems } = useStockItems({ pagination: { limit: 100 } });
  const { success, error: showError } = useNotification();
  const [form] = Form.useForm<ProductStockItemFormValues>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductStockItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = useCallback(() => {
    setEditingItem(null);
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

  const handleDelete = useCallback(async (stockItemId: string) => {
    try {
      const result = await stockService.removeStockItemFromProduct(productId, stockItemId);
      if (result.success) {
        success(t('stock.recipe.removed'), t('stock.recipe.removedMessage'));
        refetchAll();
        onRecipeChange?.();
      } else {
        showError(t('common.status.failed'), result.error.message);
      }
    } catch (err) {
      showError(t('common.status.error'), t('stock.recipe.removeError'));
    }
  }, [productId, refetchAll, onRecipeChange, success, showError, t]);

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
          showError(t('common.status.failed'), result.error.message);
        }
      } else {
        // Add new
        const result = await stockService.addStockItemToProduct(productId, values);
        if (result.success) {
          success(t('stock.recipe.added'), t('stock.recipe.addedMessage'));
          setModalVisible(false);
          refetchAll();
          onRecipeChange?.();
        } else {
          showError(t('common.status.failed'), result.error.message);
        }
      }
    } catch (err) {
      showError(t('common.status.error'), t('stock.recipe.saveError'));
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, productId, refetchAll, onRecipeChange, success, showError, t]);

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
            >
              {stockItems?.map((item) => (
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

          <Form.Item name="preferredBrandId" label={t('stock.recipe.preferredBrand')}>
            <Select placeholder={t('stock.recipe.selectPreferredBrand')} allowClear>
              {/* Brands would be loaded based on selected stock item */}
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
