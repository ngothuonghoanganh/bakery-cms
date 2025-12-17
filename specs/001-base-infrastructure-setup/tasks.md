# Tasks: Base Infrastructure Setup

**Input**: Design documents from `/specs/001-base-infrastructure-setup/`  
**Prerequisites**: plan.md, data-model.md, contracts/, quickstart.md, constitution.md

**Organization**: Tasks organized by repository (Backend/Frontend) following 8-step implementation approach. This is infrastructure setup for the entire Bakery-CMS project, establishing the foundation for all future features.

---

## Task Format

```text
- [ ] [TaskID] [P?] [Repo] Description with exact file path
```

**Components**:
- `[TaskID]`: Sequential (T001, T002, ...) in execution order
- `[P]`: OPTIONAL marker for parallelizable tasks (different files, no dependencies)
- `[Repo]`: Repository indicator - `[BE]` Backend or `[FE]` Frontend
- **Description**: Clear action with exact file path

**Examples**:
```text
✅ - [ ] T001 [BE] Initialize backend monorepo with Yarn workspaces
✅ - [ ] T015 [P] [BE] Create Product type in packages/common/src/types/product.types.ts
✅ - [ ] T089 [P] [FE] Create Button component in src/components/core/Button/Button.tsx
```

---

## Phase 1: Backend Repository Setup (bakery-cms-api)

**Goal**: Establish complete backend infrastructure with functional programming patterns, monorepo structure, and all foundational entities.

**Repository**: Two separate repositories (Backend and Frontend as per constitution)

### Step 1: Project Initialization & Structure

```text
- [x] T001 [BE] Create backend repository: git init bakery-cms-api
- [x] T002 [BE] Initialize root package.json with Yarn workspaces configuration
- [x] T003 [BE] Create .gitignore with Node.js, TypeScript, and environment file patterns
- [x] T004 [BE] Create .env.example with database, server, JWT, and API configuration templates
- [x] T005 [P] [BE] Create packages/api directory structure with src/, tests/ folders
- [x] T006 [P] [BE] Create packages/common directory structure with src/ folder
- [x] T007 [P] [BE] Create packages/database directory structure with src/ folder
- [x] T008 [P] [BE] Create packages/api/package.json with dependencies: express, cors, helmet, dotenv, joi, neverthrow
- [x] T009 [P] [BE] Create packages/common/package.json with minimal setup
- [x] T010 [P] [BE] Create packages/database/package.json with dependencies: sequelize, mysql2, sequelize-cli
- [x] T011 [BE] Install all dependencies: yarn install
```

### Step 2: TypeScript & Tooling Configuration

```text
- [x] T012 [P] [BE] Create tsconfig.base.json in root with strict mode and common compiler options
- [x] T013 [P] [BE] Create packages/api/tsconfig.json extending base config
- [x] T014 [P] [BE] Create packages/common/tsconfig.json extending base config
- [x] T015 [P] [BE] Create packages/database/tsconfig.json extending base config
- [x] T016 [P] [BE] Create .eslintrc.js with TypeScript, functional programming rules
- [x] T017 [P] [BE] Create .prettierrc with formatting rules
- [x] T018 [P] [BE] Create jest.config.js with TypeScript support and coverage configuration
- [x] T019 [P] [BE] Add scripts to root package.json: dev, build, test, lint, format, migrate, seed
```

### Step 3: Shared Types & Constants (packages/common)

```text
- [x] T020 [P] [BE] Create packages/common/src/types/result.types.ts with Result type using neverthrow
- [x] T021 [P] [BE] Create packages/common/src/types/error.types.ts with AppError, ErrorCode, ValidationErrorDetail types
- [x] T022 [P] [BE] Create packages/common/src/types/product.types.ts with Product, CreateProductDTO, UpdateProductDTO, ProductFilters, ProductRepository, ProductService
- [x] T023 [P] [BE] Create packages/common/src/types/order.types.ts with Order, OrderItem, CreateOrderDTO, UpdateOrderDTO, OrderFilters, OrderRepository, OrderService
- [x] T024 [P] [BE] Create packages/common/src/types/payment.types.ts with Payment, CreatePaymentDTO, PaymentRepository, PaymentService
- [x] T025 [P] [BE] Create packages/common/src/enums/product.enums.ts with BusinessType, ProductStatus enums
- [x] T026 [P] [BE] Create packages/common/src/enums/order.enums.ts with OrderStatus, OrderType, BusinessModel enums
- [x] T027 [P] [BE] Create packages/common/src/enums/payment.enums.ts with PaymentMethod, PaymentStatus enums
- [x] T028 [P] [BE] Create packages/common/src/constants/config.constants.ts with MAX_ORDER_ITEMS, PAGE_SIZE, etc.
- [x] T029 [P] [BE] Create packages/common/src/constants/http.constants.ts with HTTP_STATUS codes
- [x] T030 [P] [BE] Create packages/common/src/constants/api.constants.ts with API_ROUTES, API_VERSION
- [x] T031 [P] [BE] Create packages/common/src/constants/error.constants.ts with ERROR_MESSAGES, ERROR_CODES
- [x] T032 [P] [BE] Create packages/common/src/types/index.ts exporting all types
- [x] T033 [P] [BE] Create packages/common/src/enums/index.ts exporting all enums
- [x] T034 [P] [BE] Create packages/common/src/constants/index.ts exporting all constants
- [x] T035 [BE] Build common package: yarn workspace @bakery-cms/common build
```

### Step 4: Database Models & Migrations (packages/database)

```text
- [x] T036 [BE] Create packages/database/src/config/database.config.ts with Sequelize configuration
- [x] T037 [P] [BE] Create packages/database/src/models/product.model.ts with ProductModel class and initProductModel function
- [x] T038 [P] [BE] Create packages/database/src/models/order.model.ts with OrderModel class and initOrderModel function
- [x] T039 [P] [BE] Create packages/database/src/models/order-item.model.ts with OrderItemModel class and initOrderItemModel function
- [x] T040 [P] [BE] Create packages/database/src/models/payment.model.ts with PaymentModel class and initPaymentModel function
- [x] T041 [BE] Create packages/database/src/models/index.ts with model initialization and associations
- [x] T042 [BE] Create packages/database/src/migrations/20251216000001-create-products.ts with up/down functions
- [x] T043 [BE] Create packages/database/src/migrations/20251216000002-create-orders.ts with up/down functions
- [x] T044 [BE] Create packages/database/src/migrations/20251216000003-create-order-items.ts with up/down functions and foreign keys
- [x] T045 [BE] Create packages/database/src/migrations/20251216000004-create-payments.ts with up/down functions and foreign keys
- [x] T046 [P] [BE] Create packages/database/src/seeders/20251216000001-seed-products.ts with sample cookie products
- [x] T047 [BE] Create .sequelizerc configuration file in root
- [x] T048 [BE] Build database package: yarn workspace @bakery-cms/database build
```

### Step 5: Database Setup & Migration Execution

```text
- [x] T049 [BE] Create MySQL database: bakery_cms (follow quickstart.md)
- [x] T050 [BE] Run migrations: npx sequelize-cli db:migrate
- [x] T051 [BE] Verify migrations created all tables with correct schema
- [x] T052 [BE] Run seeders: npx sequelize-cli db:seed:all
- [x] T053 [BE] Verify seed data inserted correctly
```

### Step 6: API Infrastructure (packages/api)

```text
- [x] T054 [P] [BE] Create packages/api/src/config/env.ts for environment variable validation
- [x] T055 [P] [BE] Create packages/api/src/config/database.ts for database connection initialization
- [x] T056 [P] [BE] Create packages/api/src/config/app.ts for application configuration
- [x] T057 [P] [BE] Create packages/api/src/utils/logger.ts with structured logging (Winston or Pino)
- [x] T058 [P] [BE] Create packages/api/src/utils/error-factory.ts with error creation functions
- [x] T059 [P] [BE] Create packages/api/src/utils/result.ts with Result type helpers
- [x] T060 [P] [BE] Create packages/api/src/middleware/error-handler.ts for global error handling
- [x] T061 [P] [BE] Create packages/api/src/middleware/validation.ts for request validation middleware
- [x] T062 [P] [BE] Create packages/api/src/middleware/rate-limiter.ts for rate limiting
- [x] T063 [BE] Create packages/api/src/app.ts with Express app setup, middleware configuration
- [x] T064 [BE] Create packages/api/src/server.ts as application entry point
```

### Step 7: Products Module Implementation

```text
- [x] T065 [BE] Create packages/api/src/modules/products directory structure (handlers/, services/, repositories/, validators/, dto/, mappers/, types/, tests/)
- [x] T066 [P] [BE] Create packages/api/src/modules/products/dto/products.dto.ts with DTO types
- [x] T067 [P] [BE] Create packages/api/src/modules/products/validators/products.validators.ts with Joi validation schemas
- [x] T068 [P] [BE] Create packages/api/src/modules/products/mappers/products.mappers.ts with entity-DTO transformation functions
- [x] T069 [BE] Create packages/api/src/modules/products/repositories/products.repositories.ts with createProductRepository function
- [x] T070 [BE] Implement repository functions: findById, findAll, create, update, delete, count
- [x] T071 [BE] Create packages/api/src/modules/products/services/products.services.ts with pure service functions
- [x] T072 [BE] Implement service functions: createProduct, getProductById, getAllProducts, updateProduct, deleteProduct
- [x] T073 [BE] Create packages/api/src/modules/products/handlers/products.handlers.ts with request handlers
- [x] T074 [BE] Implement handlers: handleCreateProduct, handleGetProduct, handleGetAllProducts, handleUpdateProduct, handleDeleteProduct
- [x] T075 [BE] Create packages/api/src/modules/products/routes.ts with Express router configuration
- [x] T076 [BE] Register products routes in packages/api/src/app.ts
```

### Step 8: Orders Module Implementation

```text
- [x] T077 [BE] Create packages/api/src/modules/orders directory structure (handlers/, services/, repositories/, validators/, dto/, mappers/, types/, tests/)
- [x] T078 [P] [BE] Create packages/api/src/modules/orders/dto/orders.dto.ts with DTO types
- [x] T079 [P] [BE] Create packages/api/src/modules/orders/validators/orders.validators.ts with Joi validation schemas
- [x] T080 [P] [BE] Create packages/api/src/modules/orders/mappers/orders.mappers.ts with entity-DTO transformation functions
- [x] T081 [BE] Create packages/api/src/modules/orders/repositories/orders.repositories.ts with createOrderRepository function
- [x] T082 [BE] Implement repository functions: findById, findAll, create, update, updateStatus, delete, count
- [x] T083 [BE] Create packages/api/src/modules/orders/services/orders.services.ts with pure service functions
- [x] T084 [BE] Implement service functions: createOrder, getOrderById, getAllOrders, updateOrder, confirmOrder, cancelOrder
- [x] T085 [BE] Add business logic for order number generation (ORD-YYYYMMDD-XXXX format)
- [x] T086 [BE] Add business logic for total amount calculation from order items
- [x] T087 [BE] Create packages/api/src/modules/orders/handlers/orders.handlers.ts with request handlers
- [x] T088 [BE] Implement handlers: handleCreateOrder, handleGetOrder, handleGetAllOrders, handleUpdateOrder, handleConfirmOrder, handleCancelOrder
- [x] T089 [BE] Create packages/api/src/modules/orders/routes.ts with Express router configuration
- [x] T090 [BE] Register orders routes in packages/api/src/app.ts
```

### Step 9: Payments Module Implementation

```text
- [x] T091 [BE] Create packages/api/src/modules/payments directory structure (handlers/, services/, repositories/, validators/, dto/, mappers/, types/, tests/)
- [x] T092 [P] [BE] Create packages/api/src/modules/payments/dto/payments.dto.ts with DTO types
- [x] T093 [P] [BE] Create packages/api/src/modules/payments/validators/payments.validators.ts with Joi validation schemas
- [x] T094 [P] [BE] Create packages/api/src/modules/payments/mappers/payments.mappers.ts with entity-DTO transformation functions
- [x] T095 [BE] Create packages/api/src/modules/payments/repositories/payments.repositories.ts with createPaymentRepository function
- [x] T096 [BE] Implement repository functions: findById, findByOrderId, create, updateStatus, markAsPaid
- [x] T097 [BE] Create packages/api/src/modules/payments/services/payments.services.ts with pure service functions
- [x] T098 [BE] Implement service functions: createPayment, getByOrderId, markAsPaid, generateVietQR
- [x] T099 [BE] Implement VietQR generation logic (research VietQR format and implement)
- [x] T100 [BE] Create packages/api/src/modules/payments/handlers/payments.handlers.ts with request handlers
- [x] T101 [BE] Implement handlers: handleCreatePayment, handleGetPayment, handleGetPaymentByOrder, handleMarkAsPaid, handleGetVietQR
- [x] T102 [BE] Create packages/api/src/modules/payments/routes.ts with Express router configuration
- [x] T103 [BE] Register payments routes in packages/api/src/app.ts
```

### Step 10: Backend Testing

```text
- [ ] T104 [P] [BE] Write products repository tests in packages/api/src/modules/products/tests/products.repositories.test.ts
- [ ] T105 [P] [BE] Write products service tests in packages/api/src/modules/products/tests/products.services.test.ts
- [ ] T106 [P] [BE] Write products validator tests in packages/api/src/modules/products/tests/products.validators.test.ts
- [ ] T107 [P] [BE] Write products handlers tests in packages/api/src/modules/products/tests/products.handlers.test.ts
- [ ] T108 [P] [BE] Write products integration tests in packages/api/tests/integration/products.test.ts
- [ ] T109 [P] [BE] Write orders repository tests in packages/api/src/modules/orders/tests/orders.repositories.test.ts
- [ ] T110 [P] [BE] Write orders service tests in packages/api/src/modules/orders/tests/orders.services.test.ts
- [ ] T111 [P] [BE] Write orders validator tests in packages/api/src/modules/orders/tests/orders.validators.test.ts
- [ ] T112 [P] [BE] Write orders handlers tests in packages/api/src/modules/orders/tests/orders.handlers.test.ts
- [ ] T113 [P] [BE] Write orders integration tests in packages/api/tests/integration/orders.test.ts
- [ ] T114 [P] [BE] Write payments repository tests in packages/api/src/modules/payments/tests/payments.repositories.test.ts
- [ ] T115 [P] [BE] Write payments service tests in packages/api/src/modules/payments/tests/payments.services.test.ts
- [ ] T116 [P] [BE] Write payments validator tests in packages/api/src/modules/payments/tests/payments.validators.test.ts
- [ ] T117 [P] [BE] Write payments handlers tests in packages/api/src/modules/payments/tests/payments.handlers.test.ts
- [ ] T118 [P] [BE] Write payments integration tests in packages/api/tests/integration/payments.test.ts
- [ ] T119 [BE] Run all backend tests: yarn test
- [ ] T120 [BE] Verify test coverage ≥ 80%: yarn test:coverage
- [ ] T121 [BE] Fix any failing tests or coverage gaps
```

### Step 11: Backend CI/CD & Documentation

```text
- [ ] T122 [P] [BE] Create .github/workflows/ci.yml with lint, test, build steps
- [ ] T123 [P] [BE] Create .github/workflows/deploy.yml for deployment automation
- [ ] T124 [P] [BE] Create README.md with setup instructions, architecture overview, and development guide
- [ ] T125 [P] [BE] Create API documentation using Swagger/OpenAPI (based on contracts/ directory)
- [ ] T126 [BE] Start backend server: yarn dev
- [ ] T127 [BE] Verify health endpoint: curl http://localhost:3000/health
- [ ] T128 [BE] Test products CRUD endpoints following quickstart.md
- [ ] T129 [BE] Test orders CRUD endpoints following quickstart.md
- [ ] T130 [BE] Test payments endpoints following quickstart.md
```

**Checkpoint**: Backend repository complete and fully functional ✅

---

## Phase 2: Frontend Repository Setup (bakery-cms-web)

**Goal**: Establish complete frontend infrastructure with React functional components, strict component architecture (core/shared/features), and type-safe API integration.

### Step 1: Project Initialization & Structure

```text
- [ ] T131 [FE] Create frontend repository: git init bakery-cms-web
- [ ] T132 [FE] Initialize Vite React TypeScript project: npm create vite@latest . -- --template react-ts
- [ ] T133 [FE] Initialize git and create .gitignore
- [ ] T134 [FE] Create .env.example with VITE_API_BASE_URL, VITE_API_TIMEOUT, VITE_APP_NAME configuration
- [ ] T135 [P] [FE] Create src/components/core directory
- [ ] T136 [P] [FE] Create src/components/shared directory
- [ ] T137 [P] [FE] Create src/components/features directory
- [ ] T138 [P] [FE] Create src/services directory with api/ subdirectory
- [ ] T139 [P] [FE] Create src/types directory with api/, models/, mappers/, common/ subdirectories
- [ ] T140 [P] [FE] Create src/hooks directory
- [ ] T141 [P] [FE] Create src/store directory
- [ ] T142 [P] [FE] Create src/utils directory
- [ ] T143 [P] [FE] Create src/pages directory
- [ ] T144 [P] [FE] Create tests/ directory with components/, integration/, unit/ subdirectories
```

### Step 2: TypeScript & Tooling Configuration

```text
- [ ] T145 [P] [FE] Update tsconfig.json with strict mode, path aliases, and React settings
- [ ] T146 [P] [FE] Create .eslintrc.cjs with React, TypeScript, and functional programming rules
- [ ] T147 [P] [FE] Create .prettierrc with formatting rules
- [ ] T148 [P] [FE] Update vite.config.ts with path aliases and optimizations
- [ ] T149 [FE] Install dependencies: axios, react-router-dom, zustand
- [ ] T150 [FE] Install dev dependencies: @testing-library/react, @testing-library/jest-dom, vitest, jsdom
- [ ] T151 [P] [FE] Create vitest.config.ts for testing configuration
- [ ] T152 [P] [FE] Add scripts to package.json: dev, build, preview, test, test:coverage, lint, format, type-check
```

### Step 3: Type Definitions & API Client

```text
- [ ] T153 [P] [FE] Create src/types/common/result.types.ts with Result type (matching backend)
- [ ] T154 [P] [FE] Create src/types/common/error.types.ts with AppError type
- [ ] T155 [P] [FE] Create src/types/api/product.api.ts with ProductAPIResponse type
- [ ] T156 [P] [FE] Create src/types/api/order.api.ts with OrderAPIResponse, OrderItemAPIResponse types
- [ ] T157 [P] [FE] Create src/types/api/payment.api.ts with PaymentAPIResponse type
- [ ] T158 [P] [FE] Create src/types/models/product.model.ts with Product domain model type
- [ ] T159 [P] [FE] Create src/types/models/order.model.ts with Order, OrderItem domain model types
- [ ] T160 [P] [FE] Create src/types/models/payment.model.ts with Payment domain model type
- [ ] T161 [P] [FE] Create src/types/mappers/product.mapper.ts with mapProductFromAPI function
- [ ] T162 [P] [FE] Create src/types/mappers/order.mapper.ts with mapOrderFromAPI, mapOrderItemFromAPI functions
- [ ] T163 [P] [FE] Create src/types/mappers/payment.mapper.ts with mapPaymentFromAPI function
- [ ] T164 [FE] Create src/services/api/client.ts with Axios instance configuration and interceptors
- [ ] T165 [FE] Create src/utils/error-handler.ts with handleAPIError function
```

### Step 4: API Services

```text
- [ ] T166 [P] [FE] Create src/services/product.service.ts with createProductService function
- [ ] T167 [P] [FE] Implement product service functions: getAll, getById, create, update, delete (all returning Result type)
- [ ] T168 [P] [FE] Create src/services/order.service.ts with createOrderService function
- [ ] T169 [P] [FE] Implement order service functions: getAll, getById, create, update, confirm, cancel (all returning Result type)
- [ ] T170 [P] [FE] Create src/services/payment.service.ts with createPaymentService function
- [ ] T171 [P] [FE] Implement payment service functions: create, getByOrderId, markAsPaid, getVietQR (all returning Result type)
- [ ] T172 [FE] Create src/services/index.ts exporting all service instances
```

### Step 5: Core Components (Atomic UI)

```text
- [ ] T173 [P] [FE] Create src/components/core/Button/Button.tsx with functional component
- [ ] T174 [P] [FE] Create src/components/core/Button/Button.types.ts with ButtonProps type
- [ ] T175 [P] [FE] Create src/components/core/Button/Button.styles.css with button styles
- [ ] T176 [P] [FE] Create src/components/core/Input/Input.tsx with functional component
- [ ] T177 [P] [FE] Create src/components/core/Input/Input.types.ts with InputProps type
- [ ] T178 [P] [FE] Create src/components/core/Input/Input.styles.css with input styles
- [ ] T179 [P] [FE] Create src/components/core/Card/Card.tsx with functional component
- [ ] T180 [P] [FE] Create src/components/core/Card/Card.types.ts with CardProps type
- [ ] T181 [P] [FE] Create src/components/core/Modal/Modal.tsx with functional component
- [ ] T182 [P] [FE] Create src/components/core/Modal/Modal.types.ts with ModalProps type
- [ ] T183 [P] [FE] Create src/components/core/Spinner/Spinner.tsx with functional component
- [ ] T184 [P] [FE] Create src/components/core/ErrorMessage/ErrorMessage.tsx with functional component
- [ ] T185 [P] [FE] Create src/components/core/ErrorMessage/ErrorMessage.types.ts with ErrorMessageProps type
- [ ] T186 [FE] Create src/components/core/index.ts exporting all core components
```

### Step 6: Shared Components (Composite)

```text
- [ ] T187 [P] [FE] Create src/components/shared/ProductCard/ProductCard.tsx with functional component
- [ ] T188 [P] [FE] Create src/components/shared/ProductCard/ProductCard.types.ts with ProductCardProps type
- [ ] T189 [P] [FE] Create src/components/shared/OrderSummary/OrderSummary.tsx with functional component
- [ ] T190 [P] [FE] Create src/components/shared/OrderSummary/OrderSummary.types.ts with OrderSummaryProps type
- [ ] T191 [P] [FE] Create src/components/shared/PaymentQR/PaymentQR.tsx with functional component
- [ ] T192 [P] [FE] Create src/components/shared/PaymentQR/PaymentQR.types.ts with PaymentQRProps type
- [ ] T193 [P] [FE] Create src/components/shared/StatisticsChart/StatisticsChart.tsx with functional component (placeholder)
- [ ] T194 [P] [FE] Create src/components/shared/StatisticsChart/StatisticsChart.types.ts with StatisticsChartProps type
- [ ] T195 [FE] Create src/components/shared/index.ts exporting all shared components
```

### Step 7: Feature Components & Pages

```text
- [ ] T196 [P] [FE] Create src/components/features/products/ProductList/ProductList.tsx with data fetching
- [ ] T197 [P] [FE] Create src/components/features/products/ProductList/ProductList.types.ts with ProductListProps type
- [ ] T198 [P] [FE] Create src/components/features/products/ProductDetail/ProductDetail.tsx with data fetching
- [ ] T199 [P] [FE] Create src/components/features/products/ProductDetail/ProductDetail.types.ts with ProductDetailProps type
- [ ] T200 [P] [FE] Create src/components/features/products/ProductForm/ProductForm.tsx with form handling
- [ ] T201 [P] [FE] Create src/components/features/products/ProductForm/ProductForm.types.ts with ProductFormProps type
- [ ] T202 [P] [FE] Create src/components/features/orders/OrderList/OrderList.tsx with data fetching
- [ ] T203 [P] [FE] Create src/components/features/orders/OrderList/OrderList.types.ts with OrderListProps type
- [ ] T204 [P] [FE] Create src/components/features/orders/OrderDetail/OrderDetail.tsx with data fetching
- [ ] T205 [P] [FE] Create src/components/features/orders/OrderDetail/OrderDetail.types.ts with OrderDetailProps type
- [ ] T206 [P] [FE] Create src/components/features/orders/CreateOrder/CreateOrder.tsx with form handling
- [ ] T207 [P] [FE] Create src/components/features/orders/CreateOrder/CreateOrder.types.ts with CreateOrderProps type
- [ ] T208 [P] [FE] Create src/components/features/payments/PaymentProcess/PaymentProcess.tsx with payment flow
- [ ] T209 [P] [FE] Create src/components/features/payments/PaymentProcess/PaymentProcess.types.ts with PaymentProcessProps type
- [ ] T210 [P] [FE] Create src/components/features/payments/PaymentHistory/PaymentHistory.tsx with data fetching
- [ ] T211 [P] [FE] Create src/components/features/payments/PaymentHistory/PaymentHistory.types.ts with PaymentHistoryProps type
- [ ] T212 [P] [FE] Create src/pages/ProductsPage.tsx using ProductList component
- [ ] T213 [P] [FE] Create src/pages/OrdersPage.tsx using OrderList component
- [ ] T214 [P] [FE] Create src/pages/PaymentsPage.tsx using PaymentHistory component
- [ ] T215 [P] [FE] Create src/pages/StatisticsPage.tsx with placeholder content
- [ ] T216 [P] [FE] Create src/pages/NotFoundPage.tsx with 404 message
```

### Step 8: Routing & Application Setup

```text
- [ ] T217 [FE] Create src/App.tsx with React Router configuration
- [ ] T218 [FE] Configure routes: /, /products, /products/:id, /orders, /orders/:id, /payments, /statistics
- [ ] T219 [FE] Update src/main.tsx with proper providers and setup
- [ ] T220 [FE] Create src/index.css with global styles
- [ ] T221 [FE] Create basic navigation component in src/components/shared/Navigation/Navigation.tsx
```

### Step 9: Custom Hooks (Optional but Recommended)

```text
- [ ] T222 [P] [FE] Create src/hooks/useProducts.ts custom hook for product data fetching
- [ ] T223 [P] [FE] Create src/hooks/useOrders.ts custom hook for order data fetching
- [ ] T224 [P] [FE] Create src/hooks/usePayments.ts custom hook for payment data fetching
```

### Step 10: Frontend Testing

```text
- [ ] T225 [P] [FE] Write Button component tests in src/components/core/Button/Button.test.tsx
- [ ] T226 [P] [FE] Write Input component tests in src/components/core/Input/Input.test.tsx
- [ ] T227 [P] [FE] Write Card component tests in src/components/core/Card/Card.test.tsx
- [ ] T228 [P] [FE] Write Modal component tests in src/components/core/Modal/Modal.test.tsx
- [ ] T229 [P] [FE] Write ProductCard component tests in src/components/shared/ProductCard/ProductCard.test.tsx
- [ ] T230 [P] [FE] Write OrderSummary component tests in src/components/shared/OrderSummary/OrderSummary.test.tsx
- [ ] T231 [P] [FE] Write PaymentQR component tests in src/components/shared/PaymentQR/PaymentQR.test.tsx
- [ ] T232 [P] [FE] Write ProductList component tests in tests/components/features/ProductList.test.tsx
- [ ] T233 [P] [FE] Write OrderList component tests in tests/components/features/OrderList.test.tsx
- [ ] T234 [P] [FE] Write CreateOrder component tests in tests/components/features/CreateOrder.test.tsx
- [ ] T235 [P] [FE] Write product service tests in tests/unit/services/product.service.test.ts
- [ ] T236 [P] [FE] Write order service tests in tests/unit/services/order.service.test.ts
- [ ] T237 [P] [FE] Write payment service tests in tests/unit/services/payment.service.test.ts
- [ ] T238 [P] [FE] Write mapper function tests in tests/unit/mappers/product.mapper.test.ts
- [ ] T239 [P] [FE] Write mapper function tests in tests/unit/mappers/order.mapper.test.ts
- [ ] T240 [P] [FE] Write mapper function tests in tests/unit/mappers/payment.mapper.test.ts
- [ ] T241 [FE] Run all frontend tests: yarn test
- [ ] T242 [FE] Verify test coverage ≥ 80%: yarn test:coverage
- [ ] T243 [FE] Fix any failing tests or coverage gaps
```

### Step 11: Frontend CI/CD & Documentation

```text
- [ ] T244 [P] [FE] Create .github/workflows/ci.yml with lint, test, build steps
- [ ] T245 [P] [FE] Create .github/workflows/deploy.yml for deployment automation
- [ ] T246 [P] [FE] Create README.md with setup instructions, component architecture, and development guide
- [ ] T247 [FE] Start frontend server: yarn dev
- [ ] T248 [FE] Verify frontend loads at http://localhost:5173
- [ ] T249 [FE] Test product management UI following quickstart.md
- [ ] T250 [FE] Test order management UI following quickstart.md
- [ ] T251 [FE] Test payment processing UI following quickstart.md
```

**Checkpoint**: Frontend repository complete and fully functional ✅

---

## Phase 3: Integration & Validation

**Goal**: Verify both repositories work together correctly and meet all constitution requirements.

### Integration Testing

```text
- [ ] T252 [BE+FE] Start both backend (port 3000) and frontend (port 5173) servers
- [ ] T253 [BE+FE] Test complete product flow: Create product in frontend → Verify in backend API → Display in frontend list
- [ ] T254 [BE+FE] Test complete order flow: Create order in frontend → Confirm order → Verify in backend → Display status in frontend
- [ ] T255 [BE+FE] Test complete payment flow: Create payment → Generate QR code → Mark as paid → Verify order status updated
- [ ] T256 [BE+FE] Test error handling: Invalid API calls → Proper error display in frontend
- [ ] T257 [BE+FE] Test validation: Submit invalid form data → Backend validation errors → Frontend error messages
- [ ] T258 [BE+FE] Test pagination: Load products list → Next page → Previous page
- [ ] T259 [BE+FE] Test filtering: Filter products by status, category, businessType
- [ ] T260 [BE+FE] Test order state transitions: draft → confirmed → paid
- [ ] T261 [BE+FE] Verify no console errors in browser
- [ ] T262 [BE+FE] Verify no server errors in backend logs
```

### Constitution Compliance Verification

```text
- [ ] T263 [BE] Verify backend uses functional programming (no classes except Sequelize models)
- [ ] T264 [BE] Verify backend TypeScript strict mode enabled and no 'any' types
- [ ] T265 [BE] Verify backend monorepo structure: packages/api, packages/common, packages/database
- [ ] T266 [BE] Verify backend uses Result type for error handling
- [ ] T267 [BE] Verify backend repository pattern uses functional composition
- [ ] T268 [BE] Verify backend test coverage ≥ 80%
- [ ] T269 [FE] Verify frontend uses only functional React components (no classes)
- [ ] T270 [FE] Verify frontend component types separated: core, shared, features
- [ ] T271 [FE] Verify frontend uses immutable state updates
- [ ] T272 [FE] Verify frontend TypeScript strict mode enabled and no 'any' types
- [ ] T273 [FE] Verify frontend API responses mapped to domain models
- [ ] T274 [FE] Verify frontend test coverage ≥ 80%
- [ ] T275 [BE+FE] Verify no secrets in code (all in environment variables)
- [ ] T276 [BE+FE] Verify Yarn package manager used (not npm)
```

### Performance & Quality Checks

```text
- [ ] T277 [BE] Run backend performance tests: API response time < 200ms (p95)
- [ ] T278 [BE] Run backend database query tests: Query time < 100ms (p95)
- [ ] T279 [FE] Run frontend performance tests: Initial load < 2 seconds
- [ ] T280 [FE] Run Lighthouse audit: Performance score > 90
- [ ] T281 [BE] Run ESLint on backend: yarn lint (0 errors)
- [ ] T282 [FE] Run ESLint on frontend: yarn lint (0 errors)
- [ ] T283 [BE] Run Prettier check on backend: yarn format:check
- [ ] T284 [FE] Run Prettier check on frontend: yarn format:check
- [ ] T285 [BE] Verify all backend API endpoints match OpenAPI contracts
- [ ] T286 [BE+FE] Test API error responses match expected format
```

### Documentation & Handoff

```text
- [ ] T287 [BE] Update backend README.md with final architecture decisions
- [ ] T288 [FE] Update frontend README.md with component architecture guide
- [ ] T289 [BE+FE] Create deployment guide in docs/deployment.md
- [ ] T290 [BE+FE] Create troubleshooting guide in docs/troubleshooting.md
- [ ] T291 [BE+FE] Verify quickstart.md is accurate and complete
- [ ] T292 [BE+FE] Create developer onboarding checklist in docs/onboarding.md
- [ ] T293 [BE+FE] Record demo video showing all features working
- [ ] T294 [BE+FE] Tag release: git tag v0.1.0-infrastructure
```

**Checkpoint**: Base infrastructure complete, tested, and ready for feature development ✅

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Backend)**: No dependencies - can start immediately
- **Phase 2 (Frontend)**: Requires Backend API running for integration testing (T252-T262)
  - Can develop Frontend in parallel with Backend
  - Frontend components can use mocked API responses during development
  - Full integration testing requires Backend complete
- **Phase 3 (Integration)**: Requires both Phase 1 AND Phase 2 complete

### Within Backend (Phase 1)
1. **Project Init (T001-T011)**: Must complete first
2. **TypeScript Config (T012-T019)**: After project init, can run in parallel [P]
3. **Shared Types (T020-T035)**: After TypeScript config
4. **Database Models (T036-T048)**: After shared types
5. **Database Setup (T049-T053)**: After database models - CRITICAL for all modules
6. **API Infrastructure (T054-T064)**: After shared types, can run in parallel with modules [P]
7. **Products Module (T065-T076)**: After database setup
8. **Orders Module (T077-T090)**: After database setup AND products module (orders depend on products)
9. **Payments Module (T091-T103)**: After database setup AND orders module (payments depend on orders)
10. **Testing (T104-T121)**: After all modules implemented, tests can run in parallel [P]
11. **CI/CD (T122-T130)**: After testing complete

### Within Frontend (Phase 2)
1. **Project Init (T131-T144)**: Must complete first
2. **TypeScript Config (T145-T152)**: After project init, can run in parallel [P]
3. **Types & API Client (T153-T165)**: After TypeScript config
4. **API Services (T166-T172)**: After types & API client, can run in parallel [P]
5. **Core Components (T173-T186)**: After TypeScript config, can run in parallel [P]
6. **Shared Components (T187-T195)**: After core components, can run in parallel [P]
7. **Feature Components (T196-T216)**: After shared components AND API services
8. **Routing (T217-T221)**: After feature components
9. **Custom Hooks (T222-T224)**: Can develop in parallel with components [P]
10. **Testing (T225-T243)**: After components implemented, tests can run in parallel [P]
11. **CI/CD (T244-T251)**: After testing complete

### Parallel Opportunities
- **Within Phase 1**: Tasks marked [P] in Steps 2, 3, 6, and 10 can run simultaneously
- **Within Phase 2**: Tasks marked [P] in Steps 2, 5, 6, 7, 9, and 10 can run simultaneously
- **Cross-Phase**: Frontend development (T131-T222) can proceed in parallel with Backend development (T001-T103)
  - Use mocked API responses for Frontend testing
  - Integration testing (T252-T262) requires both complete

---

## Implementation Strategy

### Sequential Approach (Recommended for Solo Developer)
1. **Complete Backend Foundation** (T001-T053)
   - Setup + Types + Database = Foundation ready
2. **Implement Backend Modules** (T054-T103)
   - Products → Orders → Payments (in sequence due to dependencies)
3. **Backend Testing** (T104-T130)
   - Verify 80% coverage and all endpoints working
4. **Complete Frontend Foundation** (T131-T165)
   - Setup + Types + API Client = Foundation ready
5. **Implement Frontend Components** (T166-T221)
   - Core → Shared → Features → Pages
6. **Frontend Testing** (T225-T251)
   - Verify 80% coverage and all components working
7. **Integration & Validation** (T252-T294)
   - End-to-end testing and final polish

**Estimated Timeline**: 6-8 weeks

### Parallel Team Approach (For Multiple Developers)

**Developer A - Backend Lead**:
- Phase 1: Backend Repository Setup (T001-T130)
- Estimated: 3-4 weeks

**Developer B - Frontend Lead**:
- Phase 2: Frontend Repository Setup (T131-T251)
- Can start after T053 (Backend database setup complete)
- Use mocked API responses initially
- Estimated: 3-4 weeks

**Both Developers**:
- Phase 3: Integration & Validation (T252-T294)
- Estimated: 1 week

**Total Timeline**: 4-5 weeks (with parallel work)

### MVP-First Approach

**MVP = Products Module Only**

1. **Backend MVP** (T001-T076, T104-T108, T122-T128)
   - Setup + Products module + Tests
   - ~2 weeks

2. **Frontend MVP** (T131-T201, T212, T217-T221, T225-T229, T244-T249)
   - Setup + Core + Shared + Product components only
   - ~2 weeks

3. **Integration MVP** (T252-T253, T263-T276, T287-T291)
   - Test products flow only
   - ~3 days

**Total MVP**: 4-5 weeks
**Then add**: Orders module → Payments module incrementally

### Agile Sprint Breakdown

**Sprint 1 (Week 1-2)**: Backend Foundation
- T001-T053: Setup, types, database models, migrations
- **Deliverable**: Database schema ready, models working

**Sprint 2 (Week 3-4)**: Backend Modules
- T054-T103: API infrastructure, Products, Orders, Payments modules
- **Deliverable**: All API endpoints working

**Sprint 3 (Week 5)**: Backend Testing & Polish
- T104-T130: Complete test suite, CI/CD, documentation
- **Deliverable**: Backend production-ready

**Sprint 4 (Week 6-7)**: Frontend Foundation & Components
- T131-T221: Setup, types, services, components, routing
- **Deliverable**: All UI components working

**Sprint 5 (Week 8)**: Frontend Testing & Polish
- T222-T251: Complete test suite, CI/CD, documentation
- **Deliverable**: Frontend production-ready

**Sprint 6 (Week 9)**: Integration & Launch
- T252-T294: Integration testing, performance, documentation
- **Deliverable**: Full system deployed

---

## Task Summary

### Total Tasks: 294

### By Phase:
- **Phase 1 (Backend)**: 130 tasks (T001-T130)
  - Setup: 11 tasks
  - Configuration: 8 tasks
  - Types & Constants: 16 tasks
  - Database: 13 tasks
  - Database Setup: 5 tasks
  - API Infrastructure: 11 tasks
  - Products Module: 12 tasks
  - Orders Module: 14 tasks
  - Payments Module: 13 tasks
  - Testing: 18 tasks
  - CI/CD & Docs: 9 tasks

- **Phase 2 (Frontend)**: 121 tasks (T131-T251)
  - Setup: 14 tasks
  - Configuration: 8 tasks
  - Types & API: 13 tasks
  - Services: 7 tasks
  - Core Components: 14 tasks
  - Shared Components: 9 tasks
  - Features & Pages: 21 tasks
  - Routing: 5 tasks
  - Hooks: 3 tasks
  - Testing: 19 tasks
  - CI/CD & Docs: 8 tasks

- **Phase 3 (Integration)**: 43 tasks (T252-T294)
  - Integration Testing: 11 tasks
  - Constitution Compliance: 14 tasks
  - Performance & Quality: 10 tasks
  - Documentation: 8 tasks

### Parallelizable Tasks: 148 tasks marked with [P]
- Can significantly reduce implementation time with team collaboration

### Critical Path (Must complete in sequence):
1. Backend Setup → Database Setup (T001-T053)
2. Backend Modules: Products → Orders → Payments (T054-T103)
3. Frontend Setup → Components (T131-T216)
4. Integration Testing (T252-T262)

---

## Validation Checklist

### Format Validation ✅
- [x] All 294 tasks have checkbox format `- [ ]`
- [x] All tasks have sequential Task IDs (T001-T294)
- [x] All tasks have repository indicator [BE] or [FE]
- [x] Parallelizable tasks marked with [P] (148 tasks)
- [x] All tasks have exact file paths or clear descriptions

### Completeness Validation ✅
- [x] Phase 1 (Backend) includes all 8 implementation steps per module
- [x] Phase 2 (Frontend) includes all 8 implementation steps per component type
- [x] Phase 3 (Integration) includes comprehensive validation
- [x] Testing tasks for both repositories (80% coverage requirement)
- [x] CI/CD tasks for both repositories
- [x] Documentation tasks for both repositories

### Constitution Compliance ✅
- [x] Functional programming enforced (no classes except Sequelize models)
- [x] TypeScript strict mode configuration included
- [x] Repository pattern with functional composition
- [x] Result type for error handling
- [x] Component type separation (core/shared/features) for Frontend
- [x] API-to-domain model mapping for Frontend
- [x] 80% test coverage requirement enforced
- [x] Yarn package manager specified

### Dependency Validation ✅
- [x] Phase dependencies clearly documented
- [x] Module dependencies clearly documented (Products → Orders → Payments)
- [x] Within-phase step ordering clearly documented
- [x] Parallel opportunities identified and marked
- [x] No circular dependencies

---

## Next Steps

### 1. Review This Task Breakdown
Please review the 294 tasks to ensure:
- All required functionality is covered
- Task granularity is appropriate
- Dependencies make sense
- File paths match your preferred structure

### 2. Choose Implementation Strategy
Select one of:
- **Sequential**: Solo developer, 6-8 weeks
- **Parallel Team**: 2 developers, 4-5 weeks
- **MVP-First**: Products only, then expand (4-5 weeks for MVP)
- **Agile Sprints**: 9 weeks in 6 sprints

### 3. Setup Development Environment
- Follow quickstart.md for detailed setup instructions
- Create both repositories (bakery-cms-api and bakery-cms-web)
- Setup MySQL database
- Install required tools (Node.js 18+, Yarn 3+, MySQL 8+)

### 4. Begin Implementation
Start with:
- Backend: T001 (Create backend repository)
- Frontend: T131 (Create frontend repository) - can start in parallel

### 5. Track Progress
- Check off tasks as completed `- [x]`
- Update this file regularly
- Run tests frequently to maintain coverage
- Commit regularly with clear messages

### 6. Validation Points
Stop and validate at these checkpoints:
- After T053: Database schema complete
- After T103: All backend modules complete
- After T130: Backend fully tested
- After T221: All frontend components complete
- After T251: Frontend fully tested
- After T294: Full integration complete

---

## Questions or Concerns?

If you need:
- **Clarification on specific tasks**: Check plan.md for detailed implementation steps
- **Technical guidance**: Refer to constitution.md for principles and patterns
- **Testing examples**: See quickstart.md for testing procedures
- **API specifications**: Check contracts/ directory for OpenAPI specs

**Ready to start implementation?** Begin with T001! 🚀
