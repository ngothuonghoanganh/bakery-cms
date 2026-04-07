import type {
  Product,
  BusinessType,
  ProductStatus,
  ProductType,
  SaleUnitTypeType as SaleUnitType,
} from '../../../../types/models/product.model';
import type { ProductImageItem } from '../../../shared/MultiFileUpload';

export interface ProductComboItemFormValue {
  id?: string;
  itemProductId: string;
  quantity: number;
  displayOrder?: number;
}

export interface ProductFormValues {
  productCode?: string;
  name: string;
  description?: string;
  price: number;
  saleUnitType: SaleUnitType;
  category?: string;
  businessType: BusinessType;
  status: ProductStatus;
  productType: ProductType;
  isPublished: boolean;
  comboItems?: ProductComboItemFormValue[];
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
