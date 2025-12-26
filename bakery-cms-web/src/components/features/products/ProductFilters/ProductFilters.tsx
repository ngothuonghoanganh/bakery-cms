import React from 'react';
import { Row, Col, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FilterPanel } from '../../../shared';
import { BusinessType, ProductStatus } from '../../../../types/models/product.model';
import type { ProductFiltersProps } from './ProductFilters.types';

const { Option } = Select;

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
  onReset,
  loading = false,
}) => {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ ...filters, category: value || undefined });
  };

  const handleBusinessTypeChange = (value: string) => {
    onChange({
      ...filters,
      businessType: value ? (value as (typeof BusinessType)[keyof typeof BusinessType]) : undefined,
    });
  };

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      status: value ? (value as (typeof ProductStatus)[keyof typeof ProductStatus]) : undefined,
    });
  };

  return (
    <FilterPanel onReset={onReset}>
      <Row gutter={[16, 16]} style={{ width: '100%' }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder={t('products.filter.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={handleSearchChange}
            disabled={loading}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder={t('products.filter.category')}
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            disabled={loading}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder={t('products.filter.businessType')}
            value={filters.businessType}
            onChange={handleBusinessTypeChange}
            disabled={loading}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value={BusinessType.READY_TO_SELL}>{t('products.businessType.readyToSell')}</Option>
            <Option value={BusinessType.MADE_TO_ORDER}>{t('products.businessType.madeToOrder')}</Option>
            <Option value={BusinessType.BOTH}>{t('products.businessType.both')}</Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder={t('products.filter.status')}
            value={filters.status}
            onChange={handleStatusChange}
            disabled={loading}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value={ProductStatus.AVAILABLE}>{t('products.status.available')}</Option>
            <Option value={ProductStatus.OUT_OF_STOCK}>{t('products.status.outOfStock')}</Option>
          </Select>
        </Col>
      </Row>
    </FilterPanel>
  );
};
