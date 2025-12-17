import type { Product } from '../../../../types/models/product.model';

export interface ProductDetailProps {
  product: Product;
  loading?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}
