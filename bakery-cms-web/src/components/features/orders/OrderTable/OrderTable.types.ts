/**
 * OrderTable component types
 */

import type { Order } from '../../../../types/models/order.model';

export type OrderColumn = {
  key: string;
  dataIndex?: string;
  title: string;
  sorter?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: Order) => React.ReactNode;
};

export type OrderTableProps = {
  orders: Order[];
  loading?: boolean;
  onView: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onConfirm: (orderId: string) => void;
  onCancel: (orderId: string) => void;
};
