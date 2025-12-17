import React from 'react';
import { Card, Descriptions, Button, Space, Tag, Image } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { BusinessType, ProductStatus } from '../../../../types/models/product.model';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import type { ProductDetailProps } from './ProductDetail.types';

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    [ProductStatus.ACTIVE]: 'success',
    [ProductStatus.INACTIVE]: 'default',
    [ProductStatus.OUT_OF_STOCK]: 'error',
  };
  return colorMap[status] || 'default';
};

const getBusinessTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    [BusinessType.MADE_TO_ORDER]: 'Made to Order',
    [BusinessType.READY_TO_SELL]: 'Ready to Sell',
  };
  return labelMap[type] || type;
};

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  loading = false,
  onEdit,
  onDelete,
  onBack,
}) => {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Back to Products
        </Button>
      </div>

      <Card
        loading={loading}
        title={product.name}
        extra={
          <Space>
            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
              Delete
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
          <Descriptions.Item label="Product ID">{product.id}</Descriptions.Item>
          <Descriptions.Item label="Price">
            <strong style={{ fontSize: 18, color: '#52c41a' }}>
              {formatCurrency(product.price)}
            </strong>
          </Descriptions.Item>

          <Descriptions.Item label="Category">
            {product.category || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Business Type">
            <Tag color="blue">{getBusinessTypeLabel(product.businessType)}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(product.status)}>
              {product.status?.replace('_', ' ').toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatDateTime(product.createdAt)}
          </Descriptions.Item>

          <Descriptions.Item label="Updated At">
            {formatDateTime(product.updatedAt)}
          </Descriptions.Item>
          <Descriptions.Item label="Image URL">
            {product.imageUrl ? (
              <a href={product.imageUrl} target="_blank" rel="noopener noreferrer">
                View Image
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>

          <Descriptions.Item label="Description" span={2}>
            {product.description || 'No description available'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};
