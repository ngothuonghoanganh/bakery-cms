import type { ColumnsType } from 'antd/es/table';
import type { Product } from '../../../../types/models/product.model';

export interface ProductTableProps {
  products: Product[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onTableChange?: (pagination: any, filters: any, sorter: any) => void;
}

export type ProductColumn = ColumnsType<Product>;
