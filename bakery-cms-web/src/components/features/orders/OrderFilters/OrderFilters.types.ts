/**
 * OrderFilters component types
 */

import type { OrderStatus, OrderType, BusinessModel } from '../../../../types/models/order.model';

export type OrderFiltersValue = {
  search?: string; // Search by order number or customer name
  status?: OrderStatus;
  orderType?: OrderType;
  businessModel?: BusinessModel;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
};

export type OrderFiltersProps = {
  value: OrderFiltersValue;
  onChange: (filters: OrderFiltersValue) => void;
  onReset: () => void;
};
