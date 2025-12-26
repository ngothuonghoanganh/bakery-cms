/**
 * StockItemList orchestrator component
 * Coordinates stock item table, form, and filters
 */

import React, { useCallback, useMemo } from 'react';
import { Button, Table, Tag, Space, Popconfirm, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared';
import { useNotification } from '../../../../hooks/useNotification';
import { StockItemStatus } from '../../../../types/models/stock.model';
import type { StockItem } from '../../../../types/models/stock.model';
import type { StockItemListProps } from './StockItemList.types';

const { Search } = Input;

const getSortOrder = (sortBy: string | undefined, sortOrder: string | undefined, field: string): 'ascend' | 'descend' | undefined => {
  if (sortBy !== field) return undefined;
  return sortOrder === 'ASC' ? 'ascend' : 'descend';
};

const getStatusColor = (status: StockItemStatus): string => {
  switch (status) {
    case StockItemStatus.AVAILABLE:
      return 'green';
    case StockItemStatus.LOW_STOCK:
      return 'orange';
    case StockItemStatus.OUT_OF_STOCK:
      return 'red';
    default:
      return 'default';
  }
};


export const StockItemList: React.FC<StockItemListProps> = ({
  stockItems,
  loading,
  pagination,
  filters,
  onFiltersChange,
  onTableChange,
  onCreateClick,
  onDelete,
  onView,
}) => {
  const { t } = useTranslation();
  const { success, error } = useNotification();

  const getStatusLabel = useMemo(
    () => (status: StockItemStatus): string => {
      const labelMap: Record<StockItemStatus, string> = {
        [StockItemStatus.AVAILABLE]: t('stock.status.inStock'),
        [StockItemStatus.LOW_STOCK]: t('stock.status.lowStock'),
        [StockItemStatus.OUT_OF_STOCK]: t('stock.status.outOfStock'),
      };
      return labelMap[status] || status;
    },
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('stock.list.allStatus') },
      { value: StockItemStatus.AVAILABLE, label: t('stock.status.inStock') },
      { value: StockItemStatus.LOW_STOCK, label: t('stock.status.lowStock') },
      { value: StockItemStatus.OUT_OF_STOCK, label: t('stock.status.outOfStock') },
    ],
    [t]
  );

  const handleEdit = useCallback(
    (stockItem: StockItem) => {
      onView(stockItem.id);
    },
    [onView]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
        success(t('stock.notifications.deleted', 'Stock Item Deleted'), t('stock.notifications.deletedMessage', 'Stock item has been deleted successfully'));
      } catch (err) {
        error(t('stock.notifications.deleteFailed', 'Delete Failed'), err instanceof Error ? err.message : t('stock.notifications.deleteError', 'Failed to delete stock item'));
      }
    },
    [onDelete, success, error, t]
  );

  const handleSearch = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, search: value || undefined });
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        status: value ? (value as StockItemStatus) : undefined,
      });
    },
    [filters, onFiltersChange]
  );

  const handleTableChange = useCallback<NonNullable<TableProps<StockItem>['onChange']>>(
    (pag, tableFilters, sorter) => {
      // Handle sorting
      if (sorter && !Array.isArray(sorter) && sorter.field) {
        const sortByField = sorter.field as string;
        const sortOrderValue = sorter.order === 'ascend' ? 'ASC' : sorter.order === 'descend' ? 'DESC' : undefined;

        if (sortOrderValue) {
          onFiltersChange({
            ...filters,
            sortBy: sortByField as 'name' | 'currentQuantity' | 'status' | 'createdAt' | 'updatedAt',
            sortOrder: sortOrderValue,
          });
        } else {
          // Clear sorting
          const { sortBy: _sortBy, sortOrder: _sortOrder, ...restFilters } = filters;
          onFiltersChange(restFilters);
        }
      }

      // Handle pagination via onTableChange
      onTableChange({ current: pag.current ?? 1, pageSize: pag.pageSize ?? 10 }, tableFilters, sorter);
    },
    [filters, onFiltersChange, onTableChange]
  );

  const columns = useMemo(
    () => [
      {
        title: t('stock.list.name'),
        dataIndex: 'name',
        key: 'name',
        sorter: true,
        sortOrder: getSortOrder(filters.sortBy, filters.sortOrder, 'name'),
      },
      {
        title: t('stock.list.unit'),
        dataIndex: 'unitOfMeasure',
        key: 'unitOfMeasure',
      },
      {
        title: t('stock.list.currentQuantity'),
        dataIndex: 'currentQuantity',
        key: 'currentQuantity',
        sorter: true,
        sortOrder: getSortOrder(filters.sortBy, filters.sortOrder, 'currentQuantity'),
        render: (quantity: number, record: StockItem) =>
          `${quantity} ${record.unitOfMeasure}`,
      },
      {
        title: t('stock.list.reorderThreshold'),
        dataIndex: 'reorderThreshold',
        key: 'reorderThreshold',
        render: (threshold: number | null, record: StockItem) =>
          threshold !== null ? `${threshold} ${record.unitOfMeasure}` : t('common.na'),
      },
      {
        title: t('common.status.label'),
        dataIndex: 'status',
        key: 'status',
        sorter: true,
        sortOrder: getSortOrder(filters.sortBy, filters.sortOrder, 'status'),
        render: (status: StockItemStatus) => (
          <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
        ),
      },
      {
        title: t('common.table.actions'),
        key: 'actions',
        render: (_: unknown, record: StockItem) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onView(record.id)}
              size="small"
            >
              {t('common.actions.view')}
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            >
              {t('common.actions.edit')}
            </Button>
            <Popconfirm
              title={t('stock.list.deleteTitle')}
              description={t('stock.list.deleteConfirm')}
              onConfirm={() => handleDelete(record.id)}
              okText={t('common.confirm.yes')}
              cancelText={t('common.confirm.no')}
            >
              <Button type="link" danger icon={<DeleteOutlined />} size="small">
                {t('common.actions.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [t, filters.sortBy, filters.sortOrder, getStatusLabel, onView, handleEdit, handleDelete]
  );

  return (
    <div>
      <PageHeader
        title={t('stock.items.title')}
        subtitle={t('stock.items.subtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick}>
            {t('stock.items.add')}
          </Button>
        }
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Search
            placeholder={t('stock.list.searchPlaceholder')}
            allowClear
            onSearch={handleSearch}
            defaultValue={filters.search}
            style={{ width: '100%' }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder={t('stock.list.filterByStatus')}
            style={{ width: '100%' }}
            value={filters.status || ''}
            onChange={handleStatusChange}
            options={statusOptions}
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={stockItems}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => t('common.pagination.total', { total }),
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={handleTableChange}
      />
    </div>
  );
};
