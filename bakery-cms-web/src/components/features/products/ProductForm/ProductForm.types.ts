import type { Product, BusinessType, ProductStatus } from '../../../../types/models/product.model';

export interface ProductFormValues {
  name: string;
  description?: string;
  price: number;
  category?: string;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl?: string;
}

export interface ProductFormProps {
  visible: boolean;
  product?: Product | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
