# Tasks: Ant Design CMS Frontend

**Input**: Design documents from `/specs/003-antd-cms-frontend/`
**Prerequisites**: plan.md, specification.md, data-model.md, quickstart.md

**Organization**: Tasks organized by user story following 8-step implementation approach

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [X] T001 Install Ant Design dependencies: `yarn add antd@^5.12.0 @ant-design/icons@^5.2.6 zod@^3.22.4 dayjs@^1.11.10` in bakery-cms-web/
- [X] T002 Install development dependencies: `yarn add -D less@^4.2.0 @types/node@^24.10.1` in bakery-cms-web/
- [X] T003 [P] Configure Vite for LESS support in bakery-cms-web/vite.config.ts (add CSS preprocessorOptions and manual chunks)
- [X] T004 [P] Create theme configuration in bakery-cms-web/src/config/theme.config.ts (lightTheme and darkTheme)
- [X] T005 [P] Create routes configuration in bakery-cms-web/src/config/routes.config.ts (with lazy loading)
- [X] T006 [P] Create Ant Design configuration in bakery-cms-web/src/config/antd.config.ts
- [X] T007 [P] Create LESS variables file in bakery-cms-web/src/styles/variables.less
- [X] T008 [P] Create Ant Design overrides in bakery-cms-web/src/styles/antd-overrides.less
- [X] T009 [P] Update global styles in bakery-cms-web/src/styles/global.css with Ant Design imports

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Zustand Stores

- [ ] T010 [P] Create stores directory at bakery-cms-web/src/stores/
- [ ] T011 [P] Implement theme store in bakery-cms-web/src/stores/themeStore.ts (ThemeMode, toggleTheme, setTheme with persist)
- [ ] T012 [P] Implement auth store in bakery-cms-web/src/stores/authStore.ts (User, login, logout, setUser with persist)
- [ ] T013 [P] Implement notification store in bakery-cms-web/src/stores/notificationStore.ts (success, error, warning, info)
- [ ] T014 Create stores index file bakery-cms-web/src/stores/index.ts (export all stores)

### Core Components (Ant Design Wrappers)

- [ ] T015 [P] Create core components directory at bakery-cms-web/src/components/core/
- [ ] T016 [P] Create AntButton wrapper in bakery-cms-web/src/components/core/AntButton/AntButton.tsx with types file
- [ ] T017 [P] Create AntTable wrapper in bakery-cms-web/src/components/core/AntTable/AntTable.tsx with types file
- [ ] T018 [P] Create AntModal wrapper in bakery-cms-web/src/components/core/AntModal/AntModal.tsx with types file
- [ ] T019 [P] Create AntDrawer wrapper in bakery-cms-web/src/components/core/AntDrawer/AntDrawer.tsx with types file
- [ ] T020 [P] Create AntForm wrapper in bakery-cms-web/src/components/core/AntForm/AntForm.tsx with types file
- [ ] T021 [P] Create AntInput wrapper in bakery-cms-web/src/components/core/AntInput/AntInput.tsx with types file
- [ ] T022 [P] Create AntCard wrapper in bakery-cms-web/src/components/core/AntCard/AntCard.tsx with types file
- [ ] T023 [P] Create AntTag wrapper in bakery-cms-web/src/components/core/AntTag/AntTag.tsx with types file
- [ ] T024 [P] Create AntBadge wrapper in bakery-cms-web/src/components/core/AntBadge/AntBadge.tsx with types file
- [ ] T025 [P] Create AntSelect wrapper in bakery-cms-web/src/components/core/AntSelect/AntSelect.tsx with types file
- [ ] T026 Create core components index file bakery-cms-web/src/components/core/index.ts (export all wrappers and types)

### Shared Components (Composite Reusable)

- [ ] T027 Create DashboardLayout component in bakery-cms-web/src/components/shared/DashboardLayout/DashboardLayout.tsx (with Sidebar and Header)
- [ ] T028 Create Sidebar component in bakery-cms-web/src/components/shared/DashboardLayout/components/Sidebar.tsx (with navigation menu)
- [ ] T029 Create Header component in bakery-cms-web/src/components/shared/DashboardLayout/components/Header.tsx (with user info and theme toggle)
- [ ] T030 [P] Create DataTable component in bakery-cms-web/src/components/shared/DataTable/DataTable.tsx with types file
- [ ] T031 [P] Create StatusBadge component in bakery-cms-web/src/components/shared/StatusBadge/StatusBadge.tsx with types and utils files
- [ ] T032 [P] Create PageHeader component in bakery-cms-web/src/components/shared/PageHeader/PageHeader.tsx with types file
- [ ] T033 [P] Create FilterPanel component in bakery-cms-web/src/components/shared/FilterPanel/FilterPanel.tsx with types file
- [ ] T034 [P] Create EmptyState component in bakery-cms-web/src/components/shared/EmptyState/EmptyState.tsx with types file
- [ ] T035 [P] Create LoadingSpinner component in bakery-cms-web/src/components/shared/LoadingSpinner/LoadingSpinner.tsx with types file
- [ ] T036 Update shared components index file bakery-cms-web/src/components/shared/index.ts (export all shared components)

### Custom Hooks

- [ ] T037 [P] Create useNotification hook in bakery-cms-web/src/hooks/useNotification.ts
- [ ] T038 [P] Create useModal hook in bakery-cms-web/src/hooks/useModal.ts
- [ ] T039 [P] Create useTable hook in bakery-cms-web/src/hooks/useTable.ts (pagination, sorting, filtering state)
- [ ] T040 [P] Create useTheme hook in bakery-cms-web/src/hooks/useTheme.ts

### Types & Utilities

- [ ] T041 [P] Create UI types in bakery-cms-web/src/types/ui/table.types.ts
- [ ] T042 [P] Create UI types in bakery-cms-web/src/types/ui/form.types.ts
- [ ] T043 [P] Create UI types in bakery-cms-web/src/types/ui/theme.types.ts
- [ ] T044 [P] Create format utilities in bakery-cms-web/src/utils/format.ts (currency, date formatting)
- [ ] T045 [P] Create validation utilities in bakery-cms-web/src/utils/validation.ts (Zod schema helpers)
- [ ] T046 [P] Create date utilities in bakery-cms-web/src/utils/date.ts (dayjs helpers)

### API Client Enhancement

- [ ] T047 Enhance Axios client in bakery-cms-web/src/services/api/client.ts (add interceptors for auth and error handling)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Admin Dashboard Access (Priority: P1) 🎯 MVP

**Goal**: Implement professional CMS dashboard layout with sidebar navigation and responsive design

**Independent Test**: Login and view responsive dashboard with working navigation to all pages

### Step 1: Code Structure

- [ ] T048 [P] [US1] Create Dashboard page directory at bakery-cms-web/src/pages/Dashboard/
- [ ] T049 [P] [US1] Create Dashboard feature components directory at bakery-cms-web/src/components/features/dashboard/

### Step 2: Data Types

- [ ] T050 [P] [US1] Create DashboardLayout types in bakery-cms-web/src/components/shared/DashboardLayout/DashboardLayout.types.ts
- [ ] T051 [P] [US1] Create Sidebar types in bakery-cms-web/src/components/shared/DashboardLayout/components/Sidebar.types.ts
- [ ] T052 [P] [US1] Create Header types in bakery-cms-web/src/components/shared/DashboardLayout/components/Header.types.ts

### Step 3: Data Models

*N/A for dashboard - no data models needed*

### Step 4: Migration Files

*N/A for frontend*

### Step 5: Seed Data

*N/A for frontend*

### Step 6: Business Functions/Components

- [ ] T053 [US1] Create DashboardPage component in bakery-cms-web/src/pages/Dashboard/DashboardPage.tsx (main dashboard view with stats cards)
- [ ] T054 [P] [US1] Create StatCard component in bakery-cms-web/src/components/features/dashboard/StatCard/StatCard.tsx with types
- [ ] T055 [P] [US1] Create RecentActivity component in bakery-cms-web/src/components/features/dashboard/RecentActivity/RecentActivity.tsx with types
- [ ] T056 [P] [US1] Create QuickActions component in bakery-cms-web/src/components/features/dashboard/QuickActions/QuickActions.tsx with types

### Step 7: Logic

- [ ] T057 [US1] Update App.tsx with ConfigProvider, theme integration, and DashboardLayout wrapper in bakery-cms-web/src/App.tsx
- [ ] T058 [US1] Implement navigation routing in Sidebar component (onClick handlers, active state)
- [ ] T059 [US1] Implement theme toggle in Header component (connect to themeStore)
- [ ] T060 [US1] Implement responsive collapse/expand in DashboardLayout (mobile menu)
- [ ] T061 [US1] Add user info display in Header (connect to authStore)
- [ ] T062 [US1] Implement navigation breadcrumbs in PageHeader component

### Step 8: Unit Tests

- [ ] T063 [P] [US1] Write DashboardLayout tests in bakery-cms-web/src/components/shared/DashboardLayout/DashboardLayout.test.tsx
- [ ] T064 [P] [US1] Write Sidebar tests in bakery-cms-web/src/components/shared/DashboardLayout/components/Sidebar.test.tsx
- [ ] T065 [P] [US1] Write Header tests in bakery-cms-web/src/components/shared/DashboardLayout/components/Header.test.tsx
- [ ] T066 [P] [US1] Write DashboardPage tests in bakery-cms-web/src/pages/Dashboard/DashboardPage.test.tsx
- [ ] T067 [P] [US1] Write StatCard tests in bakery-cms-web/src/components/features/dashboard/StatCard/StatCard.test.tsx
- [ ] T068 [P] [US1] Write theme store tests in bakery-cms-web/src/stores/themeStore.test.ts
- [ ] T069 [P] [US1] Write auth store tests in bakery-cms-web/src/stores/authStore.test.ts
- [ ] T070 [P] [US1] Write useTheme hook tests in bakery-cms-web/src/hooks/useTheme.test.ts
- [ ] T071 [US1] Run tests for US1 to verify coverage: `yarn test -- dashboard`

**Checkpoint**: User Story 1 complete - Dashboard layout functional with navigation and theme toggle

---

## Phase 4: User Story 2 - Product Management Interface (Priority: P1)

**Goal**: Implement product CRUD operations with data table, filtering, sorting, and form validation

**Independent Test**: Navigate to Products page, view table, create/edit/delete products, use filters

### Step 1: Code Structure

- [ ] T072 [P] [US2] Create Products page directory at bakery-cms-web/src/pages/Products/
- [ ] T073 [P] [US2] Create Product feature components directory at bakery-cms-web/src/components/features/products/

### Step 2: Data Types

- [ ] T074 [P] [US2] Update Product enums in bakery-cms-web/src/types/models/product.model.ts (ProductStatus, BusinessType)
- [ ] T075 [P] [US2] Create ProductTable types in bakery-cms-web/src/components/features/products/ProductTable/ProductTable.types.ts
- [ ] T076 [P] [US2] Create ProductForm types in bakery-cms-web/src/components/features/products/ProductForm/ProductForm.types.ts
- [ ] T077 [P] [US2] Create ProductFilters types in bakery-cms-web/src/components/features/products/ProductFilters/ProductFilters.types.ts
- [ ] T078 [P] [US2] Create Zod validation schema in bakery-cms-web/src/components/features/products/ProductForm/ProductForm.schema.ts

### Step 3: Data Models

- [ ] T079 [US2] Verify Product domain model in bakery-cms-web/src/types/models/product.model.ts (already exists, verify completeness)
- [ ] T080 [US2] Verify Product API types in bakery-cms-web/src/types/api/product.api.ts (already exists, verify completeness)
- [ ] T081 [US2] Update Product mapper in bakery-cms-web/src/types/mappers/product.mapper.ts (enhance with all fields)

### Step 4: Migration Files

*N/A for frontend*

### Step 5: Seed Data

*N/A for frontend*

### Step 6: Business Functions/Components

- [ ] T082 [US2] Refactor ProductsPage in bakery-cms-web/src/pages/ProductsPage.tsx (use new ProductTable and ProductFilters)
- [ ] T083 [P] [US2] Create ProductTable component in bakery-cms-web/src/components/features/products/ProductTable/ProductTable.tsx
- [ ] T084 [P] [US2] Create ProductForm component in bakery-cms-web/src/components/features/products/ProductForm/ProductForm.tsx (create/edit modal)
- [ ] T085 [P] [US2] Create ProductDetail component in bakery-cms-web/src/components/features/products/ProductDetail/ProductDetail.tsx
- [ ] T086 [P] [US2] Create ProductFilters component in bakery-cms-web/src/components/features/products/ProductFilters/ProductFilters.tsx
- [ ] T087 [P] [US2] Create ProductList component in bakery-cms-web/src/components/features/products/ProductList/ProductList.tsx (orchestrator)
- [ ] T088 [US2] Create ProductDetailPage component in bakery-cms-web/src/pages/Products/ProductDetailPage.tsx
- [ ] T089 [US2] Enhance useProducts hook in bakery-cms-web/src/hooks/useProducts.ts (add filters, sorting, pagination)

### Step 7: Logic

- [ ] T090 [US2] Enhance product service in bakery-cms-web/src/services/product.service.ts (add Result type, error handling)
- [ ] T091 [US2] Implement form validation in ProductForm component (Zod schema integration)
- [ ] T092 [US2] Implement create product handler in ProductForm component
- [ ] T093 [US2] Implement update product handler in ProductForm component
- [ ] T094 [US2] Implement delete product handler in ProductTable component (with confirmation)
- [ ] T095 [US2] Implement filter logic in ProductFilters component (search, category, status, businessType)
- [ ] T096 [US2] Implement sorting in ProductTable component (all columns)
- [ ] T097 [US2] Implement pagination in ProductTable component (server-side)
- [ ] T098 [US2] Add loading states to ProductTable and ProductForm
- [ ] T099 [US2] Add error handling with notifications (success/error messages)
- [ ] T100 [US2] Implement optimistic updates for product operations

### Step 8: Unit Tests

- [ ] T101 [P] [US2] Write ProductTable tests in bakery-cms-web/src/components/features/products/ProductTable/ProductTable.test.tsx
- [ ] T102 [P] [US2] Write ProductForm tests in bakery-cms-web/src/components/features/products/ProductForm/ProductForm.test.tsx
- [ ] T103 [P] [US2] Write ProductFilters tests in bakery-cms-web/src/components/features/products/ProductFilters/ProductFilters.test.tsx
- [ ] T104 [P] [US2] Write ProductDetail tests in bakery-cms-web/src/components/features/products/ProductDetail/ProductDetail.test.tsx
- [ ] T105 [P] [US2] Write useProducts hook tests in bakery-cms-web/src/hooks/useProducts.test.ts
- [ ] T106 [P] [US2] Write product service tests in bakery-cms-web/src/services/product.service.test.ts
- [ ] T107 [P] [US2] Write ProductsPage integration tests in bakery-cms-web/src/pages/ProductsPage.test.tsx
- [ ] T108 [US2] Run tests for US2 to verify coverage: `yarn test -- products`

**Checkpoint**: User Story 2 complete - Product management fully functional with CRUD operations

---

## Phase 5: User Story 3 - Order Management Interface (Priority: P1)

**Goal**: Implement order viewing, status updates, and detailed order information display

**Independent Test**: Navigate to Orders page, view table, filter by status, update order status, view order details

### Step 1: Code Structure

- [ ] T109 [P] [US3] Create Orders page directory at bakery-cms-web/src/pages/Orders/
- [ ] T110 [P] [US3] Create Order feature components directory at bakery-cms-web/src/components/features/orders/

### Step 2: Data Types

- [ ] T111 [P] [US3] Update Order enums in bakery-cms-web/src/types/models/order.model.ts (OrderStatus)
- [ ] T112 [P] [US3] Create OrderTable types in bakery-cms-web/src/components/features/orders/OrderTable/OrderTable.types.ts
- [ ] T113 [P] [US3] Create OrderDetail types in bakery-cms-web/src/components/features/orders/OrderDetail/OrderDetail.types.ts
- [ ] T114 [P] [US3] Create OrderStatusUpdater types in bakery-cms-web/src/components/features/orders/OrderStatusUpdater/OrderStatusUpdater.types.ts
- [ ] T115 [P] [US3] Create OrderFilters types in bakery-cms-web/src/components/features/orders/OrderFilters/OrderFilters.types.ts
- [ ] T116 [P] [US3] Create Zod validation schema in bakery-cms-web/src/components/features/orders/OrderStatusUpdater/OrderStatusUpdater.schema.ts

### Step 3: Data Models

- [ ] T117 [US3] Verify Order domain model in bakery-cms-web/src/types/models/order.model.ts (already exists, verify completeness)
- [ ] T118 [US3] Verify OrderItem domain model in bakery-cms-web/src/types/models/order.model.ts (already exists)
- [ ] T119 [US3] Verify Order API types in bakery-cms-web/src/types/api/order.api.ts (already exists, verify completeness)
- [ ] T120 [US3] Update Order mapper in bakery-cms-web/src/types/mappers/order.mapper.ts (enhance with all fields)

### Step 4: Migration Files

*N/A for frontend*

### Step 5: Seed Data

*N/A for frontend*

### Step 6: Business Functions/Components

- [ ] T121 [US3] Refactor OrdersPage in bakery-cms-web/src/pages/OrdersPage.tsx (use new OrderTable and OrderFilters)
- [ ] T122 [P] [US3] Create OrderTable component in bakery-cms-web/src/components/features/orders/OrderTable/OrderTable.tsx
- [ ] T123 [P] [US3] Create OrderDetail component in bakery-cms-web/src/components/features/orders/OrderDetail/OrderDetail.tsx (modal/drawer)
- [ ] T124 [P] [US3] Create OrderStatusUpdater component in bakery-cms-web/src/components/features/orders/OrderStatusUpdater/OrderStatusUpdater.tsx
- [ ] T125 [P] [US3] Create OrderFilters component in bakery-cms-web/src/components/features/orders/OrderFilters/OrderFilters.tsx
- [ ] T126 [P] [US3] Create OrderList component in bakery-cms-web/src/components/features/orders/OrderList/OrderList.tsx (orchestrator)
- [ ] T127 [P] [US3] Update OrderSummary component in bakery-cms-web/src/components/shared/OrderSummary/ (enhance with Ant Design)
- [ ] T128 [US3] Create OrderDetailPage component in bakery-cms-web/src/pages/Orders/OrderDetailPage.tsx
- [ ] T129 [US3] Enhance useOrders hook in bakery-cms-web/src/hooks/useOrders.ts (add filters, sorting, pagination)

### Step 7: Logic

- [ ] T130 [US3] Enhance order service in bakery-cms-web/src/services/order.service.ts (add Result type, error handling)
- [ ] T131 [US3] Implement view order details handler in OrderTable component
- [ ] T132 [US3] Implement update order status handler in OrderStatusUpdater component
- [ ] T133 [US3] Implement filter logic in OrderFilters component (status, date range, customer search)
- [ ] T134 [US3] Implement sorting in OrderTable component (all columns)
- [ ] T135 [US3] Implement pagination in OrderTable component (server-side)
- [ ] T136 [US3] Add loading states to OrderTable and OrderDetail
- [ ] T137 [US3] Add error handling with notifications
- [ ] T138 [US3] Implement order item display in OrderDetail component
- [ ] T139 [US3] Implement status badge color coding in OrderTable

### Step 8: Unit Tests

- [ ] T140 [P] [US3] Write OrderTable tests in bakery-cms-web/src/components/features/orders/OrderTable/OrderTable.test.tsx
- [ ] T141 [P] [US3] Write OrderDetail tests in bakery-cms-web/src/components/features/orders/OrderDetail/OrderDetail.test.tsx
- [ ] T142 [P] [US3] Write OrderStatusUpdater tests in bakery-cms-web/src/components/features/orders/OrderStatusUpdater/OrderStatusUpdater.test.tsx
- [ ] T143 [P] [US3] Write OrderFilters tests in bakery-cms-web/src/components/features/orders/OrderFilters/OrderFilters.test.tsx
- [ ] T144 [P] [US3] Write useOrders hook tests in bakery-cms-web/src/hooks/useOrders.test.ts
- [ ] T145 [P] [US3] Write order service tests in bakery-cms-web/src/services/order.service.test.ts
- [ ] T146 [P] [US3] Write OrdersPage integration tests in bakery-cms-web/src/pages/OrdersPage.test.tsx
- [ ] T147 [US3] Run tests for US3 to verify coverage: `yarn test -- orders`

**Checkpoint**: User Story 3 complete - Order management fully functional with status updates

---

## Phase 6: User Story 4 - Payment Processing Interface (Priority: P2)

**Goal**: Implement payment viewing, QR code generation, and payment status tracking

**Independent Test**: Navigate to Payments page, view table, filter by status/method, generate QR code for order

### Step 1: Code Structure

- [ ] T148 [P] [US4] Create Payments page directory at bakery-cms-web/src/pages/Payments/
- [ ] T149 [P] [US4] Create Payment feature components directory at bakery-cms-web/src/components/features/payments/

### Step 2: Data Types

- [ ] T150 [P] [US4] Update Payment enums in bakery-cms-web/src/types/models/payment.model.ts (PaymentStatus, PaymentMethod)
- [ ] T151 [P] [US4] Create PaymentTable types in bakery-cms-web/src/components/features/payments/PaymentTable/PaymentTable.types.ts
- [ ] T152 [P] [US4] Create PaymentDetail types in bakery-cms-web/src/components/features/payments/PaymentDetail/PaymentDetail.types.ts
- [ ] T153 [P] [US4] Create QRCodeGenerator types in bakery-cms-web/src/components/features/payments/QRCodeGenerator/QRCodeGenerator.types.ts
- [ ] T154 [P] [US4] Create PaymentFilters types in bakery-cms-web/src/components/features/payments/PaymentFilters/PaymentFilters.types.ts

### Step 3: Data Models

- [ ] T155 [US4] Verify Payment domain model in bakery-cms-web/src/types/models/payment.model.ts (already exists, verify completeness)
- [ ] T156 [US4] Verify Payment API types in bakery-cms-web/src/types/api/payment.api.ts (already exists, verify completeness)
- [ ] T157 [US4] Update Payment mapper in bakery-cms-web/src/types/mappers/payment.mapper.ts (enhance with all fields)

### Step 4: Migration Files

*N/A for frontend*

### Step 5: Seed Data

*N/A for frontend*

### Step 6: Business Functions/Components

- [ ] T158 [US4] Create PaymentsPage component in bakery-cms-web/src/pages/Payments/PaymentsPage.tsx
- [ ] T159 [P] [US4] Create PaymentTable component in bakery-cms-web/src/components/features/payments/PaymentTable/PaymentTable.tsx
- [ ] T160 [P] [US4] Create PaymentDetail component in bakery-cms-web/src/components/features/payments/PaymentDetail/PaymentDetail.tsx
- [ ] T161 [P] [US4] Create QRCodeGenerator component in bakery-cms-web/src/components/features/payments/QRCodeGenerator/QRCodeGenerator.tsx
- [ ] T162 [P] [US4] Create PaymentFilters component in bakery-cms-web/src/components/features/payments/PaymentFilters/PaymentFilters.tsx
- [ ] T163 [P] [US4] Create PaymentList component in bakery-cms-web/src/components/features/payments/PaymentList/PaymentList.tsx
- [ ] T164 [P] [US4] Update PaymentQR component in bakery-cms-web/src/components/shared/PaymentQR/ (enhance with Ant Design)
- [ ] T165 [US4] Create PaymentDetailPage component in bakery-cms-web/src/pages/Payments/PaymentDetailPage.tsx
- [ ] T166 [US4] Create usePayments hook in bakery-cms-web/src/hooks/usePayments.ts

### Step 7: Logic

- [ ] T167 [US4] Enhance payment service in bakery-cms-web/src/services/payment.service.ts (add Result type, error handling)
- [ ] T168 [US4] Implement view payment details handler in PaymentTable component
- [ ] T169 [US4] Implement QR code generation logic in QRCodeGenerator component
- [ ] T170 [US4] Implement filter logic in PaymentFilters component (status, method, date range)
- [ ] T171 [US4] Implement sorting in PaymentTable component (all columns)
- [ ] T172 [US4] Implement pagination in PaymentTable component (server-side)
- [ ] T173 [US4] Add loading states to PaymentTable and QRCodeGenerator
- [ ] T174 [US4] Add error handling with notifications
- [ ] T175 [US4] Implement payment status badge color coding
- [ ] T176 [US4] Implement payment method icons in PaymentTable

### Step 8: Unit Tests

- [ ] T177 [P] [US4] Write PaymentTable tests in bakery-cms-web/src/components/features/payments/PaymentTable/PaymentTable.test.tsx
- [ ] T178 [P] [US4] Write PaymentDetail tests in bakery-cms-web/src/components/features/payments/PaymentDetail/PaymentDetail.test.tsx
- [ ] T179 [P] [US4] Write QRCodeGenerator tests in bakery-cms-web/src/components/features/payments/QRCodeGenerator/QRCodeGenerator.test.tsx
- [ ] T180 [P] [US4] Write PaymentFilters tests in bakery-cms-web/src/components/features/payments/PaymentFilters/PaymentFilters.test.tsx
- [ ] T181 [P] [US4] Write usePayments hook tests in bakery-cms-web/src/hooks/usePayments.test.ts
- [ ] T182 [P] [US4] Write payment service tests in bakery-cms-web/src/services/payment.service.test.ts
- [ ] T183 [P] [US4] Write PaymentsPage integration tests in bakery-cms-web/src/pages/Payments/PaymentsPage.test.tsx
- [ ] T184 [US4] Run tests for US4 to verify coverage: `yarn test -- payments`

**Checkpoint**: User Story 4 complete - Payment management fully functional with QR generation

---

## Phase 7: User Story 5 - Responsive Design & Dark Mode (Priority: P3)

**Goal**: Implement responsive design for all devices and theme customization

**Independent Test**: Access CMS on mobile/tablet/desktop, toggle dark mode, verify consistent theming

### Step 1: Code Structure

*N/A - using existing structure*

### Step 2: Data Types

*N/A - types already created in Foundational phase*

### Step 3: Data Models

*N/A - no data models for UI preferences*

### Step 4: Migration Files

*N/A for frontend*

### Step 5: Seed Data

*N/A for frontend*

### Step 6: Business Functions/Components

- [ ] T185 [P] [US5] Create ThemeToggle component in bakery-cms-web/src/components/shared/ThemeToggle/ThemeToggle.tsx
- [ ] T186 [P] [US5] Create ResponsiveMenu component in bakery-cms-web/src/components/shared/ResponsiveMenu/ResponsiveMenu.tsx

### Step 7: Logic

- [ ] T187 [US5] Implement responsive breakpoints in DashboardLayout (collapse sidebar on mobile)
- [ ] T188 [US5] Implement touch-friendly controls for mobile in all tables
- [ ] T189 [US5] Add responsive columns to ProductTable (hide less important columns on small screens)
- [ ] T190 [US5] Add responsive columns to OrderTable (hide less important columns on small screens)
- [ ] T191 [US5] Add responsive columns to PaymentTable (hide less important columns on small screens)
- [ ] T192 [US5] Implement drawer instead of modal for forms on mobile
- [ ] T193 [US5] Add hamburger menu for mobile navigation
- [ ] T194 [US5] Test dark mode colors across all components
- [ ] T195 [US5] Implement dark mode theme tokens in theme.config.ts
- [ ] T196 [US5] Verify Ant Design component theming in dark mode
- [ ] T197 [US5] Add theme persistence with localStorage (already in themeStore)
- [ ] T198 [US5] Test responsive layout on multiple screen sizes (320px, 768px, 1024px, 1920px)

### Step 8: Unit Tests

- [ ] T199 [P] [US5] Write ThemeToggle tests in bakery-cms-web/src/components/shared/ThemeToggle/ThemeToggle.test.tsx
- [ ] T200 [P] [US5] Write responsive layout tests for DashboardLayout
- [ ] T201 [P] [US5] Write dark mode rendering tests for all core components
- [ ] T202 [P] [US5] Write responsive table tests for ProductTable
- [ ] T203 [P] [US5] Write responsive table tests for OrderTable
- [ ] T204 [P] [US5] Write responsive table tests for PaymentTable
- [ ] T205 [US5] Run tests for US5 to verify coverage: `yarn test -- theme responsive`

**Checkpoint**: User Story 5 complete - Responsive design and dark mode fully functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories

- [ ] T206 [P] Update README.md in bakery-cms-web/ with Ant Design setup instructions
- [ ] T207 [P] Create Ant Design customization guide in bakery-cms-web/docs/ANTD_CUSTOMIZATION.md
- [ ] T208 [P] Refactor common component patterns for consistency
- [ ] T209 [P] Optimize bundle size - analyze with `yarn build && yarn analyze`
- [ ] T210 [P] Add lazy loading for all pages in routes.config.ts (verify implementation)
- [ ] T211 [P] Implement error boundaries for graceful error handling
- [ ] T212 [P] Add accessibility attributes (ARIA labels, keyboard navigation)
- [ ] T213 [P] Security audit - check XSS protection, input sanitization
- [ ] T214 [P] Performance optimization - memoization of expensive operations
- [ ] T215 [P] Add Lighthouse CI for performance tracking
- [ ] T216 Run complete test suite: `yarn test:coverage`
- [ ] T217 Verify 80%+ test coverage across all features
- [ ] T218 Run all quickstart.md validation scenarios (5 scenarios)
- [ ] T219 Final integration testing of all user stories together
- [ ] T220 Run ESLint and fix all warnings: `yarn lint`
- [ ] T221 Verify TypeScript strict mode compliance: `yarn tsc --noEmit`
- [ ] T222 Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] T223 Verify responsive design on real devices (iOS, Android)
- [ ] T224 Final UX review - consistency, spacing, colors, typography

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational - No other story dependencies
- **User Story 2 (Phase 4)**: Depends on Foundational - Independently testable (may integrate with US1 dashboard)
- **User Story 3 (Phase 5)**: Depends on Foundational - Independently testable (may integrate with US1 dashboard)
- **User Story 4 (Phase 6)**: Depends on Foundational - Independently testable (may integrate with US1 dashboard and US3 orders)
- **User Story 5 (Phase 7)**: Depends on US1-US4 being visually complete - Applies theming and responsive design
- **Polish (Phase 8)**: Depends on all user stories being complete

### Within Each User Story (The 8 Steps)

1. **Code Structure (Step 1)**: First - creates directories and files
2. **Data Types (Step 2)**: After structure - can run in parallel [P]
3. **Data Models (Step 3)**: After types - verify/enhance existing models
4. **Migration Files (Step 4)**: N/A for frontend
5. **Seed Data (Step 5)**: N/A for frontend
6. **Business Functions/Components (Step 6)**: After types and models - can run in parallel [P] for independent components
7. **Logic (Step 7)**: After components created - integrate and wire up functionality
8. **Unit Tests (Step 8)**: After logic complete - can run in parallel [P] for different test files

### User Story Independence

- **US1 (Dashboard)**: Completely independent - creates layout infrastructure used by all
- **US2 (Products)**: Independent - can be implemented and tested without US3 or US4
- **US3 (Orders)**: Independent - can be implemented and tested without US2 or US4
- **US4 (Payments)**: Independent - can be implemented and tested without US2 or US3 (may reference orders for context)
- **US5 (Responsive/Theme)**: Cross-cutting - enhances all previous stories

### Parallel Opportunities

**Within Setup Phase**:
- T003-T009: All configuration files can be created in parallel

**Within Foundational Phase**:
- T011-T013: All Zustand stores in parallel
- T016-T025: All Core component wrappers in parallel
- T030-T035: All Shared components in parallel (after DashboardLayout)
- T037-T040: All custom hooks in parallel
- T041-T046: All types and utilities in parallel

**Across User Stories** (after Foundational complete):
- US2, US3, US4 can be developed in parallel by different developers
- Each story has independent components, services, and tests

**Within Each User Story**:
- Step 2: All type files in parallel
- Step 6: Independent components in parallel
- Step 8: All test files in parallel

---

## Implementation Strategy

### MVP First (Recommended)

**Minimum Viable Product Path**:

1. **Phase 1: Setup** (T001-T009) ✓ ~1-2 hours
   - Install dependencies and configure project
   
2. **Phase 2: Foundational** (T010-T047) ✓ ~4-6 hours
   - **CRITICAL**: Must complete before any feature work
   - Sets up stores, core components, shared components, hooks
   
3. **Phase 3: User Story 1** (T048-T071) ✓ ~3-4 hours
   - Dashboard layout with navigation
   - Theme toggle functionality
   - **VALIDATE**: Test navigation, theme, responsive layout
   
4. **STOP and DEMO**: At this point you have a professional CMS shell
   - Working dashboard with navigation
   - Theme switching
   - Responsive layout
   - Ready to add features

**MVP Deliverable**: Setup + Foundational + US1 = **~8-12 hours** = Professional CMS dashboard ready for feature implementation

### Incremental Delivery Strategy

After MVP, add features incrementally:

1. **MVP**: Setup + Foundational + US1 → Demo working dashboard
2. **+US2 (Products)**: T072-T108 → Demo product management (~6-8 hours)
3. **+US3 (Orders)**: T109-T147 → Demo order management (~6-8 hours)
4. **+US4 (Payments)**: T148-T184 → Demo payment tracking (~5-7 hours)
5. **+US5 (Responsive/Theme)**: T185-T205 → Demo polished UX (~3-4 hours)
6. **Polish**: T206-T224 → Final production-ready release (~3-4 hours)

**Total Estimated Time**: ~30-40 hours for complete implementation

### Parallel Team Strategy

With multiple developers:

**Phase 1 & 2: Together** (T001-T047)
- One person or pair completes foundation
- Critical for team to align on architecture

**Phase 3-6: Parallel** (after T047 complete)
- **Developer A**: User Story 1 (Dashboard) - T048-T071
- **Developer B**: User Story 2 (Products) - T072-T108
- **Developer C**: User Story 3 (Orders) - T109-T147
- **Developer D**: User Story 4 (Payments) - T148-T184

Then merge and proceed to US5 + Polish together.

**Team Size**: Optimal 2-4 developers for parallel story implementation

### Update Strategy (For Existing Project)

This is an **ENHANCEMENT** of existing bakery-cms-web, not a new project:

**Existing Assets to Preserve**:
- ✓ `src/components/shared/` - Navigation, OrderSummary, PaymentQR, ProductCard (enhance, not replace)
- ✓ `src/services/` - API services (enhance with Result type)
- ✓ `src/types/` - Existing types, models, mappers (enhance)
- ✓ `src/hooks/` - useProducts, useOrders (enhance with filters)

**New Assets to Add**:
- New: `src/components/core/` - Ant Design wrappers
- New: `src/components/features/` - Feature-specific components
- New: `src/stores/` - Zustand state management
- New: `src/config/` - Theme and route configuration
- Enhanced: Existing shared components styled with Ant Design
- Enhanced: Existing pages refactored to use new components

**Approach**:
- ✅ NO wholesale replacement - enhance incrementally
- ✅ Keep functional programming patterns
- ✅ Maintain existing API service structure
- ✅ Preserve type system with enhancements
- ✅ Update components to use Ant Design gradually

---

## Parallel Execution Examples

### Example 1: Foundational Phase - Zustand Stores

All stores can be created in parallel:

```bash
# Developer A
git checkout -b feature/theme-store
# Work on T011: themeStore.ts
git commit && git push

# Developer B (parallel)
git checkout -b feature/auth-store
# Work on T012: authStore.ts
git commit && git push

# Developer C (parallel)
git checkout -b feature/notification-store
# Work on T013: notificationStore.ts
git commit && git push
```

### Example 2: Foundational Phase - Core Components

All core component wrappers can be created in parallel:

```bash
# Developer A
# T016-T020: Button, Table, Modal, Drawer, Form

# Developer B (parallel)
# T021-T023: Input, Card, Tag

# Developer C (parallel)
# T024-T025: Badge, Select
```

### Example 3: User Story Phase - Independent Stories

After Foundational phase complete, different stories in parallel:

```bash
# Developer A
git checkout -b feature/us2-products
# Work on T072-T108: Complete Product Management

# Developer B (parallel)
git checkout -b feature/us3-orders
# Work on T109-T147: Complete Order Management

# Developer C (parallel)
git checkout -b feature/us4-payments
# Work on T148-T184: Complete Payment Management
```

### Example 4: Within User Story - Component Creation

Within US2 (Products), components can be created in parallel:

```bash
# Developer A
# T083: ProductTable

# Developer B (parallel)
# T084: ProductForm

# Developer C (parallel)
# T085: ProductDetail

# Developer D (parallel)
# T086: ProductFilters
```

### Example 5: Testing Phase

All test files can be written in parallel:

```bash
# Developer A
# T101-T103: ProductTable, ProductForm, ProductFilters tests

# Developer B (parallel)
# T104-T106: ProductDetail, useProducts, product.service tests

# Then everyone runs coverage together
yarn test:coverage
```

---

## Task Format Validation

✅ **Format Check**:
- [x] Every task has checkbox `- [ ]`
- [x] Every task has sequential Task ID (T001-T224)
- [x] User story tasks have [Story] label ([US1]-[US5])
- [x] Parallelizable tasks have [P] marker
- [x] Every task has exact file path or clear action
- [x] Task IDs are in execution order

✅ **Completeness Check**:
- [x] Setup phase includes project initialization (9 tasks)
- [x] Foundational phase includes blocking infrastructure (38 tasks)
- [x] Each user story has Goal and Independent Test criteria
- [x] All 8 steps applied (or marked N/A) for each story
- [x] Each story has Checkpoint statement
- [x] Polish phase includes cross-cutting concerns (19 tasks)

✅ **Dependency Check**:
- [x] Dependencies section documents all phase relationships
- [x] Foundational properly blocks all user stories
- [x] User stories are independent of each other
- [x] Within-story step order documented
- [x] No circular dependencies

✅ **User Story Check**:
- [x] US1: 24 tasks (Dashboard - MVP critical)
- [x] US2: 37 tasks (Products - P1)
- [x] US3: 39 tasks (Orders - P1)
- [x] US4: 37 tasks (Payments - P2)
- [x] US5: 21 tasks (Responsive/Theme - P3)
- [x] Each story independently testable
- [x] Each story delivers standalone value

---

## Summary

**Total Tasks**: 224 tasks organized across 8 phases

**Breakdown by Phase**:
- Phase 1 (Setup): 9 tasks
- Phase 2 (Foundational): 38 tasks - **BLOCKS all features**
- Phase 3 (US1 - Dashboard): 24 tasks - **MVP**
- Phase 4 (US2 - Products): 37 tasks
- Phase 5 (US3 - Orders): 39 tasks
- Phase 6 (US4 - Payments): 37 tasks
- Phase 7 (US5 - Responsive/Theme): 21 tasks
- Phase 8 (Polish): 19 tasks

**Parallelization**: 127 tasks marked [P] can run in parallel within their phase/step

**MVP Path**: T001-T071 (47 tasks = 21%) delivers working professional CMS dashboard

**Testing**: 59 test tasks ensuring 80%+ coverage requirement

**Constitution Compliance**:
- ✅ Functional programming (no class components)
- ✅ TypeScript strict mode
- ✅ Three-layer architecture (Core/Shared/Feature)
- ✅ API response mapping (types/models/mappers)
- ✅ 80%+ test coverage target
- ✅ Immutable state with Zustand
- ✅ Result type pattern for services

**Next Steps**:
1. Review tasks.md for completeness ✓
2. Confirm task breakdown matches plan.md ✓
3. Begin implementation with MVP path (T001-T071)
4. Or implement in parallel with team strategy

**Ready to begin implementation!** 🚀
