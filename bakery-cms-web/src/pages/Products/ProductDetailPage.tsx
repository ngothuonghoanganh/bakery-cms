import React, { useEffect, useState, useCallback } from 'react';
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
      error('Failed to Load', result.error.message);
    }
    setLoading(false);
  }, [id, error]);

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
          success('Product Updated', 'Product has been updated successfully');
          setProduct(result.data);
          close();
        } else {
          throw new Error(result.error.message);
        }
      } catch (err) {
        error('Update Failed', err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setFormLoading(false);
      }
    },
    [id, success, error, close]
  );

  const handleDelete = useCallback(async () => {
    if (!id) return;

    const result = await deleteProduct(id);

    if (result.success) {
      success('Product Deleted', 'Product has been deleted successfully');
      navigate('/products');
    } else {
      error('Delete Failed', result.error.message);
    }
  }, [id, success, error, navigate]);

  const handleBack = useCallback(() => {
    navigate('/products');
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner tip="Loading product..." />;
  }

  if (!product) {
    return (
      <EmptyState
        description="Product not found"
        action={
          <button onClick={handleBack} className="ant-btn ant-btn-primary">
            Back to Products
          </button>
        }
      />
    );
  }

  return (
    <>
      <Popconfirm
        title="Delete Product"
        description="Are you sure you want to delete this product?"
        onConfirm={handleDelete}
        okText="Yes"
        cancelText="No"
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
