/**
 * Shared components index
 */

// Layout components
export { DashboardLayout } from './DashboardLayout/DashboardLayout';
export type { DashboardLayoutProps } from './DashboardLayout/DashboardLayout.types';

export { Sidebar } from './Sidebar/Sidebar';
export type { SidebarProps } from './Sidebar/Sidebar.types';

export { Header } from './Header/Header';
export type { HeaderProps } from './Header/Header.types';

// Data display components
export { DataTable } from './DataTable/DataTable';
export type { DataTableProps } from './DataTable/DataTable.types';

export { StatusBadge } from './StatusBadge/StatusBadge';
export type { StatusBadgeProps, StatusType } from './StatusBadge/StatusBadge.types';

export { PageHeader } from './PageHeader/PageHeader';
export type { PageHeaderProps } from './PageHeader/PageHeader.types';

export { FilterPanel } from './FilterPanel/FilterPanel';
export type { FilterPanelProps } from './FilterPanel/FilterPanel.types';

export { EmptyState } from './EmptyState/EmptyState';
export type { EmptyStateProps } from './EmptyState/EmptyState.types';

export { ErrorBoundary } from './ErrorBoundary';

export { LoadingSpinner } from './LoadingSpinner/LoadingSpinner';
export type { LoadingSpinnerProps } from './LoadingSpinner/LoadingSpinner.types';

// File upload component
export { FileUpload } from './FileUpload';
export type { FileUploadProps } from './FileUpload';

// Legacy components (to be migrated/removed)
export { Navigation } from './Navigation/Navigation';
export { ProductCard } from './ProductCard/ProductCard';
export { OrderSummary } from './OrderSummary/OrderSummary';
export { PaymentQR } from './PaymentQR/PaymentQR';
