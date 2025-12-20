import React from 'react';
import { AntTable } from '../../core';
import type { DataTableProps } from './DataTable.types';

export const DataTable = <T extends object>({
  pagination = {
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `Total ${total} items`,
  },
  ...props
}: DataTableProps<T>): React.ReactElement => {
  return <AntTable {...props} pagination={pagination} scroll={{ x: 'max-content' }} />;
};
