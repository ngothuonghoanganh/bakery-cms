import { useState, useCallback } from 'react';
import type { TablePaginationConfig } from 'antd';
import type { SorterResult, FilterValue } from 'antd/es/table/interface';

interface UseTableParams {
  initialPageSize?: number;
}

interface UseTableReturn<T> {
  pagination: TablePaginationConfig;
  filters: Record<string, FilterValue | null>;
  sorter: SorterResult<T> | SorterResult<T>[];
  handleTableChange: (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[]
  ) => void;
  resetTable: () => void;
}

export const useTable = <T extends object>({
  initialPageSize = 10,
}: UseTableParams = {}): UseTableReturn<T> => {
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: initialPageSize,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `Total ${total} items`,
  });

  const [filters, setFilters] = useState<Record<string, FilterValue | null>>({});
  const [sorter, setSorter] = useState<SorterResult<T> | SorterResult<T>[]>({});

  const handleTableChange = useCallback(
    (
      newPagination: TablePaginationConfig,
      newFilters: Record<string, FilterValue | null>,
      newSorter: SorterResult<T> | SorterResult<T>[]
    ) => {
      setPagination(newPagination);
      setFilters(newFilters);
      setSorter(newSorter);
    },
    []
  );

  const resetTable = useCallback(() => {
    setPagination({
      current: 1,
      pageSize: initialPageSize,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total) => `Total ${total} items`,
    });
    setFilters({});
    setSorter({});
  }, [initialPageSize]);

  return {
    pagination,
    filters,
    sorter,
    handleTableChange,
    resetTable,
  };
};
