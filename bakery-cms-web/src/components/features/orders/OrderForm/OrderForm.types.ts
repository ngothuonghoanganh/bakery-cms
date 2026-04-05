/**
 * OrderForm component types
 */

import type {  OrderStatusType as OrderStatus, OrderTypeType as OrderType, BusinessModelType as BusinessModel }  from '../../../../types/models/order.model';

export type OrderItemFormValue = {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  subtotal?: number; // Calculated field
};

export type OrderExtraFeeFormValue = {
  id: string;
  name?: string;
  amount: number;
};

export type OrderFormValues = {
  orderType: OrderType;
  businessModel: BusinessModel;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  items: OrderItemFormValue[];
  extraFees?: OrderExtraFeeFormValue[];
  status: OrderStatus;
};

export type OrderFormProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: OrderFormValues) => void;
  initialValues?: Partial<OrderFormValues>;
  loading?: boolean;
};
