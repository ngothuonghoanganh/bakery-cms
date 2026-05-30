import React, { useMemo } from 'react';
import { Alert, Button, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { StockItem, StockItemPriceSummary } from '@/types/models/stock.model';
import { formatCurrency, formatDateTime } from '@/utils/format.utils';

const { Text } = Typography;

export type StockPriceOverviewCardProps = {
  readonly stockItem: StockItem;
  readonly priceSummary?: StockItemPriceSummary;
  readonly onReceiveWithPricing: () => void;
};

export const StockPriceOverviewCard: React.FC<StockPriceOverviewCardProps> = ({
  stockItem,
  priceSummary,
  onReceiveWithPricing,
}) => {
  const { t } = useTranslation();

  const currentUnitPriceAfterTax = priceSummary?.latestUnitPriceAfterTax ?? null;
  const currentBrandName =
    priceSummary?.latestPriceBrandName || priceSummary?.preferredBrandName || null;
  const latestReceivedAt = priceSummary?.latestReceivedAt ?? null;
  const hasPrice = Boolean(
    priceSummary?.hasPrice &&
      currentUnitPriceAfterTax !== null &&
      currentUnitPriceAfterTax !== undefined
  );

  const priceValue = useMemo(() => {
    if (!hasPrice || currentUnitPriceAfterTax === null) {
      return t('stock.list.noPrice');
    }
    return formatCurrency(currentUnitPriceAfterTax);
  }, [currentUnitPriceAfterTax, hasPrice, t]);

  return (
    <Card
      title={t('stock.detail.pricingAndReceiving')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onReceiveWithPricing}>
          {t('stock.detail.receiveWithPricing')}
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title={t('stock.detail.currentPricePerBaseUnit')}
            value={priceValue}
            suffix={hasPrice ? `/ ${stockItem.baseUnit}` : undefined}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title={t('stock.detail.currentPriceBrand')}
            value={currentBrandName || t('common.na')}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Statistic
            title={t('stock.detail.latestReceiving')}
            value={
              latestReceivedAt ? formatDateTime(latestReceivedAt, 'YYYY-MM-DD HH:mm') : t('stock.list.latestReceivingEmpty')
            }
          />
        </Col>
      </Row>

      {!hasPrice ? (
        <div style={{ marginTop: 16 }}>
          <Alert type="warning" showIcon message={t('stock.detail.noPriceWarning')} />
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <Space direction="vertical" size={4}>
          <Text type="secondary">{t('stock.detail.currentPriceExplain')}</Text>
          <Text type="secondary">{t('stock.detail.currentPriceExplainShort')}</Text>
        </Space>
      </div>
    </Card>
  );
};
