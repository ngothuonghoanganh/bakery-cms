/**
 * OrderDetail component types
 */

import type { Order } from '../../../../types/models/order.model';

export type OrderDetailProps = {
  order: Order;
  onEdit: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onBack: () => void;
  loading?: boolean;
};
