import React from 'react';
import { Card, Descriptions, Button, Space, Tag, Image } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { BusinessType, ProductStatus } from '../../../../types/models/product.model';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import { ProductRecipe } from '../../stock/ProductRecipe';
import type { ProductDetailProps } from './ProductDetail.types';

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    [ProductStatus.AVAILABLE]: 'success',
    [ProductStatus.OUT_OF_STOCK]: 'error',
  };
  return colorMap[status] || 'default';
};

const getBusinessTypeKey = (type: string): 'madeToOrder' | 'readyToSell' | 'both' => {
  const keyMap: Record<string, 'madeToOrder' | 'readyToSell' | 'both'> = {
    [BusinessType.MADE_TO_ORDER]: 'madeToOrder',
    [BusinessType.READY_TO_SELL]: 'readyToSell',
    [BusinessType.BOTH]: 'both',
  };
  return keyMap[type] || type;
};

const getStatusKey = (status: string): 'available' | 'outOfStock' => {
  const keyMap: Record<string, 'available' | 'outOfStock'> = {
    [ProductStatus.AVAILABLE]: 'available',
    [ProductStatus.OUT_OF_STOCK]: 'outOfStock',
  };
  return keyMap[status] || status;
};

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  loading = false,
  onEdit,
  onDelete,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('products.detail.backToProducts')}
        </Button>
      </div>

      <Card
        loading={loading}
        title={product.name}
        extra={
          <Space>
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              {t('common.actions.edit')}
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
              {t('common.actions.delete')}
            </Button>
          </Space>
        }
      >
        {product.imageUrl && (
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <Image
              src={product.imageUrl}
              alt={product.name}
              style={{ maxWidth: 400, maxHeight: 400 }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            />
          </div>
        )}

        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('products.detail.productId')}>{product.id}</Descriptions.Item>
          <Descriptions.Item label={t('products.detail.price')}>
            <strong style={{ fontSize: 18, color: '#52c41a' }}>
              {formatCurrency(product.price)}
            </strong>
          </Descriptions.Item>

          <Descriptions.Item label={t('products.detail.category')}>{product.category || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('products.detail.businessType')}>
            <Tag color="blue">{t(`products.businessType.${getBusinessTypeKey(product.businessType)}`)}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('products.detail.status')}>
            <Tag color={getStatusColor(product.status)}>
              {t(`products.status.${getStatusKey(product.status)}`)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('products.detail.createdAt')}>
            {formatDateTime(product.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label={t('products.detail.updatedAt')}>
            {formatDateTime(product.updatedAt)}
          </Descriptions.Item>
          <Descriptions.Item label={t('products.detail.imageUrl')}>
            {product.imageUrl ? (
              <a href={product.imageUrl} target="_blank" rel="noopener noreferrer">
                {t('products.detail.viewImage')}
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>

          <Descriptions.Item label={t('products.detail.description')} span={2}>
            {product.description || t('products.detail.noDescription')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Product Recipe Section */}
      <div style={{ marginTop: 24 }}>
        <ProductRecipe productId={product.id} />
      </div>
    </div>
  );
};
