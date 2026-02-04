import type { Product, BusinessType, ProductStatus } from '../../../../types/models/product.model';
import type { ProductImageItem } from '../../../shared/MultiFileUpload';

export interface ProductFormValues {
  name: string;
  description?: string;
  price: number;
  category?: string;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl?: string;
  imageFileId?: string | null;
  images?: ProductImageItem[];
}

export interface ProductFormProps {
  visible: boolean;
  product?: Product | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
