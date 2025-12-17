/**
 * Products Page
 */

import { ProductList } from '@/components/features/products/ProductList/ProductList';

export const ProductsPage = (): React.JSX.Element => (
  <div>
    <h1 className="text-3xl font-bold p-4">Products</h1>
    <ProductList />
  </div>
);
