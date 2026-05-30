import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs, { type Dayjs } from 'dayjs';
import { FileUpload } from '@/components/shared';
import type { Brand, StockItem } from '@/types/models/stock.model';
import { StockPurchaseUnit, StockUnitType } from '@/types/models/stock.model';
import { formatCurrency } from '@/utils/format.utils';

const { Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

export type ReceiveWithPricingFormValues = {
  readonly brandId?: string;
  readonly isCreatingNewBrand?: boolean;
  readonly newBrandName?: string;
  readonly newBrandImageFileId?: string;
  readonly supplierName?: string;
  readonly invoiceCode?: string;
  readonly receivedQuantity: number;
  readonly receivedUnit: StockPurchaseUnit;
  readonly receivedAt?: Dayjs;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
  readonly note?: string;
};

export type ReceiveWithPricingModalProps = {
  readonly open: boolean;
  readonly loading?: boolean;
  readonly stockItem: StockItem;
  readonly brands: readonly Brand[];
  readonly initialBrandId?: string;
  readonly onCancel: () => void;
  readonly onSubmit: (values: ReceiveWithPricingFormValues) => Promise<void> | void;
};

const getPurchaseUnitOptions = (unitType: StockUnitType): StockPurchaseUnit[] => {
  if (unitType === StockUnitType.WEIGHT) {
    return [StockPurchaseUnit.GRAM, StockPurchaseUnit.KILOGRAM];
  }
  if (unitType === StockUnitType.VOLUME) {
    return [StockPurchaseUnit.MILLILITER, StockPurchaseUnit.LITER];
  }
  return [StockPurchaseUnit.PIECE];
};

const convertToBaseQuantity = (
  unitType: StockUnitType,
  quantity: number,
  unit: StockPurchaseUnit
): number => {
  if (quantity <= 0) return 0;
  if (unitType === StockUnitType.WEIGHT && unit === StockPurchaseUnit.KILOGRAM) {
    return quantity * 1000;
  }
  if (unitType === StockUnitType.VOLUME && unit === StockPurchaseUnit.LITER) {
    return quantity * 1000;
  }
  return quantity;
};

export const ReceiveWithPricingModal: React.FC<ReceiveWithPricingModalProps> = ({
  open,
  loading,
  stockItem,
  brands,
  initialBrandId,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [form] = Form.useForm<ReceiveWithPricingFormValues>();
  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);

  const receivedQuantity = Form.useWatch('receivedQuantity', form);
  const receivedUnit = Form.useWatch('receivedUnit', form);
  const priceAfterTax = Form.useWatch('priceAfterTax', form);
  const priceBeforeTax = Form.useWatch('priceBeforeTax', form);

  const purchaseUnitOptions = useMemo(
    () => getPurchaseUnitOptions(stockItem.unitType),
    [stockItem.unitType]
  );

  useEffect(() => {
    if (!open) return;

    setIsCreatingNewBrand(false);
    form.resetFields();
    form.setFieldsValue({
      brandId: initialBrandId,
      receivedQuantity: 1,
      receivedUnit: purchaseUnitOptions[0]!,
      receivedAt: dayjs(),
      priceBeforeTax: 0,
      priceAfterTax: 0,
    });
  }, [form, initialBrandId, open, purchaseUnitOptions]);

  useEffect(() => {
    form.setFieldValue('isCreatingNewBrand', isCreatingNewBrand);
    if (isCreatingNewBrand) {
      form.setFieldValue('brandId', undefined);
    } else {
      form.setFieldValue('newBrandName', undefined);
      form.setFieldValue('newBrandImageFileId', undefined);
    }
  }, [form, isCreatingNewBrand]);

  const receivedQuantityBase = useMemo(() => {
    return convertToBaseQuantity(
      stockItem.unitType,
      Number(receivedQuantity || 0),
      (receivedUnit as StockPurchaseUnit | undefined) || purchaseUnitOptions[0]!
    );
  }, [purchaseUnitOptions, receivedQuantity, receivedUnit, stockItem.unitType]);

  const unitPriceAfterTax = useMemo(() => {
    const total = Number(priceAfterTax || 0);
    if (receivedQuantityBase <= 0) return 0;
    return total / receivedQuantityBase;
  }, [priceAfterTax, receivedQuantityBase]);

  const nextStockQuantityBase = useMemo(() => {
    return Number(stockItem.currentQuantity || 0) + receivedQuantityBase;
  }, [receivedQuantityBase, stockItem.currentQuantity]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (err) {
      if ((err as any)?.errorFields) return;
      throw err;
    }
  };

  return (
    <Modal
      title={t('stock.receive.title')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={t('stock.receive.confirm')}
      cancelText={t('common.actions.cancel')}
      confirmLoading={loading}
      width={isMobile ? '100%' : 800}
      style={isMobile ? { top: 0, paddingBottom: 0 } : undefined}
      styles={{
        body: {
          maxHeight: isMobile ? 'calc(100vh - 120px)' : undefined,
          overflowY: isMobile ? 'auto' : undefined,
        },
      }}
      okButtonProps={{ type: 'primary' }}
      footer={isMobile ? null : undefined}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Card size="small" title={t('stock.receive.sections.source')}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="brandId"
                    label={t('stock.receive.brand')}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (isCreatingNewBrand) return;
                          if (!value) {
                            throw new Error(t('stock.receive.validation.brandRequired'));
                          }
                        },
                      },
                    ]}
                  >
                    <Select
                      placeholder={t('stock.receive.brandPlaceholder')}
                      options={brands.map((b) => ({ value: b.id, label: b.name }))}
                      showSearch
                      optionFilterProp="label"
                      disabled={isCreatingNewBrand}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Button
                    type="link"
                    style={{ paddingLeft: 0 }}
                    onClick={() => setIsCreatingNewBrand((prev) => !prev)}
                  >
                    {isCreatingNewBrand
                      ? t('stock.receive.useExistingBrand')
                      : t('stock.receive.createBrandQuick')}
                  </Button>
                </Col>
              </Row>

              {isCreatingNewBrand ? (
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="newBrandName"
                      label={t('stock.receive.newBrandName')}
                      rules={[
                        { required: true, message: t('stock.receive.validation.newBrandNameRequired') },
                      ]}
                    >
                      <Input placeholder={t('stock.receive.newBrandNamePlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="newBrandImageFileId" label={t('stock.receive.newBrandImage')}>
                      <FileUpload
                        value={form.getFieldValue('newBrandImageFileId')}
                        onChange={(fileId) => form.setFieldValue('newBrandImageFileId', fileId)}
                        accept="image"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              ) : null}

              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <Form.Item name="supplierName" label={t('stock.receive.supplierName')}>
                    <Input placeholder={t('stock.receive.supplierPlaceholder')} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="invoiceCode" label={t('stock.receive.invoiceCode')}>
                    <Input placeholder={t('stock.receive.invoicePlaceholder')} />
                  </Form.Item>
                </Col>
              </Row>
            </Space>
          </Card>

          <Card size="small" title={t('stock.receive.sections.quantity')}>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="receivedQuantity"
                  label={t('stock.receive.receivedQuantity')}
                  rules={[
                    { required: true, message: t('stock.receive.validation.receivedQuantityRequired') },
                    {
                      type: 'number',
                      min: 0.001,
                      message: t('stock.receive.validation.receivedQuantityMin'),
                    },
                  ]}
                >
                  <InputNumber style={{ width: '100%' }} min={0.001} step={0.001} precision={3} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="receivedUnit"
                  label={t('stock.receive.receivedUnit')}
                  rules={[{ required: true, message: t('stock.receive.validation.receivedUnitRequired') }]}
                >
                  <Select
                    options={purchaseUnitOptions.map((u) => ({ value: u, label: u }))}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="receivedAt" label={t('stock.receive.receivedAt')}>
                  <DatePicker showTime style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card size="small" title={t('stock.receive.sections.pricing')}>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="priceBeforeTax"
                  label={t('stock.receive.priceBeforeTax')}
                  rules={[{ required: true, message: t('stock.receive.validation.priceBeforeTaxRequired') }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} step={1000} precision={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="priceAfterTax"
                  label={t('stock.receive.priceAfterTax')}
                  dependencies={['priceBeforeTax']}
                  rules={[
                    { required: true, message: t('stock.receive.validation.priceAfterTaxRequired') },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const before = Number(getFieldValue('priceBeforeTax') || 0);
                        const after = Number(value || 0);
                        if (after < before) {
                          return Promise.reject(
                            new Error(t('stock.receive.validation.priceAfterTaxGteBeforeTax'))
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} step={1000} precision={0} />
                </Form.Item>
              </Col>
            </Row>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('stock.receive.pricingHint')}
            </Text>
          </Card>

          <Card size="small" title={t('stock.receive.sections.preview')}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text>
                {t('stock.receive.preview.receivedSpec', {
                  quantity: Number(receivedQuantity || 0) || 0,
                  unit: String(receivedUnit || '-'),
                })}
              </Text>
              <Text>
                {t('stock.receive.preview.convertedSpec', {
                  quantityBase: receivedQuantityBase,
                  baseUnit: stockItem.baseUnit,
                })}
              </Text>
              <Text>
                {t('stock.receive.preview.totalAfterTax', {
                  value: formatCurrency(Number(priceAfterTax || 0)),
                })}
              </Text>
              <Text>
                {t('stock.receive.preview.unitPrice', {
                  value: formatCurrency(unitPriceAfterTax),
                  baseUnit: stockItem.baseUnit,
                })}
              </Text>
              <Text>
                {t('stock.receive.preview.stockAfter', {
                  value: nextStockQuantityBase,
                  baseUnit: stockItem.baseUnit,
                })}
              </Text>
              {Number(priceBeforeTax || 0) > 0 || Number(priceAfterTax || 0) > 0 ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('stock.receive.preview.note')}
                </Text>
              ) : null}
            </Space>
          </Card>

          <Card size="small" title={t('stock.receive.note')}>
            <Form.Item name="note" style={{ marginBottom: 0 }}>
              <TextArea rows={3} placeholder={t('stock.receive.notePlaceholder')} />
            </Form.Item>
          </Card>

          {isMobile ? (
            <Row gutter={8}>
              <Col span={12}>
                <Button block onClick={onCancel}>
                  {t('common.actions.cancel')}
                </Button>
              </Col>
              <Col span={12}>
                <Button block type="primary" loading={loading} onClick={handleOk}>
                  {t('stock.receive.confirm')}
                </Button>
              </Col>
            </Row>
          ) : null}
        </Space>
      </Form>
    </Modal>
  );
};
