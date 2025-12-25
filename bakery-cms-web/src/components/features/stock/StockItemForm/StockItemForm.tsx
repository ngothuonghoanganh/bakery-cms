import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col } from 'antd';
import { AntModal } from '../../../core';
import type { StockItemFormProps, StockItemFormValues } from './StockItemForm.types';

const { TextArea } = Input;

export const StockItemForm: React.FC<StockItemFormProps> = ({
  visible,
  stockItem,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm<StockItemFormValues>();
  const isEditMode = Boolean(stockItem);

  useEffect(() => {
    if (visible && stockItem) {
      form.setFieldsValue({
        name: stockItem.name,
        description: stockItem.description || undefined,
        unitOfMeasure: stockItem.unitOfMeasure,
        reorderThreshold: stockItem.reorderThreshold || undefined,
      });
    } else if (visible && !stockItem) {
      form.resetFields();
      form.setFieldsValue({
        currentQuantity: 0,
      });
    }
  }, [visible, stockItem, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <AntModal
      title={isEditMode ? 'Edit Stock Item' : 'Create Stock Item'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText={isEditMode ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label="Stock Item Name"
              rules={[
                { required: true, message: 'Stock item name is required' },
                { min: 1, message: 'Stock item name must be at least 1 character' },
                { max: 255, message: 'Stock item name must not exceed 255 characters' },
              ]}
            >
              <Input placeholder="Enter stock item name (e.g., Flour, Sugar)" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ max: 1000, message: 'Description must not exceed 1000 characters' }]}
            >
              <TextArea rows={4} placeholder="Enter stock item description" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="unitOfMeasure"
              label="Unit of Measure"
              rules={[
                { required: true, message: 'Unit of measure is required' },
                { min: 1, message: 'Unit of measure must be at least 1 character' },
                { max: 50, message: 'Unit of measure must not exceed 50 characters' },
              ]}
            >
              <Input placeholder="e.g., kg, liters, pieces" />
            </Form.Item>
          </Col>

          {!isEditMode && (
            <Col span={12}>
              <Form.Item
                name="currentQuantity"
                label="Initial Quantity"
                rules={[{ type: 'number', min: 0, message: 'Quantity must be 0 or greater' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter initial quantity"
                  min={0}
                  precision={3}
                />
              </Form.Item>
            </Col>
          )}

          <Col span={isEditMode ? 24 : 12}>
            <Form.Item
              name="reorderThreshold"
              label="Reorder Threshold"
              tooltip="Alert when stock falls below this level"
              rules={[{ type: 'number', min: 0, message: 'Threshold must be 0 or greater' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="Enter reorder threshold"
                min={0}
                precision={3}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </AntModal>
  );
};
