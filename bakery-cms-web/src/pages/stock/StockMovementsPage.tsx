/**
 * StockMovementsPage
 * Page for viewing stock movement history and audit trail
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from 'antd';
import { PageHeader } from '../../components/shared';
import { StockMovementHistory } from '../../components/features/stock/StockMovementHistory/StockMovementHistory';

/**
 * StockMovementsPage component
 */
export const StockMovementsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader
        title={t('stock.movements.title', 'Stock Movements')}
        subtitle={t('stock.movements.subtitle', 'Stock in/out history')}
      />
      <Card>
        <StockMovementHistory showStockItemColumn={true} />
      </Card>
    </div>
  );
};
