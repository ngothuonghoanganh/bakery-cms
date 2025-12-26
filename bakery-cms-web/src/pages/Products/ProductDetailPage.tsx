import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Popconfirm } from 'antd';
import { ProductDetail } from '../../components/features/products/ProductDetail/ProductDetail';
import { ProductForm } from '../../components/features/products/ProductForm/ProductForm';
import { LoadingSpinner, EmptyState } from '../../components/shared';
import { useNotification } from '../../hooks/useNotification';
import { useModal } from '../../hooks/useModal';
import { getProductById, updateProduct, deleteProduct } from '../../services/product.service';
import type { Product } from '../../types/models/product.model';
import type { ProductFormValues } from '../../components/features/products/ProductForm/ProductForm.types';

export const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useNotification();
  const { visible, open, close } = useModal();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    const result = await getProductById(id);

    if (result.success) {
      setProduct(result.data);
    } else {
      error(t('products.notifications.operationFailed', 'Operation Failed'), result.error.message);
    }
    setLoading(false);
  }, [id, error, t]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleEdit = useCallback(() => {
    open();
  }, [open]);

  const handleFormSubmit = useCallback(
    async (values: ProductFormValues) => {
      if (!id) return;

      setFormLoading(true);
      try {
        const result = await updateProduct(id, values);

        if (result.success) {
          success(t('products.notifications.updated', 'Product Updated'), t('products.notifications.updatedMessage', 'Product has been updated successfully'));
          setProduct(result.data);
          close();
        } else {
          throw new Error(result.error.message);
        }
      } catch (err) {
        error(t('products.notifications.operationFailed', 'Update Failed'), err instanceof Error ? err.message : t('errors.generic', 'An error occurred'));
      } finally {
        setFormLoading(false);
      }
    },
    [id, success, error, close, t]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;

    const result = await deleteProduct(id);

    if (result.success) {
      success(t('products.notifications.deleted', 'Product Deleted'), t('products.notifications.deletedMessage', 'Product has been deleted successfully'));
      navigate('/products');
    } else {
      error(t('products.notifications.deleteFailed', 'Delete Failed'), result.error.message);
    }
  }, [id, success, error, navigate, t]);

  const handleBack = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner tip={t('common.status.loading', 'Loading...')} />;
  }

  if (!product) {
    return (
      <EmptyState
        description={t('products.list.noProducts', 'Product not found')}
        action={
          <button onClick={handleBack} className="ant-btn ant-btn-primary">
            {t('products.detail.backToList', 'Back to Products')}
          </button>
        }
      />
    );
  }

  return (
    <>
      <Popconfirm
        title={t('products.delete', 'Delete Product')}
        description={t('products.deleteConfirm', 'Are you sure you want to delete this product?')}
        onConfirm={handleDelete}
        okText={t('common.confirm.yes', 'Yes')}
        cancelText={t('common.confirm.no', 'No')}
        okButtonProps={{ danger: true }}
      >
        <div style={{ display: 'none' }} id="delete-trigger" />
      </Popconfirm>

      <ProductDetail
        product={product}
        onEdit={handleEdit}
        onDelete={() => {
          document.getElementById('delete-trigger')?.click();
        }}
        onBack={handleBack}
      />

      <ProductForm
        visible={visible}
        product={product}
        onSubmit={handleFormSubmit}
        onCancel={close}
        loading={formLoading}
      />
    </>
  );
};
