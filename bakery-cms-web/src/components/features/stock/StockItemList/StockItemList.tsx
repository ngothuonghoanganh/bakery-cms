/**
 * StockItemList orchestrator component
 * Coordinates stock item table, form, and filters
 */

import React, { useCallback, useMemo } from 'react';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Grid,
  Input,
  List,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared';
import { useNotification } from '../../../../hooks/useNotification';
import { useCrudErrorNotification } from '../../../../hooks/useCrudErrorNotification';
import { StockItemStatus } from '../../../../types/models/stock.model';
import type { StockItem } from '../../../../types/models/stock.model';
import type { StockItemListProps } from './StockItemList.types';
import { formatCurrency, formatDateTime } from '@/utils/format.utils';

const { Search } = Input;
const { Text } = Typography;
const { useBreakpoint } = Grid;
type MenuItem = Exclude<MenuProps['items'], undefined>[number];

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
  onEdit,
  onReceiveWithPricing,
}) => {
  const { t } = useTranslation();
  const { success } = useNotification();
  const { showCrudError } = useCrudErrorNotification();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

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
      if (onEdit) {
        onEdit(stockItem);
        return;
      }
      onView(stockItem.id);
    },
    [onEdit, onView]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
        success(t('stock.notifications.deleted'), t('stock.notifications.deletedMessage'));
      } catch (err) {
        showCrudError(err);
      }
    },
    [onDelete, showCrudError, success, t]
  );

  const confirmDelete = useCallback(
    (record: StockItem) => {
      Modal.confirm({
        title: t('stock.list.deleteTitle'),
        content: t('stock.list.deleteConfirm'),
        okText: t('common.confirm.yes'),
        cancelText: t('common.confirm.no'),
        okButtonProps: { danger: true },
        onOk: () => handleDelete(record.id),
      });
    },
    [handleDelete, t]
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

  const renderNameCell = useCallback(
    (record: StockItem) => (
      <Space direction="vertical" size={0}>
        <Text strong>{record.name}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('stock.list.unitAndBaseUnit', {
            unit: record.unitOfMeasure,
            baseUnit: record.baseUnit,
          })}
        </Text>
      </Space>
    ),
    [t]
  );

  const renderStockCell = useCallback(
    (record: StockItem) => (
      <Space direction="vertical" size={4}>
        <Text>
          {record.currentQuantity} {record.unitOfMeasure}
        </Text>
        <Tag color={getStatusColor(record.status)} style={{ width: 'fit-content' }}>
          {getStatusLabel(record.status)}
        </Tag>
      </Space>
    ),
    [getStatusLabel]
  );

  const renderPriceCell = useCallback(
    (record: StockItem) => {
      const summary = record.priceSummary;
      const hasPrice = Boolean(
        summary?.hasPrice &&
          summary?.latestUnitPriceAfterTax !== null &&
          summary?.latestUnitPriceAfterTax !== undefined
      );
      const unitPriceAfterTax = summary?.latestUnitPriceAfterTax ?? null;
      const brandName = summary?.latestPriceBrandName || summary?.preferredBrandName || null;
      const latestReceivedAt = summary?.latestReceivedAt ?? null;

      return (
        <Space direction="vertical" size={2}>
          {hasPrice && unitPriceAfterTax !== null ? (
            <Text strong>
              {formatCurrency(unitPriceAfterTax)} / {record.baseUnit}
            </Text>
          ) : (
            <Tag color="default" style={{ width: 'fit-content' }}>
              {t('stock.list.noPrice')}
            </Tag>
          )}

          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('stock.list.priceInfo', {
              brand: brandName || t('common.na'),
              latestReceiving: latestReceivedAt
                ? formatDateTime(latestReceivedAt, 'YYYY-MM-DD HH:mm')
                : t('stock.list.latestReceivingEmpty'),
            })}
          </Text>
        </Space>
      );
    },
    [t]
  );

  const handleReceiveClick = useCallback(
    (id: string) => {
      if (onReceiveWithPricing) {
        onReceiveWithPricing(id);
        return;
      }
      onView(id);
    },
    [onReceiveWithPricing, onView]
  );

  const buildRowMenuItems = useCallback(
    (record: StockItem): MenuProps['items'] => {
      const items: Array<MenuItem | null> = [
        onEdit
          ? {
              key: 'edit',
              icon: <EditOutlined />,
              label: t('common.actions.edit'),
              onClick: () => handleEdit(record),
            }
          : null,
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          danger: true,
          label: t('common.actions.delete'),
          onClick: () => confirmDelete(record),
        },
      ];

      return items.filter((item): item is NonNullable<typeof item> => Boolean(item));
    },
    [confirmDelete, handleEdit, onEdit, t]
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

  const columns = useMemo<ColumnsType<StockItem>>(
    () => [
      {
        title: t('stock.list.name'),
        key: 'name',
        sorter: true,
        sortOrder: getSortOrder(filters.sortBy, filters.sortOrder, 'name'),
        render: (_: unknown, record: StockItem) => renderNameCell(record),
      },
      {
        title: t('stock.list.currentQuantity'),
        key: 'stock',
        sorter: true,
        sortOrder: getSortOrder(filters.sortBy, filters.sortOrder, 'currentQuantity'),
        render: (_: unknown, record: StockItem) => renderStockCell(record),
      },
      {
        title: t('stock.list.currentPrice'),
        key: 'price',
        render: (_: unknown, record: StockItem) => renderPriceCell(record),
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
        responsive: ['lg'],
      },
      {
        title: t('common.table.actions'),
        key: 'actions',
        width: 220,
        render: (_: unknown, record: StockItem) => {
          return (
            <Space size="small" wrap={false}>
              <Button
                type="primary"
                size="small"
                onClick={() => handleReceiveClick(record.id)}
              >
                {t('stock.list.receiveWithPricing')}
              </Button>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onView(record.id)}
              >
                {t('common.actions.view')}
              </Button>
              <Dropdown
                menu={{ items: buildRowMenuItems(record) }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [
      confirmDelete,
      filters.sortBy,
      filters.sortOrder,
      getStatusLabel,
      handleEdit,
      handleReceiveClick,
      onEdit,
      onView,
      buildRowMenuItems,
      renderNameCell,
      renderPriceCell,
      renderStockCell,
      t,
    ]
  );

  const renderMobileItem = useCallback(
    (record: StockItem) => (
      <Card
        size="small"
        style={{ width: '100%' }}
        title={renderNameCell(record)}
        extra={
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            menu={{
              items: buildRowMenuItems(record),
            }}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        }
      >
        <Row gutter={[12, 8]}>
          <Col xs={24} sm={12}>
            <Text type="secondary">{t('stock.list.currentQuantity')}</Text>
            <div>{renderStockCell(record)}</div>
          </Col>
          <Col xs={24} sm={12}>
            <Text type="secondary">{t('stock.list.currentPrice')}</Text>
            <div>{renderPriceCell(record)}</div>
          </Col>
          <Col xs={24}>
            <Row gutter={8}>
              <Col xs={24} sm={12}>
                <Button block type="primary" onClick={() => handleReceiveClick(record.id)}>
                  {t('stock.list.receiveWithPricing')}
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button block onClick={() => onView(record.id)}>
                  {t('common.actions.view')}
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    ),
    [
      confirmDelete,
      handleEdit,
      handleReceiveClick,
      onEdit,
      onView,
      renderNameCell,
      renderPriceCell,
      renderStockCell,
      t,
    ]
  );

  return (
    <div>
      <PageHeader
        title={t('stock.items.title')}
        subtitle={t('stock.items.subtitle')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateClick} block={isMobile}>
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

      {isMobile ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {stockItems.length === 0 && !loading ? (
            <Card>
              <Empty description={t('stock.list.empty')} />
            </Card>
          ) : (
            <List
              dataSource={stockItems}
              loading={loading}
              renderItem={(item) => <List.Item style={{ padding: 0 }}>{renderMobileItem(item)}</List.Item>}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              showSizeChanger
              pageSizeOptions={['10', '20', '50', '100']}
              showTotal={(total) => t('common.pagination.total', { total })}
              onChange={(page, pageSize) => onTableChange({ current: page, pageSize }, {}, {})}
              onShowSizeChange={(page, pageSize) => onTableChange({ current: page, pageSize }, {}, {})}
            />
          </div>
        </Space>
      ) : (
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
          scroll={{ x: 900 }}
        />
      )}
    </div>
  );
};
