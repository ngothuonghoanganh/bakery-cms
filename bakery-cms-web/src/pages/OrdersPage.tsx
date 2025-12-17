/**
 * Orders Page
 */

import { OrderList } from '@/components/features/orders/OrderList/OrderList';

export const OrdersPage = (): React.JSX.Element => (
  <div>
    <h1 className="text-3xl font-bold p-4">Orders</h1>
    <OrderList />
  </div>
);
