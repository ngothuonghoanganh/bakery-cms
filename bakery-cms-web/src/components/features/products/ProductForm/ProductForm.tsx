import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Row, Col } from 'antd';
import { AntModal } from '../../../core';
import { BusinessType, ProductStatus } from '../../../../types/models/product.model';
import type { ProductFormProps, ProductFormValues } from './ProductForm.types';

const { TextArea } = Input;
const { Option } = Select;

export const ProductForm: React.FC<ProductFormProps> = ({
  visible,
  product,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm<ProductFormValues>();
  const isEditMode = Boolean(product);

  useEffect(() => {
    if (visible && product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description || undefined,
        price: product.price,
        category: product.category || undefined,
        businessType: product.businessType,
        status: product.status,
        imageUrl: product.imageUrl || undefined,
      });
    } else if (visible && !product) {
      form.resetFields();
      form.setFieldsValue({
        businessType: BusinessType.READY_TO_SELL,
        status: ProductStatus.AVAILABLE,
      });
    }
  }, [visible, product, form]);

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
      title={isEditMode ? 'Edit Product' : 'Create Product'}
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
              label="Product Name"
              rules={[
                { required: true, message: 'Product name is required' },
                { min: 3, message: 'Product name must be at least 3 characters' },
                { max: 255, message: 'Product name must not exceed 255 characters' },
              ]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label="Description"
              rules={[{ max: 1000, message: 'Description must not exceed 1000 characters' }]}
            >
              <TextArea rows={4} placeholder="Enter product description" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="price"
              label="Price"
              rules={[
                { required: true, message: 'Price is required' },
                { type: 'number', min: 0.01, message: 'Price must be greater than 0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                min={0}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ max: 100, message: 'Category must not exceed 100 characters' }]}
            >
              <Input placeholder="Enter category" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="businessType"
              label="Business Type"
              rules={[{ required: true, message: 'Business type is required' }]}
            >
              <Select placeholder="Select business type">
                <Option value={BusinessType.READY_TO_SELL}>Ready to Sell</Option>
                <Option value={BusinessType.MADE_TO_ORDER}>Made to Order</Option>
                <Option value={BusinessType.BOTH}>Both</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: 'Status is required' }]}
            >
              <Select placeholder="Select status">
                <Option value={ProductStatus.AVAILABLE}>Available</Option>
                <Option value={ProductStatus.OUT_OF_STOCK}>Out of Stock</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="imageUrl"
              label="Image URL"
              rules={[{ type: 'url', message: 'Please enter a valid URL' }]}
            >
              <Input placeholder="https://example.com/image.jpg" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </AntModal>
  );
};
