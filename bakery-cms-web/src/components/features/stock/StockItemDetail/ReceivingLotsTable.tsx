import React, { useMemo } from 'react';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Grid,
  List,
  Row,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import type { Brand, StockReceivingLot } from '@/types/models/stock.model';
import { formatCurrency, formatDateTime } from '@/utils/format.utils';

const { RangePicker } = DatePicker;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export type ReceivingLotsTableProps = {
  readonly brands: readonly Brand[];
  readonly lots: readonly StockReceivingLot[];
  readonly loading: boolean;
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
  };
  readonly brandId?: string;
  readonly dateRange: [Dayjs, Dayjs] | null;
  readonly onBrandIdChange: (brandId: string | undefined) => void;
  readonly onDateRangeChange: (range: [Dayjs, Dayjs] | null) => void;
  readonly onPaginationChange: (page: number, limit: number) => void;
};

export const ReceivingLotsTable: React.FC<ReceivingLotsTableProps> = ({
  brands,
  lots,
  loading,
  pagination,
  brandId,
  dateRange,
  onBrandIdChange,
  onDateRangeChange,
  onPaginationChange,
}) => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const brandOptions = useMemo(
    () => [
      { value: '', label: t('stock.receivingLots.filters.allBrands') },
      ...brands.map((b) => ({ value: b.id, label: b.name })),
    ],
    [brands, t]
  );

  const columns = useMemo<ColumnsType<StockReceivingLot>>(
    () => [
      {
        title: t('stock.receivingLots.columns.receivedAt'),
        key: 'receivedAt',
        width: 160,
        render: (_: unknown, record: StockReceivingLot) =>
          formatDateTime(record.receivedAt, 'YYYY-MM-DD HH:mm'),
      },
      {
        title: t('stock.receivingLots.columns.brand'),
        dataIndex: 'brandName',
        key: 'brandName',
        width: 160,
      },
      {
        title: t('stock.receivingLots.columns.receivedQuantity'),
        key: 'receivedQuantity',
        width: 160,
        render: (_: unknown, record: StockReceivingLot) =>
          `${record.receivedQuantity} ${record.receivedUnit}`,
      },
      {
        title: t('stock.receivingLots.columns.totalAfterTax'),
        dataIndex: 'priceAfterTax',
        key: 'priceAfterTax',
        width: 160,
        render: (value: number) => formatCurrency(value),
      },
      {
        title: t('stock.receivingLots.columns.unitPrice'),
        key: 'unitPriceAfterTax',
        width: 170,
        render: (_: unknown, record: StockReceivingLot) =>
          `${formatCurrency(record.unitPriceAfterTax)} / ${record.baseUnit}`,
      },
      {
        title: t('stock.receivingLots.columns.supplier'),
        dataIndex: 'supplierName',
        key: 'supplierName',
        width: 170,
        responsive: ['lg'],
        render: (value: string | null) => value || t('common.na'),
      },
      {
        title: t('stock.receivingLots.columns.invoiceCode'),
        dataIndex: 'invoiceCode',
        key: 'invoiceCode',
        width: 160,
        responsive: ['lg'],
        render: (value: string | null) => value || t('common.na'),
      },
    ],
    [t]
  );

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Select
            value={brandId || ''}
            options={brandOptions}
            onChange={(value) => onBrandIdChange(value ? String(value) : undefined)}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} md={16}>
          <RangePicker
            value={dateRange}
            onChange={(value) => onDateRangeChange(value ? ([value[0]!, value[1]!] as [Dayjs, Dayjs]) : null)}
            style={{ width: '100%' }}
            allowEmpty={[true, true]}
            presets={[
              {
                label: t('stock.receivingLots.filters.last7Days'),
                value: [dayjs().subtract(6, 'day'), dayjs()],
              },
              {
                label: t('stock.receivingLots.filters.last30Days'),
                value: [dayjs().subtract(29, 'day'), dayjs()],
              },
            ]}
          />
        </Col>
      </Row>

      {isMobile ? (
        lots.length === 0 && !loading ? (
          <Card>
            <Empty description={t('stock.receivingLots.empty')} />
          </Card>
          ) : (
            <List
              loading={loading}
              dataSource={[...lots]}
              renderItem={(lot) => (
                <List.Item style={{ padding: 0 }}>
                  <Card
                  size="small"
                  title={formatDateTime(lot.receivedAt, 'YYYY-MM-DD HH:mm')}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text>
                      {t('stock.receivingLots.card.brand')}: {lot.brandName}
                    </Text>
                    <Text>
                      {t('stock.receivingLots.card.quantity')}: {lot.receivedQuantity} {lot.receivedUnit}
                    </Text>
                    <Text>
                      {t('stock.receivingLots.card.totalAfterTax')}: {formatCurrency(lot.priceAfterTax)}
                    </Text>
                    <Text>
                      {t('stock.receivingLots.card.unitPrice')}: {formatCurrency(lot.unitPriceAfterTax)} / {lot.baseUnit}
                    </Text>
                    {(lot.supplierName || lot.invoiceCode) ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('stock.receivingLots.card.supplierInvoice', {
                          supplier: lot.supplierName || t('common.na'),
                          invoice: lot.invoiceCode || t('common.na'),
                        })}
                      </Text>
                    ) : null}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )
      ) : (
        <Table<StockReceivingLot>
          columns={columns}
          dataSource={[...lots]}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => onPaginationChange(page, pageSize),
          }}
          scroll={{ x: 980 }}
        />
      )}
    </Space>
  );
};
