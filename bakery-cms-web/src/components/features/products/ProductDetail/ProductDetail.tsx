import React, { useState } from 'react';
import { Card, Descriptions, Button, Space, Tag, Image, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined, StarFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { BusinessType, ProductStatus } from '../../../../types/models/product.model';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import { ProductRecipe } from '../../stock/ProductRecipe';
import { fileService } from '../../../../services/file.service';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Get all images (multi-images + legacy image)
  const allImages = React.useMemo(() => {
    const images: { id?: string; url: string; isPrimary?: boolean; displayOrder?: number }[] = [];
    const seenUrls = new Set<string>();

    const addImage = (image: { id?: string; url?: string; isPrimary?: boolean; displayOrder?: number }) => {
      if (!image.url) return;
      if (seenUrls.has(image.url)) return;
      seenUrls.add(image.url);
      images.push({
        id: image.id,
        url: image.url,
        isPrimary: image.isPrimary,
        displayOrder: image.displayOrder,
      });
    };

    // Add multi-images first
    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        const url = img.file?.url
          ? fileService.getStaticUrl(img.file.url)
          : img.fileId
            ? fileService.getDownloadUrl(img.fileId)
            : '';

        addImage({
          id: img.id,
          url,
          isPrimary: img.isPrimary,
          displayOrder: img.displayOrder,
        });
      });
    }

    // Add legacy image (if present)
    if (product.imageFile?.url) {
      addImage({ url: fileService.getStaticUrl(product.imageFile.url) });
    } else if (product.imageUrl) {
      addImage({ url: product.imageUrl });
    }

    // Sort by primary first, then displayOrder
    images.sort((a, b) => {
      const primaryDiff = Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary));
      if (primaryDiff !== 0) return primaryDiff;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });

    return images;
  }, [product]);

  React.useEffect(() => {
    const primaryIndex = allImages.findIndex((img) => img.isPrimary);
    if (primaryIndex >= 0) {
      setSelectedImageIndex(primaryIndex);
      return;
    }
    setSelectedImageIndex(0);
  }, [product.id, allImages]);

  const currentImage = allImages[selectedImageIndex] || allImages[0];

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
        {/* Image Gallery */}
        {allImages.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            {/* Main Image */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Image
                src={currentImage?.url}
                alt={product.name}
                style={{ maxWidth: 400, maxHeight: 400, objectFit: 'contain' }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
              />
            </div>

            {/* Thumbnail Gallery */}
            {allImages.length > 1 && (
              <Row gutter={8} justify="center">
                {allImages.map((img, index) => (
                  <Col key={index}>
                    <div
                      onClick={() => setSelectedImageIndex(index)}
                      style={{
                        width: 80,
                        height: 80,
                        border: selectedImageIndex === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        borderRadius: 4,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {img.isPrimary && (
                        <StarFilled
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            color: '#faad14',
                            fontSize: 12,
                          }}
                        />
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            )}
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
            {product.imageFile ? (
              <a href={fileService.getStaticUrl(product.imageFile.url)} target="_blank" rel="noopener noreferrer">
                {t('products.detail.viewImage')}
              </a>
            ) : product.imageUrl ? (
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
