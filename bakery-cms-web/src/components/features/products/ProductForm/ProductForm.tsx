import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      title={isEditMode ? t('products.form.editTitle') : t('products.form.createTitle')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText={isEditMode ? t('products.form.updateButton') : t('products.form.createButton')}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label={t('products.form.name')}
              rules={[
                { required: true, message: t('products.form.validation.nameRequired') },
                { min: 3, message: t('products.form.validation.nameMin') },
                { max: 255, message: t('products.form.validation.nameMax') },
              ]}
            >
              <Input placeholder={t('products.form.namePlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label={t('products.form.description')}
              rules={[{ max: 1000, message: t('products.form.validation.descriptionMax') }]}
            >
              <TextArea rows={4} placeholder={t('products.form.descriptionPlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="price"
              label={t('products.form.price')}
              rules={[
                { required: true, message: t('products.form.validation.priceRequired') },
                { type: 'number', min: 0.01, message: t('products.form.validation.priceMin') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                min={0}
                precision={2}
                placeholder={t('products.form.pricePlaceholder')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="category"
              label={t('products.form.category')}
              rules={[{ max: 100, message: t('products.form.validation.categoryMax') }]}
            >
              <Input placeholder={t('products.form.categoryPlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="businessType"
              label={t('products.form.businessType')}
              rules={[{ required: true, message: t('products.form.validation.businessTypeRequired') }]}
            >
              <Select placeholder={t('products.form.businessTypePlaceholder')}>
                <Option value={BusinessType.READY_TO_SELL}>{t('products.businessType.readyToSell')}</Option>
                <Option value={BusinessType.MADE_TO_ORDER}>{t('products.businessType.madeToOrder')}</Option>
                <Option value={BusinessType.BOTH}>{t('products.businessType.both')}</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="status"
              label={t('products.form.status')}
              rules={[{ required: true, message: t('products.form.validation.statusRequired') }]}
            >
              <Select placeholder={t('products.form.statusPlaceholder')}>
                <Option value={ProductStatus.AVAILABLE}>{t('products.status.available')}</Option>
                <Option value={ProductStatus.OUT_OF_STOCK}>{t('products.status.outOfStock')}</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="imageUrl"
              label={t('products.form.imageUrl')}
              rules={[{ type: 'url', message: t('products.form.validation.imageUrlInvalid') }]}
            >
              <Input placeholder={t('products.form.imageUrlPlaceholder')} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </AntModal>
  );
};
