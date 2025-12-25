/**
 * ProductRecipe component
 * Displays and manages product recipe (list of stock items required to make a product)
 */

import React, { useState, useCallback } from 'react';
import { Card, Table, Button, Space, Popconfirm, Tag, Typography, Spin, Alert, Modal, Form, InputNumber, Input, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import { useProductRecipe } from '@/hooks/useProductRecipe';
import { useStockItems } from '@/hooks/useStockItems';
import { stockService } from '@/services/stock.service';
import { useNotification } from '@/hooks/useNotification';
import type { ProductRecipeProps, ProductStockItemFormValues } from './ProductRecipe.types';
import type { ProductStockItem } from '@/types/models/stock.model';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const ProductRecipe: React.FC<ProductRecipeProps> = ({ productId, onRecipeChange }) => {
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
        success('Removed', 'Stock item removed from product successfully');
        refetchAll();
        onRecipeChange?.();
      } else {
        showError('Failed', result.error.message);
      }
    } catch (err) {
      showError('Error', 'Failed to remove stock item from product');
    }
  }, [productId, refetchAll, onRecipeChange, success, showError]);

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
          success('Updated', 'Stock item updated successfully');
          setModalVisible(false);
          refetchAll();
          onRecipeChange?.();
        } else {
          showError('Failed', result.error.message);
        }
      } else {
        // Add new
        const result = await stockService.addStockItemToProduct(productId, values);
        if (result.success) {
          success('Added', 'Stock item added to product successfully');
          setModalVisible(false);
          refetchAll();
          onRecipeChange?.();
        } else {
          showError('Failed', result.error.message);
        }
      }
    } catch (err) {
      showError('Error', 'Failed to save stock item');
    } finally {
      setSubmitting(false);
    }
  }, [editingItem, productId, refetchAll, onRecipeChange, success, showError]);

  const columns = [
    {
      title: 'Stock Item',
      dataIndex: 'stockItemName',
      key: 'stockItemName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: ProductStockItem) =>
        `${quantity} ${record.unitOfMeasure}`,
    },
    {
      title: 'Preferred Brand',
      dataIndex: 'preferredBrandName',
      key: 'preferredBrandName',
      render: (name: string | null) => name || <Text type="secondary">No preference</Text>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string | null) => notes || <Text type="secondary">-</Text>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: ProductStockItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Remove this ingredient?"
            onConfirm={() => handleDelete(record.stockItemId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
        <Alert message="Error" description={error.message} type="error" showIcon />
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Product Recipe"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Ingredient
          </Button>
        }
      >
        {cost && (
          <Alert
            message={
              <Space>
                <DollarOutlined />
                <Text strong>Estimated Cost: {cost.totalCost.toLocaleString()} VND</Text>
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
        title={editingItem ? 'Edit Ingredient' : 'Add Ingredient'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="stockItemId"
            label="Stock Item"
            rules={[{ required: true, message: 'Please select a stock item' }]}
          >
            <Select
              placeholder="Select stock item"
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
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={0.001} step={0.001} precision={3} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="preferredBrandId" label="Preferred Brand">
            <Select placeholder="Select preferred brand (optional)" allowClear>
              {/* Brands would be loaded based on selected stock item */}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Add any notes about this ingredient" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
