/**
 * ProductList orchestrator component
 * Coordinates ProductTable, ProductForm, and ProductFilters
 */

import React, { useState, useCallback } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          success(t('products.notifications.updated', 'Product Updated'), t('products.notifications.updatedMessage', 'Product has been updated successfully'));
        } else {
          await onCreate(values);
          success(t('products.notifications.created', 'Product Created'), t('products.notifications.createdMessage', 'Product has been created successfully'));
        }
        close();
        setSelectedProduct(null);
      } catch (err) {
        error(t('products.notifications.operationFailed', 'Operation Failed'), err instanceof Error ? err.message : t('common.status.error'));
      } finally {
        setFormLoading(false);
      }
    },
    [selectedProduct, onCreate, onUpdate, close, success, error, t]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
        success(t('products.notifications.deleted', 'Product Deleted'), t('products.notifications.deletedMessage', 'Product has been deleted successfully'));
      } catch (err) {
        error(t('products.notifications.deleteFailed', 'Delete Failed'), err instanceof Error ? err.message : t('products.notifications.deleteError', 'Failed to delete product'));
      }
    },
    [onDelete, success, error, t]
  );

  const handleFiltersReset = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  return (
    <div>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('products.add')}
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
