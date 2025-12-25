/**
 * Stock Item Detail Page
 * Shows stock item details with tabs for brands, movements, and stock operations
 * Full brand CRUD is managed within this page (inline brand creation/editing)
 */

import React, { useState, useCallback, useEffect } from 'react';
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
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@/components/shared';
import { StockMovementHistory } from '@/components/features/stock/StockMovementHistory/StockMovementHistory';
import { useNotification } from '@/hooks/useNotification';
import { useBrands } from '@/hooks/useBrands';
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

const getStatusLabel = (status: StockItemStatus): string => {
  switch (status) {
    case StockItemStatus.AVAILABLE:
      return 'Available';
    case StockItemStatus.LOW_STOCK:
      return 'Low Stock';
    case StockItemStatus.OUT_OF_STOCK:
      return 'Out of Stock';
    default:
      return status;
  }
};

export const StockItemDetailPage = (): React.JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotification();

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
        notifyError('Error', 'Failed to load stock item');
      }
    } catch (err) {
      notifyError('Error', 'Failed to load stock item');
    } finally {
      setLoading(false);
    }
  }, [id, notifyError]);

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
        success('Stock Received', `Successfully received ${values.quantity} units`);
        setReceiveModalVisible(false);
        receiveForm.resetFields();
        fetchStockItem();
        setRefreshKey((prev) => prev + 1);
      } else {
        throw new Error(result.error.message);
      }
    } catch (err) {
      notifyError('Operation Failed', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setOperationLoading(false);
    }
  }, [id, success, notifyError, receiveForm, fetchStockItem]);

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
          success('Stock Adjusted', `Successfully adjusted stock by ${values.quantity} units`);
          setAdjustModalVisible(false);
          adjustForm.resetFields();
          fetchStockItem();
          setRefreshKey((prev) => prev + 1);
        } else {
          throw new Error(result.error.message);
        }
      } catch (err) {
        notifyError('Operation Failed', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setOperationLoading(false);
      }
    },
    [id, success, notifyError, adjustForm, fetchStockItem]
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
        const createResult = await createBrand({ name: values.newBrandName });
        if (!createResult.success) {
          notifyError('Failed to Create Brand', createResult.error.message);
          return;
        }
        console.log('Created brand:', createResult.data);
        brandId = createResult.data.id;
        refetchAllBrands();
      }

      if (!brandId) {
        notifyError('Error', 'Please select or create a brand');
        return;
      }

      if (editingBrandPrice) {
        // Update existing brand price
        const result = await updateStockItemBrand(id, brandId, {
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
        });

        if (result.success) {
          success('Brand Price Updated', 'Brand pricing has been updated successfully.');
          handleBrandModalCancel();
          fetchStockItemBrands();
        } else {
          notifyError('Update Failed', result.error.message);
        }
      } else {
        // Add new brand to stock item
        const result = await addBrandToStockItem(id, {
          brandId,
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
        });

        if (result.success) {
          success('Brand Added', 'Brand has been added to this stock item.');
          handleBrandModalCancel();
          fetchStockItemBrands();
        } else {
          notifyError('Add Failed', result.error.message);
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
  ]);

  const handleRemoveBrand = useCallback(
    async (brandPrice: StockItemBrand) => {
      if (!id) return;

      const result = await removeBrandFromStockItem(id, brandPrice.brandId);
      if (result.success) {
        success('Brand Removed', `Brand "${brandPrice.brandName}" has been removed from this stock item.`);
        fetchStockItemBrands();
      } else {
        notifyError('Remove Failed', result.error.message);
      }
    },
    [id, success, notifyError, fetchStockItemBrands]
  );

  const handleSetPreferred = useCallback(
    async (brandPrice: StockItemBrand) => {
      if (!id) return;

      const result = await setPreferredBrand(id, brandPrice.brandId);
      if (result.success) {
        success('Preferred Brand Set', `"${brandPrice.brandName}" is now the preferred brand.`);
        fetchStockItemBrands();
      } else {
        notifyError('Operation Failed', result.error.message);
      }
    },
    [id, success, notifyError, fetchStockItemBrands]
  );

  // Filter out already associated brands from the dropdown
  const availableBrands = allBrands?.filter(
    (brand: Brand) => !stockItemBrands.some((sib) => sib.brandId === brand.id)
  ) || [];

  // Brand table columns
  const brandColumns: ColumnsType<StockItemBrand> = [
    {
      title: 'Brand',
      dataIndex: 'brandName',
      key: 'brandName',
      render: (name: string, record: StockItemBrand) => (
        <Space>
          {name}
          {record.isPreferred && <Tag color="gold">Preferred</Tag>}
        </Space>
      ),
    },
    {
      title: 'Price Before Tax',
      dataIndex: 'priceBeforeTax',
      key: 'priceBeforeTax',
      render: (price: number) => `${price.toLocaleString()} VND`,
    },
    {
      title: 'Price After Tax',
      dataIndex: 'priceAfterTax',
      key: 'priceAfterTax',
      render: (price: number) => `${price.toLocaleString()} VND`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: StockItemBrand) => (
        <Space size="small">
          {!record.isPreferred && (
            <Button
              type="text"
              icon={<StarOutlined />}
              onClick={() => handleSetPreferred(record)}
              title="Set as Preferred"
            />
          )}
          {record.isPreferred && (
            <Button type="text" icon={<StarFilled style={{ color: '#faad14' }} />} disabled title="Preferred" />
          )}
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditBrandModal(record)} title="Edit Price" />
          <Popconfirm
            title="Remove Brand"
            description="Remove this brand from the stock item?"
            onConfirm={() => handleRemoveBrand(record)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Remove" />
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
        <Title level={4}>Stock item not found</Title>
        <Button type="primary" onClick={() => navigate('/stock/items')}>
          Back to Stock Items
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
          Overview
        </span>
      ),
      children: (
        <div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Current Quantity"
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
                  title="Reorder Threshold"
                  value={stockItem.reorderThreshold ?? 'N/A'}
                  suffix={stockItem.reorderThreshold !== null ? stockItem.unitOfMeasure : ''}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic title="Unit of Measure" value={stockItem.unitOfMeasure} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Status</Text>
                </div>
                <Tag color={getStatusColor(stockItem.status)} style={{ fontSize: 16, padding: '4px 12px' }}>
                  {getStatusLabel(stockItem.status)}
                </Tag>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Descriptions title="Details" bordered column={{ xs: 1, sm: 2, md: 2 }}>
            <Descriptions.Item label="Name">{stockItem.name}</Descriptions.Item>
            <Descriptions.Item label="Unit">{stockItem.unitOfMeasure}</Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {stockItem.description || 'No description'}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(stockItem.createdAt).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
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
          Brands & Pricing ({stockItemBrands.length})
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddBrandModal}>
              Add Brand
            </Button>
          </div>

          {stockItemBrands.length === 0 ? (
            <Empty description="No brands associated with this stock item. Add a brand to set pricing." />
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
          Movement History
        </span>
      ),
      children: <StockMovementHistory stockItemId={id} key={refreshKey} showStockItemColumn={false} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={stockItem.name}
        subtitle={`Stock Item Details - ${stockItem.unitOfMeasure}`}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stock/items')}>
              Back
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setReceiveModalVisible(true)}>
              Receive Stock
            </Button>
            <Button icon={<MinusOutlined />} onClick={() => setAdjustModalVisible(true)}>
              Adjust Stock
            </Button>
          </Space>
        }
      />

      <Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </Card>

      {/* Receive Stock Modal */}
      <Modal
        title="Receive Stock"
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
            label={`Quantity (${stockItem.unitOfMeasure})`}
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 0.001, message: 'Quantity must be greater than 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0.001} step={0.001} precision={3} />
          </Form.Item>
          <Form.Item name="reason" label="Reason (optional)">
            <TextArea rows={3} placeholder="e.g., Supplier delivery, Purchase order #123" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setReceiveModalVisible(false);
                  receiveForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={operationLoading}>
                Receive Stock
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        title="Adjust Stock"
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
            label={`Quantity Change (${stockItem.unitOfMeasure})`}
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', message: 'Please enter a valid number' },
            ]}
            extra="Use positive number to add, negative to deduct"
          >
            <InputNumber style={{ width: '100%' }} step={0.001} precision={3} />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please provide a reason for this adjustment' }]}
          >
            <TextArea rows={3} placeholder="e.g., Inventory count correction, Damaged during storage" />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setAdjustModalVisible(false);
                  adjustForm.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={operationLoading}>
                Adjust Stock
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Brand Price Modal */}
      <Modal
        title={editingBrandPrice ? 'Edit Brand Price' : 'Add Brand to Stock Item'}
        open={brandModalVisible}
        onCancel={handleBrandModalCancel}
        onOk={handleBrandPriceSubmit}
        confirmLoading={operationLoading}
        okText={editingBrandPrice ? 'Update' : 'Add'}
      >
        <Form form={brandPriceForm} layout="vertical" requiredMark="optional">
          {!editingBrandPrice && (
            <>
              <Form.Item label="Brand Selection">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {!isCreatingNewBrand ? (
                    <>
                      <Form.Item
                        name="brandId"
                        noStyle
                        rules={[{ required: !isCreatingNewBrand, message: 'Please select a brand' }]}
                      >
                        <Select
                          placeholder="Select an existing brand"
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
                        + Create New Brand
                      </Button>
                    </>
                  ) : (
                    <>
                      <Form.Item
                        name="newBrandName"
                        noStyle
                        rules={[
                          { required: isCreatingNewBrand, message: 'Please enter brand name' },
                          { min: 1, message: 'Brand name is required' },
                        ]}
                      >
                        <Input placeholder="Enter new brand name" />
                      </Form.Item>
                      <Button type="link" onClick={() => setIsCreatingNewBrand(false)} style={{ padding: 0 }}>
                        Select Existing Brand
                      </Button>
                    </>
                  )}
                </Space>
              </Form.Item>
            </>
          )}

          {editingBrandPrice && (
            <Form.Item label="Brand">
              <Input value={editingBrandPrice.brandName} disabled />
            </Form.Item>
          )}

          <Form.Item
            name="priceBeforeTax"
            label="Price Before Tax (VND)"
            rules={[
              { required: true, message: 'Please enter price before tax' },
              { type: 'number', min: 0, message: 'Price must be 0 or greater' },
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
            label="Price After Tax (VND)"
            rules={[
              { required: true, message: 'Please enter price after tax' },
              { type: 'number', min: 0, message: 'Price must be 0 or greater' },
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
