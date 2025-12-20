/**
 * OrderSummary shared component
 */

import { Card } from '@/components/core';
import type { Order } from '@/types/models/order.model';

export type OrderSummaryProps = {
  readonly order: Order;
};

export const OrderSummary = ({ order }: OrderSummaryProps): React.JSX.Element => (
  <Card title={`Order #${order.orderNumber}`} subtitle={`Status: ${order.status}`}>
    <div className="space-y-2">
      <p>
        <strong>Total:</strong> ${order.totalAmount.toFixed(2)}
      </p>
      <p>
        <strong>Customer:</strong> {order.customerName || 'N/A'}
      </p>
      <p>
        <strong>Phone:</strong> {order.customerPhone || 'N/A'}
      </p>
      <p>
        <strong>Items:</strong> {order.items?.length || 0}
      </p>
    </div>
  </Card>
);
