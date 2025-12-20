/**
 * ProductList orchestrator component
 * Coordinates ProductTable, ProductForm, and ProductFilters
 */

import React, { useState, useCallback } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '../../../shared';
import { ProductTable } from '../ProductTable/ProductTable';
import { ProductForm } from '../ProductForm/ProductForm';
import { ProductFilters } from '../ProductFilters/ProductFilters';
import { useNotification } from '../../../../hooks/useNotification';
import { useModal } from '../../../../hooks/useModal';
import type {
  Product,
  ProductFilters as ProductFiltersType,
} from '../../../../types/models/product.model';
import type { ProductFormValues } from '../ProductForm/ProductForm.types';

interface ProductListProps {
  products: Product[];
  loading: boolean;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  filters: ProductFiltersType;
  onFiltersChange: (filters: ProductFiltersType) => void;
  onTableChange: (pagination: any, filters: any, sorter: any) => void;
  onCreate: (values: ProductFormValues) => Promise<void>;
  onUpdate: (id: string, values: ProductFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (id: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  loading,
  pagination,
  filters,
  onFiltersChange,
  onTableChange,
  onCreate,
  onUpdate,
  onDelete,
  onView,
}) => {
  const { visible, open, close } = useModal();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { success, error } = useNotification();

  const handleCreate = useCallback(() => {
    setSelectedProduct(null);
    open();
  }, [open]);

  const handleEdit = useCallback(
    (product: Product) => {
      setSelectedProduct(product);
      open();
    },
    [open]
  );

  const handleFormSubmit = useCallback(
    async (values: ProductFormValues) => {
      setFormLoading(true);
      try {
        if (selectedProduct) {
          await onUpdate(selectedProduct.id, values);
          success('Product Updated', 'Product has been updated successfully');
        } else {
          await onCreate(values);
          success('Product Created', 'Product has been created successfully');
        }
        close();
        setSelectedProduct(null);
      } catch (err) {
        error('Operation Failed', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setFormLoading(false);
      }
    },
    [selectedProduct, onCreate, onUpdate, close, success, error]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
        success('Product Deleted', 'Product has been deleted successfully');
      } catch (err) {
        error('Delete Failed', err instanceof Error ? err.message : 'Failed to delete product');
      }
    },
    [onDelete, success, error]
  );

  const handleFiltersReset = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            New Product
          </Button>
        }
      />

      <ProductFilters
        filters={filters}
        onChange={onFiltersChange}
        onReset={handleFiltersReset}
        loading={loading}
      />

      <ProductTable
        products={products}
        loading={loading}
        pagination={pagination}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={onView}
        onTableChange={onTableChange}
      />

      <ProductForm
        visible={visible}
        product={selectedProduct}
        onSubmit={handleFormSubmit}
        onCancel={close}
        loading={formLoading}
      />
    </div>
  );
};
