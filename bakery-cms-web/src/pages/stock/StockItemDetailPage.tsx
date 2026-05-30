/**
 * Stock Item Detail Page (Pricing-first)
 * Surfaces current stock + price, then pricing/receiving workflows.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Space, Spin, Tabs } from 'antd';
import type { TabsProps } from 'antd';
import type { Dayjs } from 'dayjs';
import { PageHeader } from '@/components/shared';
import { BrandCurrentPricingTable } from '@/components/features/stock/StockItemDetail/BrandCurrentPricingTable';
import {
  ReceiveWithPricingModal,
  type ReceiveWithPricingFormValues,
} from '@/components/features/stock/StockItemDetail/ReceiveWithPricingModal';
import { ReceivingLotsTable } from '@/components/features/stock/StockItemDetail/ReceivingLotsTable';
import { StockItemHeaderSummary } from '@/components/features/stock/StockItemDetail/StockItemHeaderSummary';
import { StockItemOverviewTab } from '@/components/features/stock/StockItemDetail/StockItemOverviewTab';
import { StockPriceOverviewCard } from '@/components/features/stock/StockItemDetail/StockPriceOverviewCard';
import { StockMovementHistory } from '@/components/features/stock/StockMovementHistory/StockMovementHistory';
import { useBrands } from '@/hooks/useBrands';
import { useCrudErrorNotification } from '@/hooks/useCrudErrorNotification';
import { useNotification } from '@/hooks/useNotification';
import {
  adjustStock,
  createBrand,
  getStockItemBrands,
  getStockItemById,
  getStockReceivingLots,
  receiveWithPricing,
} from '@/services/stock.service';
import { ErrorCode } from '@/types/common/error.types';
import type { StockItem, StockItemBrand, StockReceivingLot } from '@/types/models/stock.model';
import { StockPurchaseUnit } from '@/types/models/stock.model';

const { TextArea } = Input;

export const StockItemDetailPage = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const { brands: allBrands, refetch: refetchAllBrands } = useBrands({ autoFetch: true });

  const [loading, setLoading] = useState(true);
  const [stockItem, setStockItem] = useState<StockItem | null>(null);
  const [stockItemBrands, setStockItemBrands] = useState<StockItemBrand[]>([]);

  const [activeTabKey, setActiveTabKey] = useState('pricing');
  const [refreshKey, setRefreshKey] = useState(0);

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveInitialBrandId, setReceiveInitialBrandId] = useState<string | undefined>(undefined);
  const [operationLoading, setOperationLoading] = useState(false);

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm] = Form.useForm<{ quantity: number; reason: string }>();

  const [receivingLots, setReceivingLots] = useState<StockReceivingLot[]>([]);
  const [receivingLotsLoading, setReceivingLotsLoading] = useState(false);
  const [receivingLotsPagination, setReceivingLotsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [receivingLotsBrandFilter, setReceivingLotsBrandFilter] = useState<string | undefined>(undefined);
  const [receivingLotsDateRange, setReceivingLotsDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  const fetchStockItem = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const result = await getStockItemById(id);
      if (result.success && result.data) {
        setStockItem(result.data);
        return;
      }
      if (!result.success) {
        showCrudErrorRef.current(result.error);
        return;
      }

      showCrudErrorRef.current({
        code: ErrorCode.NOT_FOUND,
        message: tRef.current('stock.notifications.operationFailed'),
        statusCode: 404,
        timestamp: new Date(),
        details: [
          {
            field: 'stockItemId',
            message: tRef.current('stock.notifications.operationFailed'),
          },
        ],
      });
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
      // Optional: do not block page
    }
  }, [id]);

  const refreshAll = useCallback(async () => {
    await fetchStockItem();
    await fetchStockItemBrands();
  }, [fetchStockItem, fetchStockItemBrands]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const openReceiveWithPricing = useCallback((opts?: { brandId?: string }) => {
    setReceiveInitialBrandId(opts?.brandId);
    setReceiveModalOpen(true);
  }, []);

  const closeReceiveWithPricing = useCallback(() => {
    setReceiveModalOpen(false);
    setReceiveInitialBrandId(undefined);
  }, []);

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

      if (!result.success) {
        showCrudError(result.error);
        return;
      }

      setReceivingLots([...result.data.lots]);
      setReceivingLotsPagination((prev) => ({
        ...prev,
        total: result.data.total,
        page: result.data.page,
        limit: result.data.limit,
      }));
    } catch (err) {
      showCrudError(err);
    } finally {
      setReceivingLotsLoading(false);
    }
  }, [
    id,
    receivingLotsBrandFilter,
    receivingLotsDateRange,
    receivingLotsPagination.limit,
    receivingLotsPagination.page,
    showCrudError,
  ]);

  useEffect(() => {
    if (activeTabKey !== 'receiving-lots') return;
    void fetchReceivingLots();
  }, [activeTabKey, fetchReceivingLots]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (!action || action !== 'receive-with-pricing') return;
    if (!stockItem) return;

    openReceiveWithPricing();
    searchParams.delete('action');
    setSearchParams(searchParams, { replace: true });
  }, [openReceiveWithPricing, searchParams, setSearchParams, stockItem]);

  const handleReceiveSubmit = useCallback(
    async (values: ReceiveWithPricingFormValues) => {
      if (!id || !stockItem) return;

      setOperationLoading(true);
      try {
        let brandId = values.brandId;

        if (values.isCreatingNewBrand && values.newBrandName) {
          const createResult = await createBrand({
            name: values.newBrandName,
            imageFileId: values.newBrandImageFileId,
          });
          if (!createResult.success) {
            showCrudError(createResult.error);
            return;
          }
          brandId = createResult.data.id;
          void refetchAllBrands();
        }

        if (!brandId) {
          showCrudError({
            code: ErrorCode.MISSING_REQUIRED_FIELD,
            message: t('stock.receive.validation.brandRequired'),
            statusCode: 400,
            timestamp: new Date(),
            details: [{ field: 'brandId', message: t('stock.receive.validation.brandRequired') }],
          });
          return;
        }

        const result = await receiveWithPricing(id, {
          brandId,
          receivedQuantity: values.receivedQuantity,
          receivedUnit: values.receivedUnit as StockPurchaseUnit,
          priceBeforeTax: values.priceBeforeTax,
          priceAfterTax: values.priceAfterTax,
          receivedAt: values.receivedAt ? values.receivedAt.toISOString() : undefined,
          supplierName: values.supplierName,
          invoiceCode: values.invoiceCode,
          note: values.note,
        });

        if (!result.success) {
          showCrudError(result.error);
          return;
        }

        success(t('stock.receive.notifications.received'), t('stock.receive.notifications.receivedMessage'));
        closeReceiveWithPricing();
        await refreshAll();
        setRefreshKey((prev) => prev + 1);
        if (activeTabKey === 'receiving-lots') {
          await fetchReceivingLots();
        }
      } finally {
        setOperationLoading(false);
      }
    },
    [
      activeTabKey,
      closeReceiveWithPricing,
      fetchReceivingLots,
      id,
      refreshAll,
      refetchAllBrands,
      showCrudError,
      stockItem,
      success,
      t,
    ]
  );

  const handleAdjustStock = useCallback(async () => {
    if (!id) return;

    try {
      const values = await adjustForm.validateFields();
      setOperationLoading(true);

      const result = await adjustStock(id, {
        quantity: values.quantity,
        reason: values.reason,
      });

      if (!result.success) {
        showCrudError(result.error);
        return;
      }

      success(
        t('stock.detail.stockAdjusted'),
        t('stock.detail.stockAdjustedMessage', { quantity: values.quantity })
      );
      setAdjustModalOpen(false);
      adjustForm.resetFields();
      await fetchStockItem();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      if ((err as any)?.errorFields) return;
      showCrudError(err);
    } finally {
      setOperationLoading(false);
    }
  }, [adjustForm, fetchStockItem, id, showCrudError, success, t]);

  const tabs: TabsProps['items'] = useMemo(() => {
    if (!stockItem) return [];

    return [
      {
        key: 'pricing',
        label: t('stock.detail.pricingAndReceiving'),
        children: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <StockPriceOverviewCard
              stockItem={stockItem}
              priceSummary={stockItem.priceSummary}
              onReceiveWithPricing={() => openReceiveWithPricing()}
            />
          </Space>
        ),
      },
      {
        key: 'receiving-lots',
        label: t('stock.detail.receivingLots'),
        children: (
          <ReceivingLotsTable
            brands={allBrands || []}
            lots={receivingLots}
            loading={receivingLotsLoading}
            pagination={receivingLotsPagination}
            brandId={receivingLotsBrandFilter}
            dateRange={receivingLotsDateRange}
            onBrandIdChange={(brandId) => {
              setReceivingLotsBrandFilter(brandId);
              setReceivingLotsPagination((prev) => ({ ...prev, page: 1 }));
            }}
            onDateRangeChange={(range) => {
              setReceivingLotsDateRange(range);
              setReceivingLotsPagination((prev) => ({ ...prev, page: 1 }));
            }}
            onPaginationChange={(page, limit) => {
              setReceivingLotsPagination((prev) => ({ ...prev, page, limit }));
            }}
          />
        ),
      },
      {
        key: 'brands',
        label: t('stock.detail.brandsAndCurrentPricing'),
        children: (
          <BrandCurrentPricingTable
            stockItemId={stockItem.id}
            stockItem={stockItem}
            stockItemBrands={stockItemBrands}
            allBrands={allBrands || []}
            onChanged={() => void refreshAll()}
            onReceiveWithPricingForBrand={(brandId) => openReceiveWithPricing({ brandId })}
          />
        ),
      },
      {
        key: 'overview',
        label: t('stock.detail.overview'),
        children: <StockItemOverviewTab stockItem={stockItem} />,
      },
      {
        key: 'movements',
        label: t('stock.detail.movementHistory'),
        children: <StockMovementHistory stockItemId={id} key={refreshKey} showStockItemColumn={false} />,
      },
    ];
  }, [
    allBrands,
    id,
    openReceiveWithPricing,
    receivingLots,
    receivingLotsBrandFilter,
    receivingLotsDateRange,
    receivingLotsLoading,
    receivingLotsPagination,
    refreshAll,
    refreshKey,
    stockItem,
    stockItemBrands,
    t,
  ]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 360 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stockItem) {
    return (
      <Card style={{ maxWidth: 520, margin: '0 auto' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ fontWeight: 600 }}>{t('stock.detail.notFound')}</div>
          <Button type="primary" onClick={() => navigate('/stock/items')} block>
            {t('stock.detail.backToList')}
          </Button>
        </Space>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={stockItem.name}
        subtitle={t('stock.detail.subtitle', { unit: stockItem.unitOfMeasure })}
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/stock/items')}>
              {t('common.actions.back')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openReceiveWithPricing()}>
              {t('stock.detail.receiveWithPricing')}
            </Button>
            <Button icon={<MinusOutlined />} onClick={() => setAdjustModalOpen(true)}>
              {t('stock.detail.adjustStock')}
            </Button>
          </Space>
        }
      />

      <div style={{ marginBottom: 12 }}>
        <StockItemHeaderSummary stockItem={stockItem} priceSummary={stockItem.priceSummary} />
      </div>

      <Tabs activeKey={activeTabKey} onChange={setActiveTabKey} items={tabs} tabBarGutter={20} />

      <ReceiveWithPricingModal
        open={receiveModalOpen}
        loading={operationLoading}
        stockItem={stockItem}
        brands={allBrands || []}
        initialBrandId={receiveInitialBrandId}
        onCancel={closeReceiveWithPricing}
        onSubmit={handleReceiveSubmit}
      />

      <Modal
        title={t('stock.detail.adjustStock')}
        open={adjustModalOpen}
        onCancel={() => {
          setAdjustModalOpen(false);
          adjustForm.resetFields();
        }}
        onOk={() => void handleAdjustStock()}
        okText={t('common.actions.confirm')}
        cancelText={t('common.actions.cancel')}
        confirmLoading={operationLoading}
        width={720}
      >
        <Form form={adjustForm} layout="vertical" requiredMark="optional">
          <Form.Item
            name="quantity"
            label={t('stock.detail.quantityChangeWithUnit', { unit: stockItem.unitOfMeasure })}
            rules={[
              { required: true, message: t('validation.required') },
              { type: 'number', message: t('validation.number') },
            ]}
            extra={t('stock.detail.adjustmentHint')}
          >
            <InputNumber style={{ width: '100%' }} step={0.001} precision={3} />
          </Form.Item>
          <Form.Item
            name="reason"
            label={t('stock.form.reason')}
            rules={[{ required: true, message: t('stock.detail.reasonRequired') }]}
          >
            <TextArea rows={3} placeholder={t('stock.detail.adjustReasonPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

