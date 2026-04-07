/**
 * PaymentFilters Component
 * Comprehensive filter controls for payment list
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Input, Select, DatePicker, Row, Col } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { FilterPanel } from '../../../shared';
import { PaymentMethod, PaymentStatus, PaymentType } from '../../../../types/models/payment.model';
import type { PaymentFiltersProps, PaymentFiltersValue } from './PaymentFilters.types';

const { RangePicker } = DatePicker;

const toDateValue = (value?: Date): number | undefined => value?.getTime();

const areFiltersEqual = (
  left: PaymentFiltersValue,
  right: PaymentFiltersValue
): boolean => {
  return (
    left.orderId === right.orderId &&
    left.search === right.search &&
    left.paymentType === right.paymentType &&
    left.status === right.status &&
    left.method === right.method &&
    toDateValue(left.dateFrom) === toDateValue(right.dateFrom) &&
    toDateValue(left.dateTo) === toDateValue(right.dateTo)
  );
};

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({ value = {}, onChange }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState<PaymentFiltersValue>(value);

  useEffect(() => {
    setLocalFilters((prev) => (areFiltersEqual(prev, value) ? prev : value));
  }, [value]);

  const paymentMethodOptions = useMemo(
    () => [
      { label: t('payments.filter.allMethods'), value: undefined },
      { label: t('payments.method.cash'), value: PaymentMethod.CASH },
      { label: t('payments.method.vietqr'), value: PaymentMethod.VIETQR },
      { label: t('payments.method.bankTransfer'), value: PaymentMethod.BANK_TRANSFER },
    ],
    [t]
  );

  const paymentStatusOptions = useMemo(
    () => [
      { label: t('payments.filter.allStatuses'), value: undefined },
      { label: t('payments.status.pending'), value: PaymentStatus.PENDING },
      { label: t('payments.status.paid'), value: PaymentStatus.PAID },
      { label: t('payments.status.failed'), value: PaymentStatus.FAILED },
      { label: t('payments.status.cancelled'), value: PaymentStatus.CANCELLED },
    ],
    [t]
  );

  const paymentTypeOptions = useMemo(
    () => [
      { label: t('payments.filter.allTypes'), value: undefined },
      { label: t('payments.type.payment'), value: PaymentType.PAYMENT },
      { label: t('payments.type.refund'), value: PaymentType.REFUND },
    ],
    [t]
  );

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

  const handlePaymentTypeChange = (paymentType?: PaymentType) => {
    const newFilters = { ...localFilters, paymentType };
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
            placeholder={t('payments.filter.searchPlaceholder')}
            value={localFilters.search}
            onChange={handleSearchChange}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder={t('payments.filter.statusPlaceholder')}
            value={localFilters.status}
            onChange={handleStatusChange}
            options={paymentStatusOptions}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder={t('payments.filter.methodPlaceholder')}
            value={localFilters.method}
            onChange={handleMethodChange}
            options={paymentMethodOptions}
            style={{ width: '100%' }}
            allowClear
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={6}>
          <Select
            placeholder={t('payments.filter.typePlaceholder')}
            value={localFilters.paymentType}
            onChange={handlePaymentTypeChange}
            options={paymentTypeOptions}
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
            placeholder={[t('payments.filter.startDate'), t('payments.filter.endDate')]}
          />
        </Col>
      </Row>
    </FilterPanel>
  );
};
