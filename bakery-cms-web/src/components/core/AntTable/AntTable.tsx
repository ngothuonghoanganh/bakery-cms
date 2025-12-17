import { Table } from 'antd';
import type { AntTableProps } from './AntTable.types';

export const AntTable = <T extends object>(props: AntTableProps<T>): React.ReactElement => {
  return <Table<T> {...props} />;
};
