/**
 * Stock Item Detail Page
 * Shows stock item details with tabs for brands, movements, and stock operations
 * Full brand CRUD is managed within this page (inline brand creation/editing)
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
  Select,
  Popconfirm,
  Table,
  Empty,
  Avatar,
  Alert,
  DatePicker,
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
import { useCrudErrorNotification } from '@/hooks/useCrudErrorNotification';
import { useBrands } from '@/hooks/useBrands';
import { fileService } from '@/services/file.service';
import {
  getStockItemById,
  receiveWithPricing,
  adjustStock,
  getStockReceivingLots,
  getStockItemBrands,
  addBrandToStockItem,
  updateStockItemBrand,
  removeBrandFromStockItem,
  setPreferredBrand,
  createBrand,
} from '@/services/stock.service';
import {
  StockItemStatus,
  StockPurchaseUnit,
  StockUnitType,
} from '@/types/models/stock.model';
import type { StockItem, StockItemBrand, Brand } from '@/types/models/stock.model';
import type { StockReceivingLot } from '@/types/models/stock.model';
import { ErrorCode } from '@/types/common/error.types';
import { formatCurrency, formatDateTime } from '@/utils/format.utils';
import dayjs, { type Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BrandPriceFormValues {
  brandId?: string;
  newBrandName?: string;
  newBrandImageFileId?: string;
  purchaseQuantity: number;
  purchaseUnit: StockPurchaseUnit;
  priceBeforeTax: number;
  priceAfterTax: number;
}

interface ReceiveWithPricingFormValues {
  brandId?: string;
  newBrandName?: string;
  newBrandImageFileId?: string;
  receivedQuantity: number;
  receivedUnit: StockPurchaseUnit;
  priceBeforeTax: number;
  priceAfterTax: number;
  receivedAt?: Dayjs;
  supplierName?: string;
  invoiceCode?: string;
  note?: string;
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
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const showCrudErrorRef = useRef(showCrudError);
  const tRef = useRef(t);

  useEffect(() => {
    showCrudErrorRef.current = showCrudError;
  }, [showCrudError]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

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
  const [isCreatingNewReceiveBrand, setIsCreatingNewReceiveBrand] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTabKey, setActiveTabKey] = useState('pricing');

  const [receivingLots, setReceivingLots] = useState<StockReceivingLot[]>([]);
  const [receivingLotsLoading, setReceivingLotsLoading] = useState(false);
  const [receivingLotsPagination, setReceivingLotsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [receivingLotsBrandFilter, setReceivingLotsBrandFilter] = useState<string | undefined>(
    undefined
  );
  const [receivingLotsDateRange, setReceivingLotsDateRange] = useState<
    [Dayjs, Dayjs] | null
  >(null);

  const [receiveForm] = Form.useForm<ReceiveWithPricingFormValues>();
  const [adjustForm] = Form.useForm();
  const [brandPriceForm] = Form.useForm<BrandPriceFormValues>();
  const purchaseQuantityValue = Form.useWatch('purchaseQuantity', brandPriceForm);
  const purchaseUnitValue = Form.useWatch('purchaseUnit', brandPriceForm);
  const priceBeforeTaxValue = Form.useWatch('priceBeforeTax', brandPriceForm);
  const priceAfterTaxValue = Form.useWatch('priceAfterTax', brandPriceForm);

  const receivedQuantityValue = Form.useWatch('receivedQuantity', receiveForm);
  const receivedUnitValue = Form.useWatch('receivedUnit', receiveForm);
  const receivePriceAfterTaxValue = Form.useWatch('priceAfterTax', receiveForm);

  const unitPriceDivider = useMemo(() => {
    const purchaseQuantity = Number(purchaseQuantityValue || 0);
    if (purchaseQuantity <= 0) {
      return 0;
    }

    if (
      stockItem?.unitType === StockUnitType.WEIGHT &&
      purchaseUnitValue === StockPurchaseUnit.KILOGRAM
    ) {
      return purchaseQuantity * 1000;
    }
    if (
      stockItem?.unitType === StockUnitType.VOLUME &&
      purchaseUnitValue === StockPurchaseUnit.LITER
    ) {
      return purchaseQuantity * 1000;
    }

    return purchaseQuantity;
  }, [stockItem?.unitType, purchaseQuantityValue, purchaseUnitValue]);

  const unitPriceBeforeTaxPreview = useMemo(() => {
    const price = Number(priceBeforeTaxValue || 0);
    if (unitPriceDivider <= 0) {
      return 0;
    }
    return price / unitPriceDivider;
  }, [priceBeforeTaxValue, unitPriceDivider]);

  const unitPriceAfterTaxPreview = useMemo(() => {
    const price = Number(priceAfterTaxValue || 0);
    if (unitPriceDivider <= 0) {
      return 0;
    }
    return price / unitPriceDivider;
  }, [priceAfterTaxValue, unitPriceDivider]);

  const receivedQuantityBasePreview = useMemo(() => {
    const receivedQuantity = Number(receivedQuantityValue || 0);
    if (receivedQuantity <= 0) {
      return 0;
    }

    const receivedUnit = receivedUnitValue as StockPurchaseUnit | undefined;
    if (!receivedUnit) {
      return 0;
    }

    if (stockItem?.unitType === StockUnitType.WEIGHT && receivedUnit === StockPurchaseUnit.KILOGRAM) {
      return receivedQuantity * 1000;
    }
    if (stockItem?.unitType === StockUnitType.VOLUME && receivedUnit === StockPurchaseUnit.LITER) {
      return receivedQuantity * 1000;
    }

    return receivedQuantity;
  }, [receivedQuantityValue, receivedUnitValue, stockItem?.unitType]);

  const receivedUnitPriceAfterTaxPreview = useMemo(() => {
    const price = Number(receivePriceAfterTaxValue || 0);
    if (receivedQuantityBasePreview <= 0) {
      return 0;
    }
    return price / receivedQuantityBasePreview;
  }, [receivePriceAfterTaxValue, receivedQuantityBasePreview]);

  const baseUnitLabel = stockItem?.baseUnit || stockItem?.unitOfMeasure || '';
  const purchaseSpecPreview = useMemo(() => {
    const purchaseQuantity = Number(purchaseQuantityValue || 0);
    const purchaseUnit = String(purchaseUnitValue || '').trim();
    if (purchaseQuantity <= 0 || !purchaseUnit) {
      return null;
    }

    return `${purchaseQuantity} ${purchaseUnit}`;
  }, [purchaseQuantityValue, purchaseUnitValue]);

  const unitPricePreviewLineBeforeTax = useMemo(() => {
    if (!purchaseSpecPreview || unitPriceDivider <= 0) {
      return null;
    }

    return `${purchaseSpecPreview} = ${formatCurrency(
      Number(priceBeforeTaxValue || 0)
    )} -> ${formatCurrency(unitPriceBeforeTaxPreview)}/${baseUnitLabel}`;
  }, [
    baseUnitLabel,
    priceBeforeTaxValue,
    purchaseSpecPreview,
    unitPriceBeforeTaxPreview,
    unitPriceDivider,
  ]);

  const unitPricePreviewLineAfterTax = useMemo(() => {
    if (!purchaseSpecPreview || unitPriceDivider <= 0) {
      return null;
    }

    return `${purchaseSpecPreview} = ${formatCurrency(
      Number(priceAfterTaxValue || 0)
    )} -> ${formatCurrency(unitPriceAfterTaxPreview)}/${baseUnitLabel}`;
  }, [
    baseUnitLabel,
    priceAfterTaxValue,
    purchaseSpecPreview,
    unitPriceAfterTaxPreview,
    unitPriceDivider,
  ]);

  // Fetch all available brands for the dropdown
  const { brands: allBrands, refetch: refetchAllBrands } = useBrands({ autoFetch: true });

  const fetchStockItem = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const result = await getStockItemById(id);
      if (result.success && result.data) {
        setStockItem(result.data);
      } else if (!result.success) {
        showCrudErrorRef.current(result.error);
      } else {
        showCrudErrorRef.current({
          code: ErrorCode.NOT_FOUND,
          message: tRef.current('stock.notifications.operationFailed', 'Failed to load stock item'),
          statusCode: 404,
          timestamp: new Date(),
          details: [
            {
              field: 'stockItemId',
              message: tRef.current('stock.notifications.operationFailed', 'Failed to load stock item'),
            },
          ],
        });
      }
    } catch (err) {
      showCrudErrorRef.current(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchStockItemBrands = useCallback(async () => {
    if (!id) return;

    try {
      const result = await getStockItemBrands(id);
      if (result.success) {
        setStockItemBrands(result.data);
      }
    } catch (_err) {
      // Brands are optional, don't show error
    }
  }, [id]);

  const openReceiveWithPricingModal = useCallback(
    (opts?: { brandId?: string }) => {
      setIsCreatingNewReceiveBrand(false);
      receiveForm.resetFields();
      receiveForm.setFieldsValue({
        brandId: opts?.brandId,
        receivedQuantity: 1,
        receivedUnit:
          stockItem?.unitType === StockUnitType.WEIGHT
            ? StockPurchaseUnit.GRAM
            : stockItem?.unitType === StockUnitType.VOLUME
              ? StockPurchaseUnit.MILLILITER
              : StockPurchaseUnit.PIECE,
        priceBeforeTax: 0,
        priceAfterTax: 0,
        receivedAt: dayjs(),
      });
      setReceiveModalVisible(true);
    },
    [receiveForm, stockItem?.unitType]
  );

  useEffect(() => {
    fetchStockItem();
    fetchStockItemBrands();
  }, [fetchStockItem, fetchStockItemBrands]);

  const fetchReceivingLots = useCallback(async () => {
    if (!id) return;

    setReceivingLotsLoading(true);
    try {
      const [from, to] = receivingLotsDateRange ?? [];

      const result = await getStockReceivingLots(id, {
        page: receivingLotsPagination.page,
        limit: receivingLotsPagination.limit,
        brandId: receivingLotsBrandFilter,
        dateFrom: from ? from.startOf('day').toISOString() : undefined,
        dateTo: to ? to.endOf('day').toISOString() : undefined,
      });

      if (result.success) {
        setReceivingLots([...result.data.lots]);
        setReceivingLotsPagination((prev) => ({
          ...prev,
          total: result.data.total,
          page: result.data.page,
          limit: result.data.limit,
        }));
      } else {
        throw result.error;
      }
    } catch (err) {
      showCrudError(err);
    } finally {
      setReceivingLotsLoading(false);
    }
  }, [
    id,
    receivingLotsBrandFilter,
    receivingLotsDateRange,
    receivingLotsPagination.page,
    receivingLotsPagination.limit,
    showCrudError,
  ]);

  useEffect(() => {
    if (activeTabKey !== 'receiving-lots') {
      return;
    }
    void fetchReceivingLots();
  }, [activeTabKey, fetchReceivingLots]);

  const handleReceiveWithPricing = useCallback(async () => {
    if (!id || !stockItem) return;

    try {
      const values = await receiveForm.validateFields();
      setOperationLoading(true);

      let brandId = values.brandId;

      if (isCreatingNewReceiveBrand && values.newBrandName) {
        const createResult = await createBrand({
          name: values.newBrandName,
          imageFileId: values.newBrandImageFileId,
        });
        if (!createResult.success) {
          showCrudError(createResult.error);
          return;
        }
        brandId = createResult.data.id;
        refetchAllBrands();
      }

      if (!brandId) {
        showCrudError({
          code: ErrorCode.MISSING_REQUIRED_FIELD,
          message: t('stock.detail.selectOrCreateBrand', 'Please select or create a brand'),
          statusCode: 400,
          timestamp: new Date(),
          details: [{ field: 'brandId', message: 'brandId is required' }],
        });
        return;
      }

      const result = await receiveWithPricing(id, {
        brandId,
        receivedQuantity: values.receivedQuantity,
        receivedUnit: values.receivedUnit,
        priceBeforeTax: values.priceBeforeTax,
        priceAfterTax: values.priceAfterTax,
        receivedAt: values.receivedAt ? values.receivedAt.toISOString() : undefined,
        supplierName: values.supplierName,
        invoiceCode: values.invoiceCode,
        note: values.note,
      });

      if (result.success) {
        success(
          t('stock.detail.stockReceived', 'Stock Received'),
          t('stock.detail.stockReceivedMessage', 'Successfully received stock with pricing.')
        );
        setReceiveModalVisible(false);
        setIsCreatingNewReceiveBrand(false);
        receiveForm.resetFields();
        fetchStockItem();
        fetchStockItemBrands();
        setRefreshKey((prev) => prev + 1);
        if (activeTabKey === 'receiving-lots') {
          fetchReceivingLots();
        }
      } else {
        throw result.error;
      }
    } catch (err) {
      // validation or request errors
      if ((err as any)?.errorFields) {
        return;
      }
      showCrudError(err);
    } finally {
      setOperationLoading(false);
    }
  }, [
    activeTabKey,
    fetchReceivingLots,
    fetchStockItem,
    fetchStockItemBrands,
    id,
    isCreatingNewReceiveBrand,
    receiveForm,
    refetchAllBrands,
    showCrudError,
    stockItem,
    success,
    t,
  ]);

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
          throw result.error;
        }
      } catch (err) {
        showCrudError(err);
      } finally {
        setOperationLoading(false);
      }
    },
    [adjustForm, fetchStockItem, id, showCrudError, success, t]
  );

  // Brand CRUD handlers
  const openAddBrandModal = useCallback(() => {
    setEditingBrandPrice(null);
    setIsCreatingNewBrand(false);
    brandPriceForm.resetFields();
    brandPriceForm.setFieldsValue({
      purchaseQuantity: 1,
      purchaseUnit:
        stockItem?.unitType === StockUnitType.WEIGHT
          ? StockPurchaseUnit.GRAM
          : stockItem?.unitType === StockUnitType.VOLUME
            ? StockPurchaseUnit.MILLILITER
          : StockPurchaseUnit.PIECE,
      priceBeforeTax: 0,
      priceAfterTax: 0,
    });
    setBrandModalVisible(true);
  }, [brandPriceForm, stockItem?.unitType]);

  const openEditBrandModal = useCallback(
    (brandPrice: StockItemBrand) => {
      setEditingBrandPrice(brandPrice);
      setIsCreatingNewBrand(false);
      brandPriceForm.setFieldsValue({
        brandId: brandPrice.brandId,
        purchaseQuantity: brandPrice.purchaseQuantity,
        purchaseUnit: brandPrice.purchaseUnit,
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
          showCrudError(createResult.error);
          return;
        }
        brandId = createResult.data.id;
        refetchAllBrands();
      }

      if (!brandId) {
        showCrudError({
          code: ErrorCode.MISSING_REQUIRED_FIELD,
          message: t('stock.detail.selectOrCreateBrand', 'Please select or create a brand'),
          statusCode: 400,
          timestamp: new Date(),
          details: [
            {
              field: 'brandId',
              message: t('stock.detail.selectOrCreateBrand', 'Please select or create a brand'),
            },
          ],
        });
        return;
      }

      if (editingBrandPrice) {
        // Update existing brand price
        const result = await updateStockItemBrand(id, brandId, {
          purchaseQuantity: values.purchaseQuantity,
          purchaseUnit: values.purchaseUnit,
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
        });

        if (result.success) {
          success(t('stock.detail.brandPriceUpdated', 'Brand Price Updated'), t('stock.detail.brandPriceUpdatedMessage', 'Brand pricing has been updated successfully.'));
          handleBrandModalCancel();
          fetchStockItemBrands();
        } else {
          showCrudError(result.error);
        }
      } else {
        // Add new brand to stock item
        const result = await addBrandToStockItem(id, {
          brandId,
          purchaseQuantity: values.purchaseQuantity,
          purchaseUnit: values.purchaseUnit,
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
        });

        if (result.success) {
          success(t('stock.detail.brandAdded', 'Brand Added'), t('stock.detail.brandAddedMessage', 'Brand has been added to this stock item.'));
          handleBrandModalCancel();
          fetchStockItemBrands();
        } else {
          showCrudError(result.error);
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
    showCrudError,
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
        showCrudError(result.error);
      }
    },
    [fetchStockItemBrands, id, showCrudError, success, t]
  );

  const handleSetPreferred = useCallback(
    async (brandPrice: StockItemBrand) => {
      if (!id) return;

      const result = await setPreferredBrand(id, brandPrice.brandId);
      if (result.success) {
        success(t('stock.detail.preferredBrandSet', 'Preferred Brand Set'), t('stock.detail.preferredBrandSetMessage', '"{{brandName}}" is now the preferred brand.', { brandName: brandPrice.brandName }));
        fetchStockItemBrands();
      } else {
        showCrudError(result.error);
      }
    },
    [fetchStockItemBrands, id, showCrudError, success, t]
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

  const purchaseUnitOptions =
    stockItem?.unitType === StockUnitType.WEIGHT
      ? [StockPurchaseUnit.GRAM, StockPurchaseUnit.KILOGRAM]
      : stockItem?.unitType === StockUnitType.VOLUME
        ? [StockPurchaseUnit.MILLILITER, StockPurchaseUnit.LITER]
      : [StockPurchaseUnit.PIECE];

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
      title: t('stock.detail.purchaseSpec', 'Quy cách mua'),
      key: 'purchaseSpec',
      render: (_: unknown, record: StockItemBrand) =>
        `${record.purchaseQuantity} ${record.purchaseUnit}`,
    },
    {
      title: t('stock.detail.priceBeforeTax', 'Price Before Tax'),
      dataIndex: 'priceBeforeTax',
      key: 'priceBeforeTax',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: t('stock.detail.priceAfterTax', 'Price After Tax'),
      dataIndex: 'priceAfterTax',
      key: 'priceAfterTax',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: t('stock.detail.unitPriceBeforeTax', 'Đơn giá trước thuế'),
      dataIndex: 'unitPriceBeforeTax',
      key: 'unitPriceBeforeTax',
      render: (price: number) => `${formatCurrency(price)} /${stockItem?.unitOfMeasure ?? ''}`,
    },
    {
      title: t('stock.detail.unitPriceAfterTax', 'Đơn giá sau thuế'),
      dataIndex: 'unitPriceAfterTax',
      key: 'unitPriceAfterTax',
      render: (price: number) => `${formatCurrency(price)} /${stockItem?.unitOfMeasure ?? ''}`,
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

  const priceSummary = stockItem.priceSummary;
  const currentUnitPriceAfterTax = priceSummary?.latestUnitPriceAfterTax ?? null;
  const currentBrandName =
    priceSummary?.latestPriceBrandName || priceSummary?.preferredBrandName || null;
  const latestReceivedAt = priceSummary?.latestReceivedAt ?? null;

  const receivingLotColumns: ColumnsType<StockReceivingLot> = [
    {
      title: t('stock.receivingLots.receivedAt', 'Ngày nhập'),
      key: 'receivedAt',
      render: (_: unknown, record: StockReceivingLot) =>
        formatDateTime(record.receivedAt, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: t('stock.receivingLots.brand', 'Nhãn hàng'),
      dataIndex: 'brandName',
      key: 'brandName',
    },
    {
      title: t('stock.receivingLots.receivedQuantity', 'Số lượng nhập'),
      key: 'receivedQuantity',
      render: (_: unknown, record: StockReceivingLot) =>
        `${record.receivedQuantity} ${record.receivedUnit}`,
    },
    {
      title: t('stock.receivingLots.priceBeforeTax', 'Giá trước thuế'),
      dataIndex: 'priceBeforeTax',
      key: 'priceBeforeTax',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('stock.receivingLots.priceAfterTax', 'Giá sau thuế'),
      dataIndex: 'priceAfterTax',
      key: 'priceAfterTax',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: t('stock.receivingLots.unitPriceAfterTax', 'Đơn giá sau thuế/base unit'),
      key: 'unitPriceAfterTax',
      render: (_: unknown, record: StockReceivingLot) =>
        `${formatCurrency(record.unitPriceAfterTax)} / ${record.baseUnit}`,
    },
    {
      title: t('stock.receivingLots.supplier', 'Nhà cung cấp'),
      dataIndex: 'supplierName',
      key: 'supplierName',
      render: (value: string | null) => value || t('common.na', 'N/A'),
    },
    {
      title: t('stock.receivingLots.invoiceCode', 'Mã hóa đơn'),
      dataIndex: 'invoiceCode',
      key: 'invoiceCode',
      render: (value: string | null) => value || t('common.na', 'N/A'),
    },
    {
      title: t('stock.receivingLots.note', 'Ghi chú'),
      dataIndex: 'note',
      key: 'note',
      render: (value: string | null) => value || t('common.na', 'N/A'),
    },
  ];

  const tabItems = [
    {
      key: 'pricing',
      label: (
        <span>
          <TagsOutlined />
          {t('stock.detail.pricingAndReceiving', 'Giá & nhập kho')}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Card
            title={t('stock.detail.currentPrice', 'Giá hiện tại')}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openReceiveWithPricingModal()}>
                {t('stock.detail.receiveWithPricing', 'Nhập kho + giá')}
              </Button>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('stock.detail.currentPricePerBaseUnit', 'Giá / base unit')}
                  value={
                    priceSummary?.hasPrice && currentUnitPriceAfterTax !== null
                      ? formatCurrency(currentUnitPriceAfterTax)
                      : t('stock.list.noPrice', 'Chưa có giá')
                  }
                  suffix={priceSummary?.hasPrice ? `/ ${stockItem.baseUnit}` : ''}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('stock.detail.currentPriceBrand', 'Nhãn hàng')}
                  value={currentBrandName || t('common.na', 'N/A')}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('stock.detail.latestReceiving', 'Lần nhập gần nhất')}
                  value={
                    latestReceivedAt ? formatDateTime(latestReceivedAt, 'YYYY-MM-DD HH:mm') : t('stock.list.noReceivingPrice', 'Chưa nhập giá')
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title={t('stock.detail.currentQuantity', 'Tồn hiện tại')}
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
              </Col>
            </Row>

            {!priceSummary?.hasPrice && (
              <div style={{ marginTop: 16 }}>
                <Alert
                  type="warning"
                  showIcon
                  message={t(
                    'stock.detail.noPriceWarning',
                    'Nguyên liệu này chưa có giá nhập. Hãy nhập kho kèm giá.'
                  )}
                />
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                {t(
                  'stock.detail.currentPriceExplain',
                  'Giá hiện tại được cập nhật từ lần nhập kho gần nhất hoặc chỉnh thủ công theo nhãn hàng.'
                )}
              </Text>
            </div>
          </Card>

          <Card
            title={t('stock.detail.brandsAndCurrentPricing', 'Nhãn hàng & giá hiện tại')}
            extra={
              <Button icon={<PlusOutlined />} onClick={openAddBrandModal}>
                {t('stock.detail.addBrand', 'Add Brand')}
              </Button>
            }
          >
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">
                {t(
                  'stock.detail.brandsCurrentPricingExplain',
                  'Đây là giá hiện tại/latest của từng nhãn hàng. Giá này được cập nhật khi nhập kho kèm giá. Có thể chỉnh thủ công nếu cần.'
                )}
              </Text>
            </div>

            {stockItemBrands.length === 0 ? (
              <Empty
                description={t(
                  'stock.detail.noBrands',
                  'Chưa có nhãn hàng cho nguyên liệu này. Hãy thêm nhãn hàng hoặc nhập kho kèm giá.'
                )}
              />
            ) : (
              <Table<StockItemBrand>
                columns={[
                  ...brandColumns,
                  {
                    title: t('stock.detail.quickReceive', 'Nhập kho'),
                    key: 'quickReceive',
                    width: 120,
                    render: (_: unknown, record: StockItemBrand) => {
                      const hasBrandPrice =
                        Number(record.priceAfterTax) > 0 || Number(record.unitPriceAfterTax) > 0;
                      return (
                        <Button type="link" onClick={() => openReceiveWithPricingModal({ brandId: record.brandId })}>
                          {hasBrandPrice
                            ? t('stock.detail.receiveWithPricing', 'Nhập kho + giá')
                            : t('stock.detail.receiveForBrand', 'Nhập kho + giá')}
                        </Button>
                      );
                    },
                  },
                ]}
                dataSource={stockItemBrands}
                rowKey="id"
                pagination={false}
              />
            )}
          </Card>
        </Space>
      ),
    },
    {
      key: 'overview',
      label: (
        <span>
          <EditOutlined />
          {t('stock.detail.overview', 'Tổng quan')}
        </span>
      ),
      children: (
        <div>
          <Descriptions
            title={t('common.actions.details', 'Details')}
            bordered
            column={{ xs: 1, sm: 2, md: 2 }}
          >
            <Descriptions.Item label={t('stock.detail.name', 'Name')}>
              {stockItem.name}
            </Descriptions.Item>
            <Descriptions.Item label={t('stock.form.unit', 'Unit')}>
              {stockItem.unitOfMeasure}
            </Descriptions.Item>
            <Descriptions.Item label={t('stock.detail.baseUnit', 'Base Unit')}>
              {stockItem.baseUnit}
            </Descriptions.Item>
            <Descriptions.Item label={t('stock.detail.currentQuantity', 'Tồn hiện tại')}>
              {stockItem.currentQuantity} {stockItem.unitOfMeasure}
            </Descriptions.Item>
            <Descriptions.Item label={t('stock.detail.reorderThreshold', 'Reorder Threshold')}>
              {stockItem.reorderThreshold !== null
                ? `${stockItem.reorderThreshold} ${stockItem.unitOfMeasure}`
                : t('common.na', 'N/A')}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.status.label', 'Status')}>
              <Tag color={getStatusColor(stockItem.status)}>
                {getStatusLabel(stockItem.status)}
              </Tag>
            </Descriptions.Item>
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
      key: 'receiving-lots',
      label: (
        <span>
          <PlusOutlined />
          {t('stock.detail.receivingLotsHistory', 'Lịch sử nhập giá')}
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Card
            size="small"
            title={t('stock.detail.receivingLots', 'Receiving lots')}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openReceiveWithPricingModal()}>
                {t('stock.detail.receiveWithPricing', 'Nhập kho + giá')}
              </Button>
            }
          >
            <Row gutter={12}>
              <Col xs={24} sm={12} md={8}>
                <Select
                  style={{ width: '100%' }}
                  allowClear
                  placeholder={t('stock.receivingLots.filterBrand', 'Filter by brand')}
                  value={receivingLotsBrandFilter}
                  onChange={(value) => {
                    setReceivingLotsPagination((prev) => ({ ...prev, page: 1 }));
                    setReceivingLotsBrandFilter(value || undefined);
                  }}
                  options={stockItemBrands.map((sib) => ({ value: sib.brandId, label: sib.brandName }))}
                />
              </Col>
              <Col xs={24} sm={12} md={10}>
                <DatePicker.RangePicker
                  style={{ width: '100%' }}
                  value={receivingLotsDateRange}
                  onChange={(value) => {
                    setReceivingLotsPagination((prev) => ({ ...prev, page: 1 }));
                    setReceivingLotsDateRange(value as any);
                  }}
                  showTime={false}
                />
              </Col>
            </Row>
          </Card>

          <Table<StockReceivingLot>
            columns={receivingLotColumns}
            dataSource={receivingLots}
            loading={receivingLotsLoading}
            rowKey="id"
            pagination={{
              current: receivingLotsPagination.page,
              pageSize: receivingLotsPagination.limit,
              total: receivingLotsPagination.total,
              showSizeChanger: true,
              onChange: (page, pageSize) => {
                setReceivingLotsPagination((prev) => ({
                  ...prev,
                  page,
                  limit: pageSize,
                }));
              },
            }}
          />
        </Space>
      ),
    },
    {
      key: 'movements',
      label: (
        <span>
          <HistoryOutlined />
          {t('stock.detail.movementHistory', 'Lịch sử biến động kho')}
        </span>
      ),
      children: (
        <StockMovementHistory
          stockItemId={id}
          key={refreshKey}
          showStockItemColumn={false}
        />
      ),
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
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openReceiveWithPricingModal()}>
              {t('stock.detail.receiveWithPricing', 'Nhập kho + giá')}
            </Button>
            <Button icon={<MinusOutlined />} onClick={() => setAdjustModalVisible(true)}>
              {t('stock.detail.adjustStock', 'Adjust Stock')}
            </Button>
          </Space>
        }
      />

      <Card>
        <Tabs
          activeKey={activeTabKey}
          onChange={setActiveTabKey}
          items={tabItems}
        />
      </Card>

      {/* Receive Stock Modal */}
      <Modal
        title={t('stock.detail.receiveWithPricing', 'Nhập kho + giá')}
        open={receiveModalVisible}
        onCancel={() => {
          setReceiveModalVisible(false);
          setIsCreatingNewReceiveBrand(false);
          receiveForm.resetFields();
        }}
        footer={null}
      >
        <Form form={receiveForm} layout="vertical">
          <Space direction="vertical" style={{ width: '100%' }} size={8}>
            <Form.Item
              name="brandId"
              label={t('stock.detail.brand', 'Brand')}
              rules={[
                {
                  validator: async (_, value) => {
                    if (isCreatingNewReceiveBrand) {
                      return;
                    }
                    if (!value) {
                      throw new Error(t('validation.required', 'Brand is required'));
                    }
                  },
                },
              ]}
            >
              <Select
                placeholder={t('stock.detail.selectBrand', 'Select a brand')}
                style={{ width: '100%' }}
                options={(allBrands || []).map((b: Brand) => ({ value: b.id, label: b.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
            <Button
              type="link"
              onClick={() => {
                setIsCreatingNewReceiveBrand((prev) => !prev);
                receiveForm.setFieldValue('brandId', undefined);
              }}
            >
              {isCreatingNewReceiveBrand
                ? t('stock.detail.useExistingBrand', 'Use existing brand')
                : t('stock.detail.createNewBrand', 'Create new brand')}
            </Button>
            {isCreatingNewReceiveBrand && (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                  name="newBrandName"
                  label={t('stock.detail.newBrandName', 'New brand name')}
                  rules={[
                    {
                      required: true,
                      message: t('validation.required', 'Brand name is required'),
                    },
                  ]}
                >
                  <Input placeholder={t('stock.detail.newBrandNamePlaceholder', 'e.g., Bien Hoa')} />
                </Form.Item>
                <Form.Item name="newBrandImageFileId" label={t('stock.detail.brandImage', 'Brand image')}>
                  <FileUpload
                    value={receiveForm.getFieldValue('newBrandImageFileId')}
                    onChange={(fileId) =>
                      receiveForm.setFieldValue('newBrandImageFileId', fileId)
                    }
                    accept="image"
                  />
                </Form.Item>
              </Space>
            )}
          </Space>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="receivedQuantity"
                label={t('stock.detail.receivedQuantity', 'Số lượng nhập')}
                rules={[
                  { required: true, message: t('validation.required', 'Please enter quantity') },
                  { type: 'number', min: 0.001, message: t('stock.detail.quantityMustBeGreater', 'Quantity must be greater than 0') },
                ]}
              >
                <InputNumber style={{ width: '100%' }} min={0.001} step={0.001} precision={3} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="receivedUnit"
                label={t('stock.detail.receivedUnit', 'Đơn vị nhập')}
                rules={[{ required: true, message: t('validation.required', 'Unit is required') }]}
              >
                <Select
                  style={{ width: '100%' }}
                  options={purchaseUnitOptions.map((u) => ({ value: u, label: u }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priceBeforeTax"
                label={t('stock.detail.priceBeforeTax', 'Giá trước thuế')}
                rules={[{ required: true, message: t('validation.required', 'Price is required') }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={1000} precision={0} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="priceAfterTax"
                label={t('stock.detail.priceAfterTax', 'Giá sau thuế')}
                dependencies={['priceBeforeTax']}
                rules={[
                  { required: true, message: t('validation.required', 'Price is required') },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const before = Number(getFieldValue('priceBeforeTax') || 0);
                      const after = Number(value || 0);
                      if (after < before) {
                        return Promise.reject(
                          new Error(
                            t(
                              'stock.detail.priceAfterTaxMustBeGreater',
                              'Price after tax must be >= price before tax'
                            )
                          )
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

          <Form.Item name="receivedAt" label={t('stock.detail.receivedAt', 'Ngày nhập')}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="supplierName" label={t('stock.detail.supplierName', 'Nhà cung cấp')}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="invoiceCode" label={t('stock.detail.invoiceCode', 'Mã hóa đơn')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="note" label={t('stock.detail.note', 'Ghi chú')}>
            <TextArea rows={3} />
          </Form.Item>

          <Card size="small" title={t('stock.detail.preview', 'Preview')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text>
                {t('stock.detail.receiveSpec', 'Quy cách nhập')}: {Number(receivedQuantityValue || 0) || 0}{' '}
                {String(receivedUnitValue || '').trim() || '-'}
              </Text>
              <Text>
                {t('stock.detail.totalPriceAfterTax', 'Giá sau thuế')}: {formatCurrency(Number(receivePriceAfterTaxValue || 0))}
              </Text>
              <Text>
                {t('stock.detail.unitPriceConverted', 'Đơn giá quy đổi')}:{' '}
                {formatCurrency(receivedUnitPriceAfterTaxPreview)} / {stockItem.baseUnit}
              </Text>
              <Text>
                {t('stock.detail.stockAfterReceiving', 'Tồn sau khi nhập')}:{' '}
                {Number(stockItem.currentQuantity) + Number(receivedQuantityBasePreview)} {stockItem.baseUnit}
              </Text>
            </Space>
          </Card>

          <Form.Item style={{ marginTop: 16 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setReceiveModalVisible(false);
                  setIsCreatingNewReceiveBrand(false);
                  receiveForm.resetFields();
                }}
              >
                {t('common.actions.cancel', 'Cancel')}
              </Button>
              <Button type="primary" loading={operationLoading} onClick={handleReceiveWithPricing}>
                {t('stock.detail.receiveWithPricing', 'Nhập kho + giá')}
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
            name="purchaseQuantity"
            label={t('stock.detail.purchaseQuantity', 'Số lượng quy cách')}
            rules={[
              {
                required: true,
                message: t(
                  'stock.detail.purchaseQuantityRequired',
                  'Vui lòng nhập số lượng quy cách'
                ),
              },
              {
                type: 'number',
                min: 0.0001,
                message: t(
                  'stock.detail.purchaseQuantityMin',
                  'Số lượng quy cách phải lớn hơn 0'
                ),
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              precision={3}
              min={0.0001}
            />
          </Form.Item>

          <Form.Item
            name="purchaseUnit"
            label={t('stock.detail.purchaseUnit', 'Đơn vị quy cách')}
            rules={[
              {
                required: true,
                message: t(
                  'stock.detail.purchaseUnitRequired',
                  'Vui lòng chọn đơn vị quy cách'
                ),
              },
              {
                validator: async (_, value: StockPurchaseUnit) => {
                  if (!value || purchaseUnitOptions.includes(value)) {
                    return;
                  }
                  throw new Error(
                    t(
                      'stock.detail.purchaseUnitMismatch',
                      'Selected unit does not match this stock item type.'
                    )
                  );
                },
              },
            ]}
          >
            <Select>
              {purchaseUnitOptions.map((unit) => (
                <Select.Option key={unit} value={unit}>
                  {unit}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

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
              precision={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0)}
            />
          </Form.Item>

          {unitPricePreviewLineBeforeTax || unitPricePreviewLineAfterTax ? (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={t('stock.detail.pricePreviewTitle', 'Price conversion preview')}
              description={
                <Space direction="vertical" size={2}>
                  {unitPricePreviewLineBeforeTax ? (
                    <Text>{`${t(
                      'stock.detail.priceBeforeTax',
                      'Price Before Tax'
                    )}: ${unitPricePreviewLineBeforeTax}`}</Text>
                  ) : null}
                  {unitPricePreviewLineAfterTax ? (
                    <Text>{`${t(
                      'stock.detail.priceAfterTax',
                      'Price After Tax'
                    )}: ${unitPricePreviewLineAfterTax}`}</Text>
                  ) : null}
                </Space>
              }
            />
          ) : null}

          <Form.Item
            label={t('stock.detail.unitPriceBeforeTax', 'Đơn giá trước thuế')}
          >
            <Input
              value={`${formatCurrency(unitPriceBeforeTaxPreview)} /${stockItem.unitOfMeasure}`}
              readOnly
            />
          </Form.Item>

          <Form.Item
            label={t('stock.detail.unitPriceAfterTax', 'Đơn giá sau thuế')}
          >
            <Input
              value={`${formatCurrency(unitPriceAfterTaxPreview)} /${stockItem.unitOfMeasure}`}
              readOnly
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
