/**
 * Products Page
 * Container page for product management
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductList } from '@/components/features/products/ProductList/ProductList';
import { useProducts } from '@/hooks/useProducts';
import { createProduct, updateProduct, deleteProduct } from '@/services/product.service';
import type { ProductFilters } from '@/types/models/product.model';
import type { ProductFormValues } from '@/components/features/products/ProductForm/ProductForm.types';

export const ProductsPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Use the enhanced useProducts hook (we'll enhance it next)
  const { products, loading, error, refetch } = useProducts();

  // Update pagination total when products change
  useEffect(() => {
    if (products) {
      setPagination((prev) => ({
        ...prev,
        total: products.length, // TODO: Get from API response
      }));
    }
  }, [products]);

  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, current: 1 }));
    // TODO: Trigger refetch with new filters
  }, []);

  const handleTableChange = useCallback((pag: any, _filters: any, _sorter: any) => {
    setPagination({
      current: pag.current,
      pageSize: pag.pageSize,
      total: pag.total,
    });
    // TODO: Handle sorting and trigger refetch
  }, []);

  const handleCreate = useCallback(
    async (values: ProductFormValues) => {
      const result = await createProduct({
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        businessType: values.businessType,
        status: values.status,
        imageUrl: values.imageUrl,
      });

      if (result.success) {
        refetch();
      } else {
        throw new Error(result.error.message);
      }
    },
    [refetch]
  );

  const handleUpdate = useCallback(
    async (id: string, values: ProductFormValues) => {
      const result = await updateProduct(id, {
        name: values.name,
        description: values.description,
        price: values.price,
        category: values.category,
        businessType: values.businessType,
        status: values.status,
        imageUrl: values.imageUrl,
      });

      if (result.success) {
        refetch();
      } else {
        throw new Error(result.error.message);
      }
    },
    [refetch]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteProduct(id);
      
      if (result.success) {
        refetch();
      } else {
        throw new Error(result.error.message);
      }
    },
    [refetch]
  );

  const handleView = useCallback(
    (id: string) => {
      navigate(`/products/${id}`);
    },
    [navigate]
  );

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  return (
    <ProductList
      products={products ? [...products] : []}
      loading={loading}
      pagination={pagination}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onTableChange={handleTableChange}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onView={handleView}
    />
  );
};
