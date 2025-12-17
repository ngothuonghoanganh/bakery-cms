import type { ProductFilters } from '../../../../types/models/product.model';

export interface ProductFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onReset: () => void;
  loading?: boolean;
}
