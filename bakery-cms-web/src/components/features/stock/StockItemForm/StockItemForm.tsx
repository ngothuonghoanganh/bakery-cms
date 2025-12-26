import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      title={isEditMode ? t('stock.form.editTitle') : t('stock.form.createTitle')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText={isEditMode ? t('common.actions.update') : t('common.actions.create')}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label={t('stock.form.name')}
              rules={[
                { required: true, message: t('stock.form.validation.nameRequired') },
                { min: 1, message: t('stock.form.validation.nameMin') },
                { max: 255, message: t('stock.form.validation.nameMax') },
              ]}
            >
              <Input placeholder={t('stock.form.namePlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label={t('stock.form.description')}
              rules={[{ max: 1000, message: t('stock.form.validation.descriptionMax') }]}
            >
              <TextArea rows={4} placeholder={t('stock.form.descriptionPlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="unitOfMeasure"
              label={t('stock.form.unitOfMeasure')}
              rules={[
                { required: true, message: t('stock.form.validation.unitRequired') },
                { min: 1, message: t('stock.form.validation.unitMin') },
                { max: 50, message: t('stock.form.validation.unitMax') },
              ]}
            >
              <Input placeholder={t('stock.form.unitPlaceholder')} />
            </Form.Item>
          </Col>

          {!isEditMode && (
            <Col span={12}>
              <Form.Item
                name="currentQuantity"
                label={t('stock.form.initialQuantity')}
                rules={[{ type: 'number', min: 0, message: t('stock.form.validation.quantityMin') }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder={t('stock.form.initialQuantityPlaceholder')}
                  min={0}
                  precision={3}
                />
              </Form.Item>
            </Col>
          )}

          <Col span={isEditMode ? 24 : 12}>
            <Form.Item
              name="reorderThreshold"
              label={t('stock.form.reorderThreshold')}
              tooltip={t('stock.form.reorderThresholdTooltip')}
              rules={[{ type: 'number', min: 0, message: t('stock.form.validation.thresholdMin') }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={t('stock.form.reorderThresholdPlaceholder')}
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
