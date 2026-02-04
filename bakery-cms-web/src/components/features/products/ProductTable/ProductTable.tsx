import React, { useMemo } from 'react';
import { Space, Button, Popconfirm, Tag, Image } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { DataTable } from '../../../shared';
import { ProductStatus, BusinessType } from '../../../../types/models/product.model';
import { formatCurrency, formatDateTime } from '../../../../utils/format.utils';
import { fileService } from '../../../../services/file.service';
import type { ProductTableProps, ProductColumn } from './ProductTable.types';
import type { Product } from '../../../../types/models/product.model';

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

const ProductTableComponent: React.FC<ProductTableProps> = ({
  products,
  loading = false,
  pagination,
  onEdit,
  onDelete,
  onView,
  onTableChange,
}) => {
  const { t } = useTranslation();

  // Memoize columns to prevent recreation on every render
  const columns: ProductColumn = useMemo(
    () => [
      {
        title: t('products.table.image'),
        key: 'image',
        width: 80,
        render: (_: any, record: Product) => {
          // Get the primary image from multi-images, or fall back to legacy image
          let imageUrl: string | null = null;
          let imageCount = 0;

          if (record.images && record.images.length > 0) {
            // Find primary image or use the first one
            const primaryImage = record.images.find(img => img.isPrimary) || record.images[0];
            if (primaryImage?.file?.id) {
              imageUrl = fileService.getDownloadUrl(primaryImage.file.id);
            } else if (primaryImage?.fileId) {
              imageUrl = fileService.getDownloadUrl(primaryImage.fileId);
            }
            imageCount = record.images.length;
          } else if (record.imageFile) {
            imageUrl = fileService.getDownloadUrl(record.imageFile.id);
          } else if (record.imageUrl) {
            imageUrl = record.imageUrl;
          }

          return imageUrl ? (
            <div style={{ position: 'relative' }}>
              <Image
                src={imageUrl}
                alt={record.name}
                width={50}
                height={50}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                preview={{ mask: <EyeOutlined /> }}
              />
              {imageCount > 1 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: 2,
                    fontSize: 10,
                  }}
                >
                  +{imageCount - 1}
                </span>
              )}
            </div>
          ) : (
            <div
              style={{
                width: 50,
                height: 50,
                backgroundColor: '#f0f0f0',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 10,
              }}
            >
              {t('products.noImage')}
            </div>
          );
        },
      },
      {
        title: t('products.table.name'),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        width: 200,
        render: (text: string) => <strong>{text}</strong>,
      },
      {
        title: t('products.table.category'),
        dataIndex: 'category',
        key: 'category',
        width: 120,
        render: (text: string | null) => text || '-',
      },
      {
        title: t('products.table.price'),
        dataIndex: 'price',
        key: 'price',
        width: 120,
        sorter: true,
        render: (price: number) => formatCurrency(price),
      },
      {
        title: t('products.table.businessType'),
        dataIndex: 'businessType',
        key: 'businessType',
        width: 150,
        render: (type: string) => (
          <Tag color="blue">{t(`products.businessType.${getBusinessTypeKey(type)}`)}</Tag>
        ),
      },
      {
        title: t('products.table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: string) => (
          <Tag color={getStatusColor(status)}>{t(`products.status.${getStatusKey(status)}`)}</Tag>
        ),
      },
      {
        title: t('products.table.createdAt'),
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        sorter: true,
        render: (date: Date) => formatDateTime(date),
      },
      {
        title: t('products.table.actions'),
        key: 'actions',
        width: 150,
        fixed: 'right',
        render: (_: any, record: Product) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
            <Popconfirm
              title={t('products.delete')}
              description={t('products.deleteConfirm')}
              onConfirm={() => onDelete(record.id)}
              okText={t('common.confirm.yes')}
              cancelText={t('common.confirm.no')}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, onView, onEdit, onDelete]
  ); // Dependencies: t function and callback props

  return (
    <DataTable
      columns={columns}
      dataSource={products}
      loading={loading}
      rowKey="id"
      pagination={pagination}
      onChange={onTableChange}
    />
  );
};

// Memoize component to prevent unnecessary re-renders
export const ProductTable = React.memo(ProductTableComponent);
