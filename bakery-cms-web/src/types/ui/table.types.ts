import type { TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';

export interface TableState<T> {
  pagination: TablePaginationConfig;
  filters: Record<string, FilterValue | null>;
  sorter: SorterResult<T> | SorterResult<T>[];
}

export interface TableParams {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
  filters?: Record<string, any>;
}
