# Implementation Plan: Ant Design CMS Frontend

**Branch**: `003-antd-cms-frontend` | **Date**: December 17, 2025 | **Spec**: [specification.md](./specification.md)
**Input**: Feature specification from `/specs/003-antd-cms-frontend/specification.md`

**Note**: This plan follows the Implementation Planning Workflow from `.github/prompts/speckit.plan.prompt.md`

## Summary

Transform the Bakery CMS frontend into a professional admin interface using Ant Design component library. Implement a comprehensive dashboard layout with sidebar navigation, data tables with filtering/sorting/pagination for Products, Orders, and Payments management. Support CRUD operations through modal forms, responsive design for all devices, theme customization (light/dark mode), and maintain functional programming patterns with TypeScript strict mode throughout.

**Primary Requirements**:
- Professional CMS dashboard with Ant Design components
- Product, Order, and Payment management interfaces with advanced data tables
- Responsive layout with collapsible sidebar for mobile
- Form validation using Zod schemas
- Theme support (light/dark mode) with Zustand state management
- Type-safe API integration with domain model mapping

**Technical Approach**:
- Ant Design 5.x for UI components (selected for enterprise-grade CMS features)
- Zustand for lightweight global state (auth, theme, notifications)
- React Router v6 for routing with code splitting
- Axios for type-safe API communication with interceptors
- Functional component architecture (Core/Shared/Feature layers)
- Custom hooks for reusable business logic
- Result type pattern for error handling

## Technical Context

**Language/Version**: TypeScript 5.9.3 with React 19.2.0  
**Primary Dependencies**: Ant Design 5.12.0, Zustand 4.4.7, Axios 1.6.2, React Router DOM 6.20.1, Zod 3.22.4  
**Storage**: N/A (frontend only - API communication with bakery-cms-api backend)  
**Testing**: Vitest 1.0.4 with React Testing Library 14.1.2, @vitest/coverage-v8 for coverage  
**Target Platform**: Web Browser (Chrome, Firefox, Safari, Edge - modern browsers)
**Project Type**: Frontend SPA (Single Page Application) - React with Vite bundler  
**Performance Goals**: 
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90
- Bundle size < 500KB (main chunk)
**Constraints**: 
- Functional programming only (no class components)
- TypeScript strict mode enabled
- 80%+ test coverage required
- Component architecture: Core/Shared/Feature layers mandatory
- API response to domain model mapping required
**Scale/Scope**: 
- 20+ components (10 core, 5 shared, 10+ feature)
- 3 main features (Products, Orders, Payments)
- 7 pages (Dashboard, Products, ProductDetail, Orders, OrderDetail, Payments, Auth)
- 7 custom hooks
- 3 Zustand stores
- 3 service modules with mappers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Frontend Constitution Gates

#### ✅ React Functional Components Only
- [x] No class components (all functional)
- [x] Use React Hooks for state and lifecycle
- [x] Pure functional components when possible
- **Status**: PASS - All components designed as functional

#### ✅ Component Architecture (Core/Shared/Feature)
- [x] Core components: Atomic UI wrappers (AntButton, AntTable, etc.)
- [x] Shared components: Composite reusable (DashboardLayout, DataTable, etc.)
- [x] Feature components: Feature-specific with business logic
- [x] Clear separation maintained
- **Status**: PASS - Three-layer architecture followed

#### ✅ Functional Programming Principles
- [x] Immutable state updates (using spread operators)
- [x] Pure functions where possible
- [x] Custom hooks for reusability
- [x] No external state mutation
- [x] Function composition patterns
- **Status**: PASS - Functional paradigm enforced

#### ✅ TypeScript Strict Mode
- [x] `strict: true` in tsconfig.json
- [x] `noImplicitAny: true`
- [x] `strictNullChecks: true`
- [x] No `any` types (except documented edge cases)
- [x] Explicit return types on functions
- [x] Prefer `type` over `interface`
- **Status**: PASS - TypeScript strict configuration required

#### ✅ API Response Mapping
- [x] API response types defined (`types/api/`)
- [x] Domain model types defined (`types/models/`)
- [x] Mapper functions created (`types/mappers/`)
- [x] Service layer handles all mapping
- [x] No snake_case in domain models
- **Status**: PASS - Complete mapping layer designed

#### ✅ Axios HTTP Client
- [x] Axios configured with interceptors
- [x] Request interceptor for auth tokens
- [x] Response interceptor for error handling
- [x] Type-safe service functions
- [x] Result type for error handling
- **Status**: PASS - Type-safe API client configured

#### ✅ State Management
- [x] Zustand for global state (lightweight)
- [x] Local state with useState for components
- [x] Custom hooks for data fetching
- [x] Immutable state updates
- **Status**: PASS - Appropriate state management selected

#### ✅ Testing Requirements
- [x] Unit test coverage target: ≥ 80%
- [x] React Testing Library for components
- [x] Vitest as test runner
- [x] Coverage reporting configured
- **Status**: PASS - Testing strategy defined

#### ✅ Yarn Package Manager
- [x] Using Yarn (Berry/v3+) as per constitution
- [x] Consistent with backend repository
- **Status**: PASS - Yarn already in use

#### ✅ Security & Best Practices
- [x] No secrets in code (use environment variables)
- [x] Auth tokens in localStorage with proper handling
- [x] CORS handling via API interceptors
- [x] Input validation with Zod schemas
- **Status**: PASS - Security practices followed

### Constitution Compliance Summary

**All Gates**: ✅ PASSED  
**Violations**: None  
**Justifications Required**: None

The implementation fully complies with the Frontend Constitution requirements. All components follow the functional programming paradigm, maintain the three-layer architecture, use TypeScript strict mode, and implement proper API response mapping.

## Project Structure

### Documentation (this feature)

```text
specs/003-antd-cms-frontend/
├── plan.md              # This file (implementation plan)
├── specification.md     # Complete feature specification
├── data-model.md        # Frontend data types and models (Phase 1 output)
├── quickstart.md        # Testing guide (Phase 1 output)
└── contracts/           # N/A for frontend (no API contracts generated)
```

### Source Code (Frontend Repository: bakery-cms-web)

```text
bakery-cms-web/
├── src/
│   ├── components/
│   │   ├── core/                          # NEW: Atomic Ant Design wrappers
│   │   │   ├── index.ts
│   │   │   ├── AntButton/
│   │   │   │   ├── AntButton.tsx
│   │   │   │   ├── AntButton.types.ts
│   │   │   │   └── AntButton.test.tsx
│   │   │   ├── AntInput/
│   │   │   ├── AntTable/
│   │   │   ├── AntModal/
│   │   │   ├── AntDrawer/
│   │   │   ├── AntForm/
│   │   │   ├── AntCard/
│   │   │   ├── AntTag/
│   │   │   └── AntBadge/
│   │   │
│   │   ├── shared/                        # UPDATED: Add new composite components
│   │   │   ├── index.ts
│   │   │   ├── Navigation/                # EXISTS: Keep existing
│   │   │   ├── OrderSummary/              # EXISTS: Keep existing
│   │   │   ├── PaymentQR/                 # EXISTS: Keep existing
│   │   │   ├── ProductCard/               # EXISTS: Keep existing
│   │   │   ├── DashboardLayout/           # NEW: Main dashboard layout
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   ├── DashboardLayout.types.ts
│   │   │   │   ├── components/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   └── DashboardLayout.test.tsx
│   │   │   ├── PageHeader/                # NEW: Page header with breadcrumbs
│   │   │   ├── DataTable/                 # NEW: Reusable table component
│   │   │   ├── FormModal/                 # NEW: Modal form wrapper
│   │   │   ├── StatusBadge/               # NEW: Status indicators
│   │   │   ├── PriceDisplay/              # NEW: Currency formatter
│   │   │   ├── EmptyState/                # NEW: Empty state component
│   │   │   └── ErrorBoundary/             # NEW: Error boundary wrapper
│   │   │
│   │   └── features/                      # UPDATED: Add new feature components
│   │       ├── products/                  # NEW: Product management
│   │       │   ├── ProductList/
│   │       │   ├── ProductTable/
│   │       │   ├── ProductForm/
│   │       │   ├── ProductDetail/
│   │       │   └── ProductFilters/
│   │       ├── orders/                    # NEW: Order management
│   │       │   ├── OrderList/
│   │       │   ├── OrderTable/
│   │       │   ├── OrderForm/
│   │       │   ├── OrderDetail/
│   │       │   ├── OrderStatusUpdater/
│   │       │   └── OrderFilters/
│   │       └── payments/                  # NEW: Payment management
│   │           ├── PaymentList/
│   │           ├── PaymentTable/
│   │           ├── PaymentDetail/
│   │           ├── QRCodeGenerator/
│   │           └── PaymentFilters/
│   │
│   ├── pages/                             # UPDATED: Restructure pages
│   │   ├── HomePage.tsx                   # EXISTS: Update to use DashboardLayout
│   │   ├── ProductsPage.tsx               # EXISTS: Major refactor with ProductTable
│   │   ├── OrdersPage.tsx                 # EXISTS: Major refactor with OrderTable
│   │   ├── Dashboard/                     # NEW: Dashboard page
│   │   │   └── DashboardPage.tsx
│   │   ├── Products/                      # NEW: Product detail page
│   │   │   └── ProductDetailPage.tsx
│   │   ├── Orders/                        # NEW: Order detail page
│   │   │   └── OrderDetailPage.tsx
│   │   └── Payments/                      # NEW: Payment pages
│   │       ├── PaymentsPage.tsx
│   │       └── PaymentDetailPage.tsx
│   │
│   ├── hooks/                             # UPDATED: Add new custom hooks
│   │   ├── useProducts.ts                 # EXISTS: Enhance with filters
│   │   ├── useOrders.ts                   # EXISTS: Enhance with filters
│   │   ├── usePayments.ts                 # NEW: Payment data fetching
│   │   ├── useNotification.ts             # NEW: Notification hook
│   │   ├── useModal.ts                    # NEW: Modal state management
│   │   ├── useTable.ts                    # NEW: Table state management
│   │   └── useTheme.ts                    # NEW: Theme management
│   │
│   ├── stores/                            # NEW: Zustand stores
│   │   ├── index.ts
│   │   ├── authStore.ts                   # NEW: Authentication state
│   │   ├── themeStore.ts                  # NEW: Theme preferences
│   │   └── notificationStore.ts           # NEW: Notification state
│   │
│   ├── services/                          # EXISTS: Keep and enhance
│   │   ├── index.ts                       # UPDATED: Re-export all services
│   │   ├── product.service.ts             # EXISTS: Enhance with Result type
│   │   ├── order.service.ts               # EXISTS: Enhance with Result type
│   │   ├── payment.service.ts             # EXISTS: Enhance with Result type
│   │   └── api/
│   │       └── client.ts                  # EXISTS: Enhance with interceptors
│   │
│   ├── types/                             # EXISTS: Keep and reorganize
│   │   ├── api/                           # EXISTS: Keep existing API types
│   │   │   ├── product.api.ts
│   │   │   ├── order.api.ts
│   │   │   └── payment.api.ts
│   │   ├── models/                        # EXISTS: Keep existing models
│   │   │   ├── product.model.ts
│   │   │   ├── order.model.ts
│   │   │   └── payment.model.ts
│   │   ├── mappers/                       # EXISTS: Keep existing mappers
│   │   │   ├── product.mapper.ts
│   │   │   ├── order.mapper.ts
│   │   │   └── payment.mapper.ts
│   │   ├── common/                        # EXISTS: Keep existing common types
│   │   │   ├── error.types.ts
│   │   │   └── result.types.ts
│   │   └── ui/                            # NEW: UI-specific types
│   │       ├── table.types.ts
│   │       ├── form.types.ts
│   │       └── theme.types.ts
│   │
│   ├── utils/                             # EXISTS: Keep existing utilities
│   │   ├── error-handler.ts
│   │   ├── format.ts                      # NEW: Formatting utilities
│   │   ├── validation.ts                  # NEW: Validation helpers
│   │   └── date.ts                        # NEW: Date utilities
│   │
│   ├── config/                            # NEW: Configuration files
│   │   ├── theme.config.ts                # NEW: Ant Design theme config
│   │   ├── routes.config.ts               # NEW: Route configuration
│   │   └── antd.config.ts                 # NEW: Ant Design setup
│   │
│   ├── styles/                            # NEW: Global styles
│   │   ├── variables.less                 # NEW: LESS variables
│   │   ├── antd-overrides.less            # NEW: Ant Design overrides
│   │   └── global.css                     # UPDATED: Add Ant Design imports
│   │
│   ├── App.tsx                            # EXISTS: Major refactor with ConfigProvider
│   ├── App.css                            # EXISTS: Update with Ant Design styles
│   ├── main.tsx                           # EXISTS: Keep existing entry point
│   └── index.css                          # EXISTS: Update with Ant Design imports
│
├── tests/                                 # EXISTS: Expand test coverage
│   ├── setup.ts                           # EXISTS: Update with Ant Design mocks
│   ├── components/                        # NEW: Component tests
│   ├── hooks/                             # NEW: Hook tests
│   └── integration/                       # NEW: Integration tests
│
├── public/
│   └── assets/                            # EXISTS: Keep existing assets
│
├── package.json                           # UPDATED: Add Ant Design dependencies
├── vite.config.ts                         # UPDATED: Add LESS support
├── tsconfig.json                          # EXISTS: Verify strict mode enabled
├── tsconfig.app.json                      # EXISTS: Keep existing
├── tsconfig.node.json                     # EXISTS: Keep existing
├── vitest.config.ts                       # EXISTS: Keep existing
├── eslint.config.js                       # EXISTS: Keep existing
└── README.md                              # UPDATED: Add Ant Design setup docs
```

**Structure Decision**: Frontend Web Application structure selected. This is a React SPA using Vite as the bundler. The implementation adds Ant Design components while maintaining the existing functional programming architecture. The three-layer component architecture (Core/Shared/Feature) is strictly enforced. Existing components in `shared/` are preserved and enhanced, while new feature-specific components are added under `features/`. The structure supports code splitting, lazy loading, and maintainable organization by feature domain.

## Complexity Tracking

> **No Constitution Violations**

All constitution checks passed. No complexity tracking required. The implementation fully adheres to:
- Functional programming paradigm
- TypeScript strict mode
- Three-layer component architecture
- API response mapping patterns
- Immutable state updates
- 80%+ test coverage target

---

## Implementation Steps

### Step 1: Dependencies & Configuration Setup

**Objective**: Install Ant Design and related dependencies, configure theme system

**Files to Create/Modify**:

1. **package.json** - Add dependencies
```json
{
  "dependencies": {
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "zod": "^3.22.4",
    "dayjs": "^1.11.10"
  },
  "devDependencies": {
    "less": "^4.2.0",
    "@types/node": "^24.10.1"
  }
}
```

2. **vite.config.ts** - Add LESS support
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-antd': ['antd', '@ant-design/icons'],
          'vendor-utils': ['axios', 'zustand', 'zod'],
        },
      },
    },
  },
});
```

3. **src/config/theme.config.ts** - Ant Design theme configuration
```typescript
import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    fontSize: 14,
    borderRadius: 6,
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
      bodyBg: '#f0f2f5',
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
  },
};
```

4. **src/config/routes.config.ts** - Route configuration
```typescript
import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import {
  DashboardOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const PaymentsPage = lazy(() => import('@/pages/Payments/PaymentsPage'));

export type RouteConfig = RouteObject & {
  title?: string;
  icon?: React.ReactNode;
  hideInMenu?: boolean;
};

export const routes: RouteConfig[] = [
  {
    path: '/',
    title: 'Dashboard',
    icon: <DashboardOutlined />,
    element: <DashboardPage />,
  },
  {
    path: '/products',
    title: 'Products',
    icon: <ShoppingOutlined />,
    element: <ProductsPage />,
  },
  {
    path: '/orders',
    title: 'Orders',
    icon: <FileTextOutlined />,
    element: <OrdersPage />,
  },
  {
    path: '/payments',
    title: 'Payments',
    icon: <CreditCardOutlined />,
    element: <PaymentsPage />,
  },
];
```

**Commands**:
```bash
cd bakery-cms-web
yarn add antd@^5.12.0 @ant-design/icons@^5.2.6 zod@^3.22.4 dayjs@^1.11.10
yarn add -D less@^4.2.0
```

---

### Step 2: Zustand Stores Setup

**Objective**: Create global state management for auth, theme, and notifications

**Files to Create**:

1. **src/stores/themeStore.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

type ThemeStore = {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleTheme: () =>
        set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
```

2. **src/stores/authStore.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthStore = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        // TODO: Implement actual login logic
        // For now, mock implementation
        const mockUser = { id: '1', email, name: 'Admin', role: 'admin' };
        const mockToken = 'mock-token';
        set({ user: mockUser, token: mockToken, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      setUser: (user, token) => {
        localStorage.setItem('auth_token', token);
        set({ user, token, isAuthenticated: true });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

3. **src/stores/notificationStore.ts**
```typescript
import { create } from 'zustand';
import { notification } from 'antd';
import type { NotificationArgsProps } from 'antd';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

type NotificationStore = {
  show: (type: NotificationType, message: string, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
};

export const useNotificationStore = create<NotificationStore>(() => ({
  show: (type, message, description) => {
    notification[type]({
      message,
      description,
      placement: 'topRight',
      duration: 3,
    });
  },
  
  success: (message, description) => {
    notification.success({
      message,
      description,
      placement: 'topRight',
    });
  },
  
  error: (message, description) => {
    notification.error({
      message,
      description,
      placement: 'topRight',
    });
  },
  
  warning: (message, description) => {
    notification.warning({
      message,
      description,
      placement: 'topRight',
    });
  },
  
  info: (message, description) => {
    notification.info({
      message,
      description,
      placement: 'topRight',
    });
  },
}));
```

4. **src/stores/index.ts**
```typescript
export { useThemeStore, type ThemeMode } from './themeStore';
export { useAuthStore } from './authStore';
export { useNotificationStore } from './notificationStore';
```

---

### Step 3: Core Components (Ant Design Wrappers)

**Objective**: Create atomic wrapper components for Ant Design components

**Files to Create** (showing key examples):

1. **src/components/core/AntButton/AntButton.tsx**
```typescript
import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import type { AntButtonProps } from './AntButton.types';

export const AntButton = ({ children, ...props }: AntButtonProps): JSX.Element => {
  return <Button {...props}>{children}</Button>;
};
```

2. **src/components/core/AntButton/AntButton.types.ts**
```typescript
import type { ButtonProps } from 'antd';

export type AntButtonProps = ButtonProps & {
  children: React.ReactNode;
};
```

3. **src/components/core/AntTable/AntTable.tsx**
```typescript
import { Table } from 'antd';
import type { TableProps } from 'antd';

export const AntTable = <T extends object>(props: TableProps<T>): JSX.Element => {
  return <Table {...props} />;
};
```

4. **src/components/core/AntModal/AntModal.tsx**
```typescript
import { Modal } from 'antd';
import type { ModalProps } from 'antd';

export const AntModal = ({ children, ...props }: ModalProps): JSX.Element => {
  return <Modal {...props}>{children}</Modal>;
};
```

5. **src/components/core/index.ts**
```typescript
export { AntButton } from './AntButton/AntButton';
export { AntTable } from './AntTable/AntTable';
export { AntModal } from './AntModal/AntModal';
export { AntDrawer } from './AntDrawer/AntDrawer';
export { AntForm } from './AntForm/AntForm';
export { AntCard } from './AntCard/AntCard';
export { AntTag } from './AntTag/AntTag';
export { AntBadge } from './AntBadge/AntBadge';
export { AntInput } from './AntInput/AntInput';

export type { AntButtonProps } from './AntButton/AntButton.types';
// ... other type exports
```

**Note**: Create similar wrapper components for Input, Form, Card, Tag, Badge, Drawer following the same pattern.

---

### Step 4: Shared Components

**Objective**: Create composite reusable components

**Key Files to Create**:

1. **src/components/shared/DashboardLayout/DashboardLayout.tsx**
```typescript
import { useState } from 'react';
import { Layout } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import type { DashboardLayoutProps } from './DashboardLayout.types';

const { Content } = Layout;

export const DashboardLayout = ({ children }: DashboardLayoutProps): JSX.Element => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        currentPath={location.pathname}
        onNavigate={navigate}
      />
      <Layout>
        <Header onToggleSidebar={() => setCollapsed(!collapsed)} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};
```

2. **src/components/shared/DataTable/DataTable.tsx**
```typescript
import { Table } from 'antd';
import type { ColumnType, TablePaginationConfig } from 'antd/es/table';
import type { DataTableProps } from './DataTable.types';

export const DataTable = <T extends { key: string }>({
  columns,
  data,
  loading,
  pagination,
  onRow,
  rowKey = 'key',
  ...restProps
}: DataTableProps<T>): JSX.Element => {
  return (
    <Table<T>
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onRow={onRow}
      rowKey={rowKey}
      scroll={{ x: 'max-content' }}
      {...restProps}
    />
  );
};
```

3. **src/components/shared/StatusBadge/StatusBadge.tsx**
```typescript
import { Tag } from 'antd';
import type { StatusBadgeProps } from './StatusBadge.types';
import { getStatusConfig } from './StatusBadge.utils';

export const StatusBadge = ({ status, type }: StatusBadgeProps): JSX.Element => {
  const config = getStatusConfig(status, type);
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.label}
    </Tag>
  );
};
```

4. **src/components/shared/PageHeader/PageHeader.tsx**
```typescript
import { PageHeader as AntPageHeader, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import type { PageHeaderProps } from './PageHeader.types';

export const PageHeader = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  extra,
}: PageHeaderProps): JSX.Element => {
  return (
    <AntPageHeader
      title={title}
      subTitle={subtitle}
      extra={actions}
      breadcrumb={
        breadcrumbs ? (
          <Breadcrumb>
            {breadcrumbs.map((crumb, index) => (
              <Breadcrumb.Item key={index}>
                {crumb.path ? <Link to={crumb.path}>{crumb.label}</Link> : crumb.label}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        ) : undefined
      }
    >
      {extra}
    </AntPageHeader>
  );
};
```

---

### Step 5: Custom Hooks

**Objective**: Create reusable data fetching and UI state hooks

**Files to Create**:

1. **src/hooks/useProducts.ts**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { productService } from '@/services';
import type { Product, ProductFilters, PaginatedResponse } from '@/types/models/product.model';
import type { PaginationParams } from '@/types/common/result.types';

type UseProductsReturn = {
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginationParams & { total: number };
  refetch: () => Promise<void>;
};

export const useProducts = (
  filters?: ProductFilters,
  initialPagination?: PaginationParams
): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationParams & { total: number }>({
    page: initialPagination?.page || 1,
    pageSize: initialPagination?.pageSize || 10,
    total: 0,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await productService.getProducts(filters, {
      page: pagination.page,
      pageSize: pagination.pageSize,
    });

    if (result.success) {
      setProducts(result.data.data);
      setPagination((prev) => ({
        ...prev,
        total: result.data.pagination.total,
      }));
    } else {
      setError(result.error.message);
    }

    setLoading(false);
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    pagination,
    refetch: fetchProducts,
  };
};
```

2. **src/hooks/useModal.ts**
```typescript
import { useState, useCallback } from 'react';

type ModalMode = 'create' | 'edit' | 'view';

type UseModalReturn<T> = {
  isOpen: boolean;
  mode: ModalMode;
  data: T | null;
  open: (mode: ModalMode, data?: T) => void;
  close: () => void;
};

export const useModal = <T = any>(): UseModalReturn<T> => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>('create');
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((newMode: ModalMode, newData?: T) => {
    setMode(newMode);
    setData(newData || null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    isOpen,
    mode,
    data,
    open,
    close,
  };
};
```

3. **src/hooks/useTable.ts**
```typescript
import { useState, useCallback } from 'react';

type UseTableReturn = {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  handleTableChange: (page: number, pageSize: number) => void;
};

export const useTable = (initialPage = 1, initialPageSize = 10): UseTableReturn => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleTableChange = useCallback((newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
  }, []);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    handleTableChange,
  };
};
```

4. **src/hooks/useNotification.ts**
```typescript
import { useNotificationStore } from '@/stores';

export const useNotification = () => {
  const { success, error, warning, info } = useNotificationStore();
  
  return {
    success,
    error,
    warning,
    info,
  };
};
```

---

### Step 6: Feature Components - Products

**Objective**: Create product management components

**Key Files to Create**:

1. **src/components/features/products/ProductTable/ProductTable.tsx**
```typescript
import { Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useProducts } from '@/hooks/useProducts';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/hooks/useNotification';
import { productService } from '@/services';
import type { Product } from '@/types/models/product.model';
import type { ColumnType } from 'antd/es/table';

export const ProductTable = (): JSX.Element => {
  const { products, loading, pagination, refetch } = useProducts();
  const modal = useModal<Product>();
  const { success, error } = useNotification();

  const handleDelete = async (id: string) => {
    const result = await productService.deleteProduct(id);
    if (result.success) {
      success('Product deleted successfully');
      refetch();
    } else {
      error('Failed to delete product', result.error.message);
    }
  };

  const columns: ColumnType<Product>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Cookies', value: 'cookies' },
        { text: 'Cakes', value: 'cakes' },
      ],
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toFixed(2)}`,
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} type="product" />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => modal.open('edit', record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete product?"
            description="Are you sure you want to delete this product?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => modal.open('create')}
        >
          Add Product
        </Button>
      </Space>
      
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        pagination={{
          current: pagination.page,
          pageSize: pagination.pageSize,
          total: pagination.total,
        }}
        rowKey="id"
      />
    </>
  );
};
```

2. **src/components/features/products/ProductForm/ProductForm.tsx**
```typescript
import { Form, Input, InputNumber, Select, Modal } from 'antd';
import { useEffect } from 'react';
import { productSchema } from '@/types/models/product.model';
import type { Product, CreateProductForm } from '@/types/models/product.model';

type ProductFormProps = {
  product?: Product;
  onSubmit: (data: CreateProductForm) => Promise<void>;
  onCancel: () => void;
  mode: 'create' | 'edit';
  visible: boolean;
  loading: boolean;
};

export const ProductForm = ({
  product,
  onSubmit,
  onCancel,
  mode,
  visible,
  loading,
}: ProductFormProps): JSX.Element => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (product && mode === 'edit') {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
    }
  }, [product, mode, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={mode === 'create' ? 'Add Product' : 'Edit Product'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'active',
          businessType: 'b2c',
        }}
      >
        <Form.Item
          name="name"
          label="Product Name"
          rules={[{ required: true, min: 2, max: 100 }]}
        >
          <Input placeholder="Enter product name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, min: 10, max: 500 }]}
        >
          <Input.TextArea rows={4} placeholder="Enter description" />
        </Form.Item>

        <Form.Item
          name="price"
          label="Price"
          rules={[{ required: true, type: 'number', min: 0.01 }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            prefix="$"
            min={0}
            step={0.01}
            placeholder="0.00"
          />
        </Form.Item>

        <Form.Item
          name="category"
          label="Category"
          rules={[{ required: true }]}
        >
          <Input placeholder="Enter category" />
        </Form.Item>

        <Form.Item
          name="businessType"
          label="Business Type"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="b2c">B2C</Select.Option>
            <Select.Option value="b2b">B2B</Select.Option>
            <Select.Option value="both">Both</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
            <Select.Option value="out_of_stock">Out of Stock</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="stockQuantity" label="Stock Quantity">
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
};
```

**Similar pattern for Orders and Payments feature components** (OrderTable, OrderForm, OrderDetail, PaymentTable, QRCodeGenerator, etc.)

---

### Step 7: Update App.tsx with Ant Design ConfigProvider

**Objective**: Integrate Ant Design theme system and routing

**File to Modify**:

**src/App.tsx**
```typescript
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, Spin } from 'antd';
import { useThemeStore } from '@/stores';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { routes } from '@/config/routes.config';
import { lightTheme, darkTheme } from '@/config/theme.config';

export const App = (): JSX.Element => {
  const { mode } = useThemeStore();

  return (
    <ConfigProvider
      theme={{
        ...( mode === 'dark' ? darkTheme : lightTheme),
        algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<Spin size="large" style={{ margin: '20px auto', display: 'block' }} />}>
          <Routes>
            <Route element={<DashboardLayout />}>
              {routes.map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
};
```

---

### Step 8: Unit Tests

**Objective**: Achieve 80%+ test coverage

**Test Files to Create** (examples):

1. **src/components/core/AntButton/AntButton.test.tsx**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AntButton } from './AntButton';

describe('AntButton', () => {
  it('renders with children', () => {
    render(<AntButton>Click me</AntButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<AntButton onClick={handleClick}>Click</AntButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies type prop', () => {
    render(<AntButton type="primary">Primary</AntButton>);
    expect(screen.getByRole('button')).toHaveClass('ant-btn-primary');
  });
});
```

2. **src/hooks/useProducts.test.ts**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';
import { productService } from '@/services';

jest.mock('@/services');

describe('useProducts', () => {
  it('fetches products on mount', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', price: 10 },
      { id: '2', name: 'Product 2', price: 20 },
    ];

    (productService.getProducts as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        data: mockProducts,
        pagination: { page: 1, pageSize: 10, total: 2 },
      },
    });

    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.products).toEqual(mockProducts);
    });
  });
});
```

3. **src/stores/themeStore.test.ts**
```typescript
import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from './themeStore';

describe('themeStore', () => {
  it('initializes with light mode', () => {
    const { result } = renderHook(() => useThemeStore());
    expect(result.current.mode).toBe('light');
  });

  it('toggles theme', () => {
    const { result } = renderHook(() => useThemeStore());
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.mode).toBe('dark');
    
    act(() => {
      result.current.toggleTheme();
    });
    
    expect(result.current.mode).toBe('light');
  });
});
```

**Create similar tests for**:
- All core components
- All custom hooks
- Zustand stores
- Feature components (ProductTable, OrderTable, etc.)
- Shared components (DataTable, StatusBadge, etc.)

---

## Testing Strategy

### Unit Tests
- **Target**: 80%+ coverage
- **Tools**: Vitest + React Testing Library
- **Scope**: All components, hooks, utilities, stores

### Component Tests
- User interaction scenarios
- State changes
- Props validation
- Error states

### Integration Tests
- Complete user flows (CRUD operations)
- API integration with mock server
- Navigation between pages
- Form submission workflows

### Test Commands
```bash
# Run all tests
yarn test

# Run with coverage
yarn test:coverage

# Run in watch mode
yarn test:watch

# Run UI mode
yarn test:ui
```

---

## Performance Optimization

1. **Code Splitting**: Lazy load pages with React.lazy()
2. **Bundle Analysis**: Manual chunks for vendors
3. **Memoization**: useMemo/useCallback for expensive operations
4. **Virtual Scrolling**: For large tables (> 1000 rows)
5. **Image Optimization**: Lazy loading with native loading="lazy"

---

## Quality Checklist

Before marking complete:

- [ ] All dependencies installed and configured
- [ ] Ant Design theme system working
- [ ] Zustand stores implemented
- [ ] Core components created (10+ wrappers)
- [ ] Shared components created (8+ composites)
- [ ] Feature components created (Products, Orders, Payments)
- [ ] Custom hooks implemented (7 hooks)
- [ ] App.tsx updated with ConfigProvider
- [ ] Routing configured with lazy loading
- [ ] Test coverage ≥ 80%
- [ ] TypeScript strict mode no errors
- [ ] ESLint passes
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Dark mode working
- [ ] All CRUD operations functional
- [ ] Form validation working
- [ ] Error handling implemented
- [ ] Loading states displayed
- [ ] Notifications working

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
