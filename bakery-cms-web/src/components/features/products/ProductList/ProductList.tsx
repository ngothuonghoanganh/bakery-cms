/**
 * ProductList feature component
 */

import { Spinner, ErrorMessage } from '@/components/core';
import { ProductCard } from '@/components/shared';
import { useProducts } from '@/hooks/useProducts';

export const ProductList = (): React.JSX.Element => {
  const { products, loading, error } = useProducts();

  if (loading) return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
