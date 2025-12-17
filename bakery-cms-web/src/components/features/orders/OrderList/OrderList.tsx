/**
 * OrderList feature component
 */

import { Spinner, ErrorMessage } from '@/components/core';
import { OrderSummary } from '@/components/shared';
import { useOrders } from '@/hooks/useOrders';

export const OrderList = (): React.JSX.Element => {
  const { orders, loading, error } = useOrders();

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {orders.map((order) => (
        <OrderSummary key={order.id} order={order} />
      ))}
    </div>
  );
};
