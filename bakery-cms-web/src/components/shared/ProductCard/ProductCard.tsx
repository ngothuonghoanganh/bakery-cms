/**
 * ProductCard shared component
 */

import { Card, Button } from '@/components/core';
import type { Product } from '@/types/models/product.model';

export type ProductCardProps = {
  readonly product: Product;
  readonly onEdit?: (product: Product) => void;
  readonly onDelete?: (product: Product) => void;
};

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps): React.JSX.Element => (
  <Card
    title={product.name}
    subtitle={`$${product.price.toFixed(2)} - ${product.status}`}
    footer={
      <div className="flex gap-2">
        {onEdit && <Button size="sm" onClick={() => onEdit(product)}>Edit</Button>}
        {onDelete && <Button size="sm" variant="danger" onClick={() => onDelete(product)}>Delete</Button>}
      </div>
    }
  >
    <p>{product.description || 'No description'}</p>
    <p className="text-sm text-gray-500">Category: {product.category || 'N/A'}</p>
  </Card>
);
