/**
 * Stock Item Detail Page
 * Shows stock item details with tabs for brands, movements, and stock operations
 * Full brand CRUD is managed within this page (inline brand creation/editing)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Tag,
  Tabs,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Space,
  Spin,
  Typography,
  Statistic,
  Row,
  Col,
  Divider,
  Select,
  Popconfirm,
  Table,
  Empty,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MinusOutlined,
  EditOutlined,
  HistoryOutlined,
  TagsOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader, FileUpload } from '@/components/shared';
import { StockMovementHistory } from '@/components/features/stock/StockMovementHistory/StockMovementHistory';
import { useNotification } from '@/hooks/useNotification';
import { useBrands } from '@/hooks/useBrands';
import { fileService } from '@/services/file.service';
import {
  getStockItemById,
  receiveStock,
  adjustStock,
  getStockItemBrands,
  addBrandToStockItem,
  updateStockItemBrand,
  removeBrandFromStockItem,
  setPreferredBrand,
  createBrand,
} from '@/services/stock.service';
import { StockItemStatus } from '@/types/models/stock.model';
import type { StockItem, StockItemBrand, Brand } from '@/types/models/stock.model';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BrandPriceFormValues {
  brandId?: string;
  newBrandName?: string;
  newBrandImageFileId?: string;
  priceBeforeTax: number;
  priceAfterTax: number;
}

const getStatusColor = (status: StockItemStatus): string => {
  switch (status) {
    case StockItemStatus.AVAILABLE:
      return 'green';
    case StockItemStatus.LOW_STOCK:
      return 'orange';
    case StockItemStatus.OUT_OF_STOCK:
      return 'red';
    default:
      return 'default';
  }
};

export const StockItemDetailPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();

  const getStatusLabel = (status: StockItemStatus): string => {
    switch (status) {
      case StockItemStatus.AVAILABLE:
        return t('stock.status.inStock', 'Available');
      case StockItemStatus.LOW_STOCK:
        return t('stock.status.lowStock', 'Low Stock');
      case StockItemStatus.OUT_OF_STOCK:
        return t('stock.status.outOfStock', 'Out of Stock');
      default:
        return status;
    }
  };

  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [stockItemBrands, setStockItemBrands] = useState<StockItemBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [receiveModalVisible, setReceiveModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [editingBrandPrice, setEditingBrandPrice] = useState<StockItemBrand | null>(null);
  const [isCreatingNewBrand, setIsCreatingNewBrand] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [receiveForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [brandPriceForm] = Form.useForm<BrandPriceFormValues>();

  // Fetch all available brands for the dropdown
  const { brands: allBrands, refetch: refetchAllBrands } = useBrands({ autoFetch: true });

  const fetchStockItem = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const result = await getStockItemById(id);
      if (result.success && result.data) {
        setStockItem(result.data);
      } else {
        notifyError(t('common.status.error', 'Error'), t('stock.notifications.operationFailed', 'Failed to load stock item'));
      }
    } catch (err) {
      notifyError(t('common.status.error', 'Error'), t('stock.notifications.operationFailed', 'Failed to load stock item'));
    } finally {
      setLoading(false);
    }
  }, [id, notifyError, t]);

  const fetchStockItemBrands = useCallback(async () => {
    if (!id) return;

    try {
      const result = await getStockItemBrands(id);
      if (result.success) {
        setStockItemBrands(result.data);
      }
    } catch (err) {
      // Brands are optional, don't show error
    }
  }, [id]);

  useEffect(() => {
    fetchStockItem();
    fetchStockItemBrands();
  }, [fetchStockItem, fetchStockItemBrands]);

  const handleReceiveStock = useCallback(async (values: { quantity: number; reason?: string }) => {
    if (!id) return;

    setOperationLoading(true);
    try {
      const result = await receiveStock(id, {
        quantity: values.quantity,
        reason: values.reason,
      });

      if (result.success) {
        success(t('stock.detail.stockReceived', 'Stock Received'), t('stock.detail.stockReceivedMessage', 'Successfully received {{quantity}} units', { quantity: values.quantity }));
        setReceiveModalVisible(false);
        receiveForm.resetFields();
        fetchStockItem();
        setRefreshKey((prev) => prev + 1);
      } else {
        throw new Error(result.error.message);
      }
    } catch (err) {
      notifyError(t('stock.notifications.operationFailed', 'Operation Failed'), err instanceof Error ? err.message : t('errors.generic', 'An error occurred'));
    } finally {
      setOperationLoading(false);
    }
  }, [id, success, notifyError, receiveForm, fetchStockItem, t]);

  const handleAdjustStock = useCallback(
    async (values: { quantity: number; reason: string }) => {
      if (!id) return;

      setOperationLoading(true);
      try {
        const result = await adjustStock(id, {
          quantity: values.quantity,
          reason: values.reason,
        });

        if (result.success) {
          success(t('stock.detail.stockAdjusted', 'Stock Adjusted'), t('stock.detail.stockAdjustedMessage', 'Successfully adjusted stock by {{quantity}} units', { quantity: values.quantity }));
          setAdjustModalVisible(false);
          adjustForm.resetFields();
          fetchStockItem();
          setRefreshKey((prev) => prev + 1);
        } else {
          throw new Error(result.error.message);
        }
      } catch (err) {
        notifyError(t('stock.notifications.operationFailed', 'Operation Failed'), err instanceof Error ? err.message : t('errors.generic', 'An error occurred'));
      } finally {
        setOperationLoading(false);
      }
    },
    [id, success, notifyError, adjustForm, fetchStockItem, t]
  );

  // Brand CRUD handlers
  const openAddBrandModal = useCallback(() => {
    setEditingBrandPrice(null);
    setIsCreatingNewBrand(false);
    brandPriceForm.resetFields();
    setBrandModalVisible(true);
  }, [brandPriceForm]);

  const openEditBrandModal = useCallback(
    (brandPrice: StockItemBrand) => {
      setEditingBrandPrice(brandPrice);
      setIsCreatingNewBrand(false);
      brandPriceForm.setFieldsValue({
        brandId: brandPrice.brandId,
        priceBeforeTax: brandPrice.priceBeforeTax,
        priceAfterTax: brandPrice.priceAfterTax,
      });
      setBrandModalVisible(true);
    },
    [brandPriceForm]
  );

  const handleBrandModalCancel = useCallback(() => {
    setBrandModalVisible(false);
    setEditingBrandPrice(null);
    setIsCreatingNewBrand(false);
    brandPriceForm.resetFields();
  }, [brandPriceForm]);

  const handleBrandPriceSubmit = useCallback(async () => {
    if (!id) return;

    try {
      const values = await brandPriceForm.validateFields();
      setOperationLoading(true);

      let brandId = values.brandId;

      // If creating a new brand, create it first
      if (isCreatingNewBrand && values.newBrandName) {
        const createResult = await createBrand({
          name: values.newBrandName,
          imageFileId: values.newBrandImageFileId,
        });
        if (!createResult.success) {
          notifyError(t('stock.detail.brandCreateFailed', 'Failed to Create Brand'), createResult.error.message);
          return;
        }
        console.log('Created brand:', createResult.data);
        brandId = createResult.data.id;
        refetchAllBrands();
      }

      if (!brandId) {
        notifyError(t('common.status.error', 'Error'), t('stock.detail.selectOrCreateBrand', 'Please select or create a brand'));
        return;
      }

      if (editingBrandPrice) {
        // Update existing brand price
        const result = await updateStockItemBrand(id, brandId, {
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
        });

        if (result.success) {
          success(t('stock.detail.brandPriceUpdated', 'Brand Price Updated'), t('stock.detail.brandPriceUpdatedMessage', 'Brand pricing has been updated successfully.'));
          handleBrandModalCancel();
          fetchStockItemBrands();
        } else {
          notifyError(t('stock.notifications.operationFailed', 'Update Failed'), result.error.message);
        }
      } else {
        // Add new brand to stock item
        const result = await addBrandToStockItem(id, {
          brandId,
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
        });

        if (result.success) {
          success(t('stock.detail.brandAdded', 'Brand Added'), t('stock.detail.brandAddedMessage', 'Brand has been added to this stock item.'));
          handleBrandModalCancel();
          fetchStockItemBrands();
        } else {
          notifyError(t('stock.notifications.operationFailed', 'Add Failed'), result.error.message);
        }
      }
    } catch (err) {
      console.error('Form validation failed:', err);
    } finally {
      setOperationLoading(false);
    }
  }, [
    id,
    brandPriceForm,
    isCreatingNewBrand,
    editingBrandPrice,
    success,
    notifyError,
    handleBrandModalCancel,
    fetchStockItemBrands,
    refetchAllBrands,
    t,
  ]);

  const handleRemoveBrand = useCallback(
    async (brandPrice: StockItemBrand) => {
      if (!id) return;

      const result = await removeBrandFromStockItem(id, brandPrice.brandId);
      if (result.success) {
        success(t('stock.detail.brandRemoved', 'Brand Removed'), t('stock.detail.brandRemovedMessage', 'Brand "{{brandName}}" has been removed from this stock item.', { brandName: brandPrice.brandName }));
        fetchStockItemBrands();
      } else {
        notifyError(t('stock.notifications.operationFailed', 'Remove Failed'), result.error.message);
      }
    },
    [id, success, notifyError, fetchStockItemBrands, t]
  );

  const handleSetPreferred = useCallback(
    async (brandPrice: StockItemBrand) => {
      if (!id) return;

      const result = await setPreferredBrand(id, brandPrice.brandId);
      if (result.success) {
        success(t('stock.detail.preferredBrandSet', 'Preferred Brand Set'), t('stock.detail.preferredBrandSetMessage', '"{{brandName}}" is now the preferred brand.', { brandName: brandPrice.brandName }));
        fetchStockItemBrands();
      } else {
        notifyError(t('stock.notifications.operationFailed', 'Operation Failed'), result.error.message);
      }
    },
    [id, success, notifyError, fetchStockItemBrands, t]
  );

  // Filter out already associated brands from the dropdown
  const availableBrands = allBrands?.filter(
    (brand: Brand) => !stockItemBrands.some((sib) => sib.brandId === brand.id)
  ) || [];

  // Helper to get brand image URL from allBrands
  const getBrandImageUrl = (brandId: string): string | null => {
    const brand = allBrands?.find((b: Brand) => b.id === brandId);
    if (brand?.imageFileId) {
      return fileService.getDownloadUrl(brand.imageFileId);
    }
    return null;
  };

  // Brand table columns
  const brandColumns: ColumnsType<StockItemBrand> = [
    {
      title: t('stock.detail.brandImage', 'Image'),
      key: 'image',
      width: 60,
      render: (_: unknown, record: StockItemBrand) => {
        const imageUrl = getBrandImageUrl(record.brandId);
        return imageUrl ? (
          <Avatar src={imageUrl} size={40} shape="square" />
        ) : (
          <Avatar icon={<PictureOutlined />} size={40} shape="square" />
        );
      },
    },
    {
      title: t('stock.detail.brand', 'Brand'),
      dataIndex: 'brandName',
      key: 'brandName',
      render: (name: string, record: StockItemBrand) => (
        <Space>
          {name}
          {record.isPreferred && <Tag color="gold">{t('stock.detail.preferred', 'Preferred')}</Tag>}
        </Space>
      ),
    },
    {
      title: t('stock.detail.priceBeforeTax', 'Price Before Tax'),
      dataIndex: 'priceBeforeTax',
      key: 'priceBeforeTax',
      render: (price: number) => `${price.toLocaleString()} VND`,
    },
    {
      title: t('stock.detail.priceAfterTax', 'Price After Tax'),
      dataIndex: 'priceAfterTax',
      key: 'priceAfterTax',
      render: (price: number) => `${price.toLocaleString()} VND`,
    },
    {
      title: t('common.table.actions', 'Actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record: StockItemBrand) => (
        <Space size="small">
          {!record.isPreferred && (
            <Button
              type="text"
              icon={<StarOutlined />}
              onClick={() => handleSetPreferred(record)}
              title={t('stock.detail.setAsPreferred', 'Set as Preferred')}
            />
          )}
          {record.isPreferred && (
            <Button type="text" icon={<StarFilled style={{ color: '#faad14' }} />} disabled title={t('stock.detail.preferred', 'Preferred')} />
          )}
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditBrandModal(record)} title={t('stock.detail.editPrice', 'Edit Price')} />
          <Popconfirm
            title={t('stock.detail.removeBrand', 'Remove Brand')}
            description={t('stock.detail.removeBrandConfirm', 'Remove this brand from the stock item?')}
            onConfirm={() => handleRemoveBrand(record)}
            okText={t('common.confirm.yes', 'Yes')}
            cancelText={t('common.confirm.no', 'No')}
          >
            <Button type="text" danger icon={<DeleteOutlined />} title={t('common.actions.delete', 'Remove')} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stockItem) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Title level={4}>{t('stock.detail.notFound', 'Stock item not found')}</Title>
        <Button type="primary" onClick={() => navigate('/stock/items')}>
          {t('stock.detail.backToList', 'Back to Stock Items')}
        </Button>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <EditOutlined />
          {t('stock.detail.overview', 'Overview')}
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title={t('stock.detail.currentQuantity', 'Current Quantity')}
                  value={stockItem.currentQuantity}
                  suffix={stockItem.unitOfMeasure}
                  valueStyle={{
                    color:
                      stockItem.status === StockItemStatus.OUT_OF_STOCK
                        ? '#ff4d4f'
                        : stockItem.status === StockItemStatus.LOW_STOCK
                          ? '#faad14'
                          : '#52c41a',
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title={t('stock.detail.reorderThreshold', 'Reorder Threshold')}
                  value={stockItem.reorderThreshold ?? t('common.na', 'N/A')}
                  suffix={stockItem.reorderThreshold !== null ? stockItem.unitOfMeasure : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title={t('stock.detail.unitOfMeasure', 'Unit of Measure')} value={stockItem.unitOfMeasure} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">{t('common.status.active', 'Status')}</Text>
                </div>
                <Tag color={getStatusColor(stockItem.status)} style={{ fontSize: 16, padding: '4px 12px' }}>
                  {getStatusLabel(stockItem.status)}
                </Tag>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Descriptions title={t('common.actions.details', 'Details')} bordered column={{ xs: 1, sm: 2, md: 2 }}>
            <Descriptions.Item label={t('stock.detail.name', 'Name')}>{stockItem.name}</Descriptions.Item>
            <Descriptions.Item label={t('stock.form.unit', 'Unit')}>{stockItem.unitOfMeasure}</Descriptions.Item>
            <Descriptions.Item label={t('stock.detail.description', 'Description')} span={2}>
              {stockItem.description || t('stock.detail.noDescription', 'No description')}
            </Descriptions.Item>
            <Descriptions.Item label={t('stock.detail.created', 'Created')}>
              {new Date(stockItem.createdAt).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label={t('stock.detail.lastUpdated', 'Last Updated')}>
              {new Date(stockItem.updatedAt).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        </div>
      ),
    },
    {
      key: 'brands',
      label: (
        <span>
          <TagsOutlined />
          {t('stock.detail.brandsPricing', 'Brands & Pricing')} ({stockItemBrands.length})
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddBrandModal}>
              {t('stock.detail.addBrand', 'Add Brand')}
            </Button>
          </div>

          {stockItemBrands.length === 0 ? (
            <Empty description={t('stock.detail.noBrands', 'No brands associated with this stock item. Add a brand to set pricing.')} />
          ) : (
            <Table<StockItemBrand>
              columns={brandColumns}
              dataSource={stockItemBrands}
              rowKey="id"
              pagination={false}
            />
          )}
        </div>
      ),
    },
    {
      key: 'movements',
      label: (
        <span>
          <HistoryOutlined />
          {t('stock.detail.movementHistory', 'Movement History')}
        </span>
      ),
      children: <StockMovementHistory stockItemId={id} key={refreshKey} showStockItemColumn={false} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={stockItem.name}
        subtitle={t('stock.detail.subtitle', 'Stock Item Details - {{unit}}', { unit: stockItem.unitOfMeasure })}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stock/items')}>
              {t('common.actions.back', 'Back')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setReceiveModalVisible(true)}>
              {t('stock.detail.receiveStock', 'Receive Stock')}
            </Button>
            <Button icon={<MinusOutlined />} onClick={() => setAdjustModalVisible(true)}>
              {t('stock.detail.adjustStock', 'Adjust Stock')}
            </Button>
          </Space>
        }
      />

      <Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>

      {/* Receive Stock Modal */}
      <Modal
        title={t('stock.detail.receiveStock', 'Receive Stock')}
        open={receiveModalVisible}
        onCancel={() => {
          setReceiveModalVisible(false);
          receiveForm.resetFields();
        }}
        footer={null}
      >
        <Form form={receiveForm} layout="vertical" onFinish={handleReceiveStock}>
          <Form.Item
            name="quantity"
            label={t('stock.detail.quantityWithUnit', 'Quantity ({{unit}})', { unit: stockItem.unitOfMeasure })}
            rules={[
              { required: true, message: t('validation.required', 'Please enter quantity', { field: t('stock.form.quantity', 'Quantity') }) },
              { type: 'number', min: 0.001, message: t('stock.detail.quantityMustBeGreater', 'Quantity must be greater than 0') },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0.001} step={0.001} precision={3} />
          </Form.Item>
          <Form.Item name="reason" label={t('stock.detail.reasonOptional', 'Reason (optional)')}>
            <TextArea rows={3} placeholder={t('stock.detail.receiveReasonPlaceholder', 'e.g., Supplier delivery, Purchase order #123')} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setReceiveModalVisible(false);
                  receiveForm.resetFields();
                }}
              >
                {t('common.actions.cancel', 'Cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={operationLoading}>
                {t('stock.detail.receiveStock', 'Receive Stock')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        title={t('stock.detail.adjustStock', 'Adjust Stock')}
        open={adjustModalVisible}
        onCancel={() => {
          setAdjustModalVisible(false);
          adjustForm.resetFields();
        }}
        footer={null}
      >
        <Form form={adjustForm} layout="vertical" onFinish={handleAdjustStock}>
          <Form.Item
            name="quantity"
            label={t('stock.detail.quantityChangeWithUnit', 'Quantity Change ({{unit}})', { unit: stockItem.unitOfMeasure })}
            rules={[
              { required: true, message: t('validation.required', 'Please enter quantity', { field: t('stock.form.quantity', 'Quantity') }) },
              { type: 'number', message: t('validation.number', 'Please enter a valid number') },
            ]}
            extra={t('stock.detail.adjustmentHint', 'Use positive number to add, negative to deduct')}
          >
            <InputNumber style={{ width: '100%' }} step={0.001} precision={3} />
          </Form.Item>
          <Form.Item
            name="reason"
            label={t('stock.form.reason', 'Reason')}
            rules={[{ required: true, message: t('stock.detail.reasonRequired', 'Please provide a reason for this adjustment') }]}
          >
            <TextArea rows={3} placeholder={t('stock.detail.adjustReasonPlaceholder', 'e.g., Inventory count correction, Damaged during storage')} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setAdjustModalVisible(false);
                  adjustForm.resetFields();
                }}
              >
                {t('common.actions.cancel', 'Cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={operationLoading}>
                {t('stock.detail.adjustStock', 'Adjust Stock')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Brand Price Modal */}
      <Modal
        title={editingBrandPrice ? t('stock.detail.editBrandPrice', 'Edit Brand Price') : t('stock.detail.addBrandToItem', 'Add Brand to Stock Item')}
        open={brandModalVisible}
        onCancel={handleBrandModalCancel}
        onOk={handleBrandPriceSubmit}
        confirmLoading={operationLoading}
        okText={editingBrandPrice ? t('common.actions.update', 'Update') : t('common.actions.add', 'Add')}
      >
        <Form form={brandPriceForm} layout="vertical" requiredMark="optional">
          {!editingBrandPrice && (
            <>
              <Form.Item label={t('stock.detail.brandSelection', 'Brand Selection')}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {!isCreatingNewBrand ? (
                    <>
                      <Form.Item
                        name="brandId"
                        noStyle
                        rules={[{ required: !isCreatingNewBrand, message: t('stock.detail.pleaseSelectBrand', 'Please select a brand') }]}
                      >
                        <Select
                          placeholder={t('stock.detail.selectExistingBrand', 'Select an existing brand')}
                          style={{ width: '100%' }}
                          showSearch
                          optionFilterProp="children"
                          allowClear
                        >
                          {availableBrands.map((brand: Brand) => (
                            <Select.Option key={brand.id} value={brand.id}>
                              {brand.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Button type="link" onClick={() => setIsCreatingNewBrand(true)} style={{ padding: 0 }}>
                        + {t('stock.detail.createNewBrand', 'Create New Brand')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Form.Item
                        name="newBrandName"
                        noStyle
                        rules={[
                          { required: isCreatingNewBrand, message: t('stock.detail.pleaseEnterBrandName', 'Please enter brand name') },
                          { min: 1, message: t('stock.detail.brandNameRequired', 'Brand name is required') },
                        ]}
                      >
                        <Input placeholder={t('stock.detail.enterBrandName', 'Enter new brand name')} />
                      </Form.Item>
                      <Form.Item
                        name="newBrandImageFileId"
                        label={t('stock.detail.brandImageOptional', 'Brand Image (Optional)')}
                        style={{ marginTop: 16 }}
                      >
                        <FileUpload
                          accept="image"
                          maxSize={10}
                          onUploadSuccess={(file) => {
                            brandPriceForm.setFieldsValue({ newBrandImageFileId: file.id });
                          }}
                          onRemove={() => {
                            brandPriceForm.setFieldsValue({ newBrandImageFileId: undefined });
                          }}
                        />
                      </Form.Item>
                      <Button type="link" onClick={() => setIsCreatingNewBrand(false)} style={{ padding: 0 }}>
                        {t('stock.detail.selectExistingBrand', 'Select Existing Brand')}
                      </Button>
                    </>
                  )}
                </Space>
              </Form.Item>
            </>
          )}

          {editingBrandPrice && (
            <Form.Item label={t('stock.detail.brand', 'Brand')}>
              <Input value={editingBrandPrice.brandName} disabled />
            </Form.Item>
          )}

          <Form.Item
            name="priceBeforeTax"
            label={t('stock.detail.priceBeforeTaxVND', 'Price Before Tax (VND)')}
            rules={[
              { required: true, message: t('stock.detail.enterPriceBeforeTax', 'Please enter price before tax') },
              { type: 'number', min: 0, message: t('stock.detail.priceMustBeZeroOrGreater', 'Price must be 0 or greater') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              // min={0}
              precision={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
            />
          </Form.Item>

          <Form.Item
            name="priceAfterTax"
            label={t('stock.detail.priceAfterTaxVND', 'Price After Tax (VND)')}
            rules={[
              { required: true, message: t('stock.detail.enterPriceAfterTax', 'Please enter price after tax') },
              { type: 'number', min: 0, message: t('stock.detail.priceMustBeZeroOrGreater', 'Price must be 0 or greater') },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              // min={0}`
              precision={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
