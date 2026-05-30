import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Grid,
  Input,
  InputNumber,
  List,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { Brand, StockItem, StockItemBrand } from '@/types/models/stock.model';
import { StockPurchaseUnit, StockUnitType } from '@/types/models/stock.model';
import { FileUpload } from '@/components/shared';
import { fileService } from '@/services/file.service';
import { useNotification } from '@/hooks/useNotification';
import { useCrudErrorNotification } from '@/hooks/useCrudErrorNotification';
import {
  addBrandToStockItem,
  createBrand,
  removeBrandFromStockItem,
  setPreferredBrand,
  updateStockItemBrand,
} from '@/services/stock.service';
import { formatCurrency } from '@/utils/format.utils';

const { Text } = Typography;
const { useBreakpoint } = Grid;

type BrandPriceFormValues = {
  readonly brandId?: string;
  readonly isCreatingNewBrand?: boolean;
  readonly newBrandName?: string;
  readonly newBrandImageFileId?: string;
  readonly purchaseQuantity: number;
  readonly purchaseUnit: StockPurchaseUnit;
  readonly priceBeforeTax: number;
  readonly priceAfterTax: number;
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

const convertPurchaseQuantityToBase = (
  unitType: StockUnitType,
  purchaseQuantity: number,
  purchaseUnit: StockPurchaseUnit
): number => {
  if (purchaseQuantity <= 0) return 0;
  if (unitType === StockUnitType.WEIGHT && purchaseUnit === StockPurchaseUnit.KILOGRAM) {
    return purchaseQuantity * 1000;
  }
  if (unitType === StockUnitType.VOLUME && purchaseUnit === StockPurchaseUnit.LITER) {
    return purchaseQuantity * 1000;
  }
  return purchaseQuantity;
};

export type BrandCurrentPricingTableProps = {
  readonly stockItemId: string;
  readonly stockItem: StockItem;
  readonly stockItemBrands: readonly StockItemBrand[];
  readonly allBrands: readonly Brand[];
  readonly onChanged: () => void;
  readonly onReceiveWithPricingForBrand: (brandId: string) => void;
};

export const BrandCurrentPricingTable: React.FC<BrandCurrentPricingTableProps> = ({
  stockItemId,
  stockItem,
  stockItemBrands,
  allBrands,
  onChanged,
  onReceiveWithPricingForBrand,
}) => {
  const { t } = useTranslation();
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StockItemBrand | null>(null);
  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<BrandPriceFormValues>();

  const purchaseQuantity = Form.useWatch('purchaseQuantity', form);
  const purchaseUnit = Form.useWatch('purchaseUnit', form);
  const priceBeforeTax = Form.useWatch('priceBeforeTax', form);
  const priceAfterTax = Form.useWatch('priceAfterTax', form);

  const purchaseUnitOptions = useMemo(
    () => getPurchaseUnitOptions(stockItem.unitType),
    [stockItem.unitType]
  );

  const availableBrands = useMemo(() => {
    const existing = new Set(stockItemBrands.map((b) => b.brandId));
    return allBrands.filter((b) => !existing.has(b.id));
  }, [allBrands, stockItemBrands]);

  const getBrandImageUrl = useCallback(
    (brandId: string): string | null => {
      const brand = allBrands.find((b) => b.id === brandId);
      if (brand?.imageFileId) return fileService.getDownloadUrl(brand.imageFileId);
      return null;
    },
    [allBrands]
  );

  const unitPriceDivider = useMemo(() => {
    const qty = Number(purchaseQuantity || 0);
    if (qty <= 0) return 0;
    return convertPurchaseQuantityToBase(stockItem.unitType, qty, (purchaseUnit as StockPurchaseUnit) || purchaseUnitOptions[0]!);
  }, [purchaseQuantity, purchaseUnit, purchaseUnitOptions, stockItem.unitType]);

  const unitPriceAfterTaxPreview = useMemo(() => {
    const total = Number(priceAfterTax || 0);
    if (unitPriceDivider <= 0) return 0;
    return total / unitPriceDivider;
  }, [priceAfterTax, unitPriceDivider]);

  const unitPriceBeforeTaxPreview = useMemo(() => {
    const total = Number(priceBeforeTax || 0);
    if (unitPriceDivider <= 0) return 0;
    return total / unitPriceDivider;
  }, [priceBeforeTax, unitPriceDivider]);

  const openCreate = () => {
    setEditing(null);
    setIsCreatingNewBrand(false);
    form.resetFields();
    form.setFieldsValue({
      purchaseQuantity: 1,
      purchaseUnit: purchaseUnitOptions[0]!,
      priceBeforeTax: 0,
      priceAfterTax: 0,
    });
    setOpen(true);
  };

  const openEdit = (brandPrice: StockItemBrand) => {
    setEditing(brandPrice);
    setIsCreatingNewBrand(false);
    form.resetFields();
    form.setFieldsValue({
      brandId: brandPrice.brandId,
      purchaseQuantity: brandPrice.purchaseQuantity,
      purchaseUnit: brandPrice.purchaseUnit,
      priceBeforeTax: brandPrice.priceBeforeTax,
      priceAfterTax: brandPrice.priceAfterTax,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
    setIsCreatingNewBrand(false);
    form.resetFields();
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let brandId = values.brandId;
      if (isCreatingNewBrand && values.newBrandName) {
        const createResult = await createBrand({
          name: values.newBrandName,
          imageFileId: values.newBrandImageFileId,
        });
        if (!createResult.success) {
          showCrudError(createResult.error);
          return;
        }
        brandId = createResult.data.id;
      }

      if (!brandId) {
        showCrudError(new Error(t('stock.brandPricing.validation.brandRequired')));
        return;
      }

      const payload = {
        purchaseQuantity: values.purchaseQuantity,
        purchaseUnit: values.purchaseUnit,
        priceBeforeTax: values.priceBeforeTax,
        priceAfterTax: values.priceAfterTax,
      };

      if (editing) {
        const result = await updateStockItemBrand(stockItemId, brandId, payload);
        if (!result.success) {
          showCrudError(result.error);
          return;
        }
        success(t('stock.brandPricing.notifications.updated'), t('stock.brandPricing.notifications.updatedMessage'));
      } else {
        const result = await addBrandToStockItem(stockItemId, { brandId, ...payload });
        if (!result.success) {
          showCrudError(result.error);
          return;
        }
        success(t('stock.brandPricing.notifications.created'), t('stock.brandPricing.notifications.createdMessage'));
      }

      closeModal();
      onChanged();
    } catch (err) {
      if ((err as any)?.errorFields) return;
      showCrudError(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemove = (record: StockItemBrand) => {
    Modal.confirm({
      title: t('stock.brandPricing.removeTitle'),
      content: t('stock.brandPricing.removeConfirm', { brandName: record.brandName }),
      okText: t('common.confirm.yes'),
      cancelText: t('common.confirm.no'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await removeBrandFromStockItem(stockItemId, record.brandId);
          if (!result.success) {
            showCrudError(result.error);
            return;
          }
          success(t('stock.brandPricing.notifications.removed'), t('stock.brandPricing.notifications.removedMessage', { brandName: record.brandName }));
          onChanged();
        } catch (err) {
          showCrudError(err);
        }
      },
    });
  };

  const handleSetPreferred = async (record: StockItemBrand) => {
    try {
      const result = await setPreferredBrand(stockItemId, record.brandId);
      if (!result.success) {
        showCrudError(result.error);
        return;
      }
      success(t('stock.brandPricing.notifications.preferredSet'), t('stock.brandPricing.notifications.preferredSetMessage', { brandName: record.brandName }));
      onChanged();
    } catch (err) {
      showCrudError(err);
    }
  };

  const columns = useMemo<ColumnsType<StockItemBrand>>(
    () => [
      {
        title: '',
        key: 'image',
        width: 56,
        responsive: ['lg'],
        render: (_: unknown, record: StockItemBrand) => {
          const url = getBrandImageUrl(record.brandId);
          return url ? (
            <Avatar src={url} size={36} shape="square" />
          ) : (
            <Avatar icon={<PictureOutlined />} size={36} shape="square" />
          );
        },
      },
      {
        title: t('stock.brandPricing.columns.brand'),
        dataIndex: 'brandName',
        key: 'brandName',
        render: (name: string, record: StockItemBrand) => (
          <Space size={6} wrap>
            <Text strong>{name}</Text>
            {record.isPreferred ? <Tag color="gold">{t('stock.brandPricing.preferred')}</Tag> : null}
          </Space>
        ),
      },
      {
        title: t('stock.brandPricing.columns.purchaseSpec'),
        key: 'purchaseSpec',
        width: 150,
        render: (_: unknown, record: StockItemBrand) =>
          `${record.purchaseQuantity} ${record.purchaseUnit}`,
        responsive: ['md'],
      },
      {
        title: t('stock.brandPricing.columns.priceAfterTax'),
        dataIndex: 'priceAfterTax',
        key: 'priceAfterTax',
        width: 160,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: t('stock.brandPricing.columns.unitPrice'),
        key: 'unitPriceAfterTax',
        width: 180,
        render: (_: unknown, record: StockItemBrand) =>
          `${formatCurrency(record.unitPriceAfterTax)} / ${stockItem.baseUnit}`,
      },
      {
        title: t('common.table.actions'),
        key: 'actions',
        width: 220,
        render: (_: unknown, record: StockItemBrand) => (
          <Space size="small" wrap={false}>
            <Button
              type="link"
              onClick={() => onReceiveWithPricingForBrand(record.brandId)}
            >
              {t('stock.brandPricing.receiveWithPricingForBrand')}
            </Button>
            {!record.isPreferred ? (
              <Button
                type="text"
                icon={<StarOutlined />}
                onClick={() => void handleSetPreferred(record)}
                title={t('stock.brandPricing.setPreferred')}
              />
            ) : (
              <Button type="text" icon={<StarFilled style={{ color: '#faad14' }} />} disabled />
            )}
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => confirmRemove(record)}
            />
          </Space>
        ),
      },
    ],
    [getBrandImageUrl, onReceiveWithPricingForBrand, stockItem.baseUnit, t]
  );

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card
        title={t('stock.detail.brandsAndCurrentPricing')}
        extra={
          <Button icon={<PlusOutlined />} onClick={openCreate}>
            {t('stock.brandPricing.addBrand')}
          </Button>
        }
      >
        <Text type="secondary">{t('stock.detail.brandsCurrentPricingExplain')}</Text>

        <div style={{ marginTop: 12 }}>
          {stockItemBrands.length === 0 ? (
            <Empty description={t('stock.brandPricing.empty')} />
          ) : isMobile ? (
            <List
              dataSource={[...stockItemBrands]}
              renderItem={(record) => (
                <List.Item style={{ padding: 0 }}>
                  <Card
                    size="small"
                    title={
                      <Space size={8} wrap>
                        <Text strong>{record.brandName}</Text>
                        {record.isPreferred ? (
                          <Tag color="gold">{t('stock.brandPricing.preferred')}</Tag>
                        ) : null}
                      </Space>
                    }
                    style={{ width: '100%' }}
                  >
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Text>
                        {t('stock.brandPricing.card.purchaseSpec')}: {record.purchaseQuantity} {record.purchaseUnit}
                      </Text>
                      <Text>
                        {t('stock.brandPricing.card.totalAfterTax')}: {formatCurrency(record.priceAfterTax)}
                      </Text>
                      <Text>
                        {t('stock.brandPricing.card.unitPrice')}: {formatCurrency(record.unitPriceAfterTax)} / {stockItem.baseUnit}
                      </Text>
                      <Row gutter={8}>
                        <Col span={12}>
                          <Button block type="primary" onClick={() => onReceiveWithPricingForBrand(record.brandId)}>
                            {t('stock.brandPricing.receiveWithPricing')}
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button block onClick={() => openEdit(record)}>
                            {t('common.actions.edit')}
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button block onClick={() => void handleSetPreferred(record)} disabled={record.isPreferred}>
                            {t('stock.brandPricing.setPreferred')}
                          </Button>
                        </Col>
                        <Col span={12}>
                          <Button block danger onClick={() => confirmRemove(record)}>
                            {t('common.actions.delete')}
                          </Button>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Table<StockItemBrand>
              columns={columns}
              dataSource={[...stockItemBrands]}
              rowKey="id"
              pagination={false}
              scroll={{ x: 980 }}
            />
          )}
        </div>
      </Card>

      <Modal
        title={editing ? t('stock.brandPricing.editTitle') : t('stock.brandPricing.createTitle')}
        open={open}
        onCancel={closeModal}
        onOk={() => void submit()}
        okText={t('common.actions.save')}
        cancelText={t('common.actions.cancel')}
      confirmLoading={loading}
      width={screens.md ? 720 : '100%'}
      style={!screens.md ? { top: 0, paddingBottom: 0 } : undefined}
      styles={{
        body: {
          maxHeight: !screens.md ? 'calc(100vh - 120px)' : undefined,
          overflowY: !screens.md ? 'auto' : undefined,
        },
      }}
    >
        <Form form={form} layout="vertical" requiredMark="optional">
          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="brandId"
                label={t('stock.brandPricing.brand')}
                rules={[
                  {
                    validator: async (_, value) => {
                      if (isCreatingNewBrand) return;
                      if (!value) throw new Error(t('stock.brandPricing.validation.brandRequired'));
                    },
                  },
                ]}
              >
                <Select
                  placeholder={t('stock.brandPricing.brandPlaceholder')}
                  options={(editing ? allBrands : availableBrands).map((b) => ({
                    value: b.id,
                    label: b.name,
                  }))}
                  showSearch
                  optionFilterProp="label"
                  disabled={isCreatingNewBrand || Boolean(editing)}
                />
              </Form.Item>
              {!editing ? (
                <Button
                  type="link"
                  style={{ paddingLeft: 0 }}
                  onClick={() => setIsCreatingNewBrand((prev) => !prev)}
                >
                  {isCreatingNewBrand
                    ? t('stock.brandPricing.useExistingBrand')
                    : t('stock.brandPricing.createBrandQuick')}
                </Button>
              ) : null}
            </Col>
            <Col xs={24} md={12}>
              {isCreatingNewBrand ? (
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  <Form.Item
                    name="newBrandName"
                    label={t('stock.brandPricing.newBrandName')}
                    rules={[
                      {
                        required: true,
                        message: t('stock.brandPricing.validation.newBrandNameRequired'),
                      },
                    ]}
                  >
                    <Input placeholder={t('stock.brandPricing.newBrandNamePlaceholder')} />
                  </Form.Item>
                  <Form.Item name="newBrandImageFileId" label={t('stock.brandPricing.newBrandImage')}>
                    <FileUpload
                      value={form.getFieldValue('newBrandImageFileId')}
                      onChange={(fileId) => form.setFieldValue('newBrandImageFileId', fileId)}
                      accept="image"
                    />
                  </Form.Item>
                </Space>
              ) : (
                <Alert type="info" showIcon message={t('stock.brandPricing.modalHint')} />
              )}
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="purchaseQuantity"
                label={t('stock.brandPricing.purchaseQuantity')}
                rules={[
                  { required: true, message: t('stock.brandPricing.validation.purchaseQuantityRequired') },
                  { type: 'number', min: 0.0001, message: t('stock.brandPricing.validation.purchaseQuantityMin') },
                ]}
              >
                <InputNumber style={{ width: '100%' }} precision={3} min={0.0001} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="purchaseUnit"
                label={t('stock.brandPricing.purchaseUnit')}
                rules={[
                  { required: true, message: t('stock.brandPricing.validation.purchaseUnitRequired') },
                  {
                    validator: async (_, value: StockPurchaseUnit) => {
                      if (!value || purchaseUnitOptions.includes(value)) return;
                      throw new Error(t('stock.brandPricing.validation.purchaseUnitMismatch'));
                    },
                  },
                ]}
              >
                <Select options={purchaseUnitOptions.map((u) => ({ value: u, label: u }))} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="priceBeforeTax"
                label={t('stock.brandPricing.priceBeforeTax')}
                rules={[
                  { required: true, message: t('stock.brandPricing.validation.priceBeforeTaxRequired') },
                  { type: 'number', min: 0, message: t('stock.brandPricing.validation.priceMin') },
                ]}
              >
                <InputNumber style={{ width: '100%' }} precision={0} min={0} step={1000} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="priceAfterTax"
                label={t('stock.brandPricing.priceAfterTax')}
                rules={[
                  { required: true, message: t('stock.brandPricing.validation.priceAfterTaxRequired') },
                  { type: 'number', min: 0, message: t('stock.brandPricing.validation.priceMin') },
                ]}
              >
                <InputNumber style={{ width: '100%' }} precision={0} min={0} step={1000} />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            type="info"
            showIcon
            message={t('stock.brandPricing.previewTitle')}
            description={
              <Space direction="vertical" size={2}>
                <Text>
                  {t('stock.brandPricing.preview.unitPriceBeforeTax', {
                    value: formatCurrency(unitPriceBeforeTaxPreview),
                    baseUnit: stockItem.baseUnit,
                  })}
                </Text>
                <Text>
                  {t('stock.brandPricing.preview.unitPriceAfterTax', {
                    value: formatCurrency(unitPriceAfterTaxPreview),
                    baseUnit: stockItem.baseUnit,
                  })}
                </Text>
              </Space>
            }
          />
        </Form>
      </Modal>
    </Space>
  );
};
