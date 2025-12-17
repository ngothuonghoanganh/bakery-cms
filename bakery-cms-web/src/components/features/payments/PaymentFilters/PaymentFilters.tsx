/**
 * PaymentFilters Component
 * Comprehensive filter controls for payment list
 */

import React, { useState } from 'react';
import { Input, Select, DatePicker, Row, Col } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { FilterPanel } from '../../../shared';
import { PaymentMethod, PaymentStatus } from '../../../../types/models/payment.model';
import type { PaymentFiltersProps, PaymentFiltersValue } from './PaymentFilters.types';

const { RangePicker } = DatePicker;

const PAYMENT_METHOD_OPTIONS = [
  { label: 'All Methods', value: undefined },
  { label: 'Cash', value: PaymentMethod.CASH },
  { label: 'VietQR', value: PaymentMethod.VIETQR },
  { label: 'Bank Transfer', value: PaymentMethod.BANK_TRANSFER },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: 'All Statuses', value: undefined },
  { label: 'Pending', value: PaymentStatus.PENDING },
  { label: 'Paid', value: PaymentStatus.PAID },
  { label: 'Failed', value: PaymentStatus.FAILED },
  { label: 'Refunded', value: PaymentStatus.REFUNDED },
];

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({ value = {}, onChange }) => {
  const [localFilters, setLocalFilters] = useState<PaymentFiltersValue>(value);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...localFilters, search: e.target.value || undefined };
    setLocalFilters(newFilters);
    onChange?.(newFilters);
  };

  const handleStatusChange = (status?: PaymentStatus) => {
    const newFilters = { ...localFilters, status };
    setLocalFilters(newFilters);
    onChange?.(newFilters);
  };

  const handleMethodChange = (method?: PaymentMethod) => {
    const newFilters = { ...localFilters, method };
    setLocalFilters(newFilters);
    onChange?.(newFilters);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    const newFilters = {
      ...localFilters,
      dateFrom: dates?.[0]?.toDate(),
      dateTo: dates?.[1]?.toDate(),
    };
    setLocalFilters(newFilters);
    onChange?.(newFilters);
  };

  return (
    <FilterPanel>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Input
            placeholder="Search by transaction ID or order ID"
            value={localFilters.search}
            onChange={handleSearchChange}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="Filter by status"
            value={localFilters.status}
            onChange={handleStatusChange}
            options={PAYMENT_STATUS_OPTIONS}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder="Filter by method"
            value={localFilters.method}
            onChange={handleMethodChange}
            options={PAYMENT_METHOD_OPTIONS}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <RangePicker
            style={{ width: '100%' }}
            value={
              localFilters.dateFrom && localFilters.dateTo
                ? [dayjs(localFilters.dateFrom), dayjs(localFilters.dateTo)]
                : null
            }
            onChange={handleDateRangeChange}
            placeholder={['Start date', 'End date']}
          />
        </Col>
      </Row>
    </FilterPanel>
  );
};
