/**
 * OrderFilters component
 * Provides filtering controls for orders list
 */

import React from 'react';
import { Input, Select, DatePicker, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { FilterPanel } from '../../../shared/FilterPanel/FilterPanel';
import { OrderStatus, OrderType, BusinessModel } from '../../../../types/models/order.model';
import type { OrderFiltersProps } from './OrderFilters.types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

export const OrderFilters: React.FC<OrderFiltersProps> = ({ value, onChange, onReset }) => {
  const { t } = useTranslation();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, search: e.target.value });
  };

  const handleStatusChange = (status?: OrderStatus) => {
    onChange({ ...value, status });
  };

  const handleOrderTypeChange = (orderType?: OrderType) => {
    onChange({ ...value, orderType });
  };

  const handleBusinessModelChange = (businessModel?: BusinessModel) => {
    onChange({ ...value, businessModel });
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      onChange({
        ...value,
        dateFrom: dates[0].toISOString(),
        dateTo: dates[1].toISOString(),
      });
    } else {
      onChange({
        ...value,
        dateFrom: undefined,
        dateTo: undefined,
      });
    }
  };

  const dateRange =
    value.dateFrom && value.dateTo ? [dayjs(value.dateFrom), dayjs(value.dateTo)] : undefined;

  return (
    <FilterPanel onReset={onReset}>
      <Row gutter={[16, 16]}>
        {/* Search */}
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder={t('orders.filter.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={value.search}
            onChange={handleSearchChange}
            allowClear
          />
        </Col>

        {/* Status Filter */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder={t('orders.filter.statusPlaceholder')}
            value={value.status}
            onChange={handleStatusChange}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value={OrderStatus.DRAFT}>{t('orders.status.draft')}</Option>
            <Option value={OrderStatus.CONFIRMED}>{t('orders.status.confirmed')}</Option>
            <Option value={OrderStatus.PAID}>{t('orders.status.paid')}</Option>
            <Option value={OrderStatus.CANCELLED}>{t('orders.status.cancelled')}</Option>
          </Select>
        </Col>

        {/* Order Type Filter */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder={t('orders.filter.orderTypePlaceholder')}
            value={value.orderType}
            onChange={handleOrderTypeChange}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value={OrderType.TEMPORARY}>{t('orders.orderType.temporary')}</Option>
            <Option value={OrderType.OFFICIAL}>{t('orders.orderType.official')}</Option>
          </Select>
        </Col>

        {/* Business Model Filter */}
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder={t('orders.filter.businessModelPlaceholder')}
            value={value.businessModel}
            onChange={handleBusinessModelChange}
            allowClear
            style={{ width: '100%' }}
          >
            <Option value={BusinessModel.MADE_TO_ORDER}>{t('orders.businessModel.madeToOrder')}</Option>
            <Option value={BusinessModel.READY_TO_SELL}>{t('orders.businessModel.readyToSell')}</Option>
          </Select>
        </Col>

        {/* Date Range Filter */}
        <Col xs={24} sm={12} md={8}>
          <RangePicker
            value={dateRange as any}
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
            placeholder={[t('orders.filter.startDate'), t('orders.filter.endDate')]}
          />
        </Col>
      </Row>
    </FilterPanel>
  );
};
