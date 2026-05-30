import React, { useMemo } from 'react';
import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { StockItem, StockItemPriceSummary } from '@/types/models/stock.model';
import { StockItemStatus } from '@/types/models/stock.model';
import { formatCurrency, formatDateTime } from '@/utils/format.utils';

const { Text } = Typography;

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

export type StockItemHeaderSummaryProps = {
  readonly stockItem: StockItem;
  readonly priceSummary?: StockItemPriceSummary;
};

export const StockItemHeaderSummary: React.FC<StockItemHeaderSummaryProps> = ({
  stockItem,
  priceSummary,
}) => {
  const { t } = useTranslation();

  const statusLabel = useMemo(() => {
    const map: Record<StockItemStatus, string> = {
      [StockItemStatus.AVAILABLE]: t('stock.status.inStock'),
      [StockItemStatus.LOW_STOCK]: t('stock.status.lowStock'),
      [StockItemStatus.OUT_OF_STOCK]: t('stock.status.outOfStock'),
    };
    return map[stockItem.status] || stockItem.status;
  }, [stockItem.status, t]);

  const currentUnitPriceAfterTax = priceSummary?.latestUnitPriceAfterTax ?? null;
  const currentBrandName =
    priceSummary?.latestPriceBrandName || priceSummary?.preferredBrandName || null;
  const latestReceivedAt = priceSummary?.latestReceivedAt ?? null;
  const hasPrice = Boolean(
    priceSummary?.hasPrice &&
    currentUnitPriceAfterTax !== null &&
    currentUnitPriceAfterTax !== undefined
  );

  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} lg={6}>
        <Card size="small" style={{ minHeight: 180 }}>
          <Statistic
            title={t('stock.detail.currentQuantity')}
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
          <div style={{ marginTop: 8 }}>
            <Tag color={getStatusColor(stockItem.status)}>{statusLabel}</Tag>
          </div>
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card size="small" style={{ minHeight: 180 }}>
          <Statistic
            title={t('stock.detail.currentPrice')}
            value={
              hasPrice && currentUnitPriceAfterTax !== null
                ? formatCurrency(currentUnitPriceAfterTax)
                : t('stock.list.noPrice')
            }
            suffix={hasPrice ? `/ ${stockItem.baseUnit}` : undefined}
          />
          {!hasPrice ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('stock.detail.noPriceHint')}
            </Text>
          ) : null}
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card size="small" style={{ minHeight: 180 }}>
          <Statistic
            title={t('stock.detail.currentPriceBrand')}
            value={currentBrandName || t('common.na')}
          />
        </Card>
      </Col>

      <Col xs={24} sm={12} lg={6}>
        <Card size="small" style={{ minHeight: 180 }}>
          <Statistic
            title={t('stock.detail.latestReceiving')}
            value={
              latestReceivedAt
                ? formatDateTime(latestReceivedAt, 'YYYY-MM-DD HH:mm')
                : t('stock.list.latestReceivingEmpty')
            }
          />
        </Card>
      </Col>
    </Row>
  );
};
