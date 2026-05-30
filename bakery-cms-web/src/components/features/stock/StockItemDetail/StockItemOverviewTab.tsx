import React from 'react';
import { Card, Descriptions, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { StockItem } from '@/types/models/stock.model';
import { formatDateTime } from '@/utils/format.utils';

const { Text } = Typography;

export type StockItemOverviewTabProps = {
  readonly stockItem: StockItem;
};

export const StockItemOverviewTab: React.FC<StockItemOverviewTabProps> = ({ stockItem }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 2 }}
        labelStyle={{ width: 180 }}
        size="middle"
      >
        <Descriptions.Item label={t('stock.detail.name')}>{stockItem.name}</Descriptions.Item>
        <Descriptions.Item label={t('stock.form.unit')}>{stockItem.unitOfMeasure}</Descriptions.Item>
        <Descriptions.Item label={t('stock.detail.baseUnit')}>{stockItem.baseUnit}</Descriptions.Item>
        <Descriptions.Item label={t('stock.detail.reorderThreshold')}>
          {stockItem.reorderThreshold ?? <Text type="secondary">{t('common.na')}</Text>}
        </Descriptions.Item>
        <Descriptions.Item label={t('stock.detail.description')} span={2}>
          {stockItem.description ? stockItem.description : <Text type="secondary">{t('stock.detail.noDescription')}</Text>}
        </Descriptions.Item>
        <Descriptions.Item label={t('stock.detail.created')}>
          {formatDateTime(stockItem.createdAt, 'YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
        <Descriptions.Item label={t('stock.detail.lastUpdated')}>
          {formatDateTime(stockItem.updatedAt, 'YYYY-MM-DD HH:mm')}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

