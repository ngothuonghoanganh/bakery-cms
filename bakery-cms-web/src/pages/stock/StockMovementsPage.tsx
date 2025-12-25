/**
 * StockMovementsPage
 * Page for viewing stock movement history and audit trail
 */

import React from 'react';
import { Card } from 'antd';
import { PageHeader } from '../../components/shared';
import { StockMovementHistory } from '../../components/features/stock/StockMovementHistory/StockMovementHistory';

/**
 * StockMovementsPage component
 */
export const StockMovementsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle="View complete audit trail of all stock changes"
      />
      <Card>
        <StockMovementHistory showStockItemColumn={true} />
      </Card>
    </div>
  );
};
