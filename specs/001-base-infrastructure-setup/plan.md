# Implementation Plan: Base Infrastructure Setup

**Branch**: `001-base-infrastructure-setup` | **Date**: December 16, 2025 | **Spec**: [Project Proposal](../../docs/proposol.md)
**Input**: Project proposal and constitution requirements

**Note**: This is the foundational infrastructure setup for the Bakery-CMS application.

## Summary

**Primary Requirement**: Establish the complete development infrastructure for Bakery-CMS, a Cookie Sales Management Application for small businesses and freelancers. This includes setting up two separate repositories (Backend API and Frontend Web), implementing the monorepo structure for backend with TypeScript and functional programming patterns, configuring databases, establishing CI/CD pipelines, and creating the foundational project structure that adheres to the project constitution.

**Technical Approach**: 
- Backend: Node.js + TypeScript + Express.js monorepo (api, common, database packages) with functional programming paradigm
- Frontend: React + TypeScript with functional components and strict architectural patterns (core/shared/detail)
- Database: MySQL with Sequelize ORM
- Package Management: Yarn (Berry/v3+)
- Infrastructure: Terraform for IaC, GitHub Actions for CI/CD
- Testing: Jest for backend, React Testing Library for frontend, minimum 80% coverage

## Technical Context

**Language/Version**: TypeScript 5.0+ with Node.js 18+ (Backend), TypeScript 5.0+ with React 18 (Frontend)  
**Primary Dependencies**: 
- Backend: Express.js 4.x, Sequelize 6.x, MySQL2, Joi (validation), neverthrow (Result type)
- Frontend: React 18, Axios, React Router, Zustand (state management)
- Testing: Jest, Supertest, React Testing Library
- Build: TypeScript Compiler, Vite (Frontend), ts-node (Backend dev)

**Storage**: MySQL 8.0+ with Sequelize ORM for relational data (products, orders, payments, order items)

**Testing**: 
- Backend: Jest for unit tests, Supertest for integration tests
- Frontend: Jest + React Testing Library for component tests
- Minimum 80% coverage requirement (NON-NEGOTIABLE per constitution)

**Target Platform**: 
- Backend: Node.js API server on Linux/Docker
- Frontend: Web Browser (modern browsers supporting ES2020+)

**Project Type**: Two-Repository Structure
- Backend: Monorepo with packages (api, common, database)
- Frontend: Single-page application (SPA)

**Performance Goals**: 
- API response time: < 200ms p95 (per constitution)
- Database queries: < 100ms p95
- Frontend initial load: < 2 seconds
- Time to Interactive: < 3 seconds

**Constraints**: 
- Functional programming paradigm (NON-NEGOTIABLE per constitution)
- TypeScript strict mode enabled (no `any` types)
- No class-based patterns (pure functions only)
- Backend monorepo structure: packages/api, packages/common, packages/database
- Frontend component types: core/shared/detail (strict separation)
- Yarn package manager (Berry/v3+)
- No secrets in code (environment variables only)
- Repository pattern with functional composition
- Result type for error handling

**Scale/Scope**: 
- Initial MVP supporting 1-10 concurrent users
- ~10 API endpoints (products, orders, payments, statistics)
- 4 core entities (Product, Order, OrderItem, Payment)
- ~15-20 React components (core + shared + detail)
- 2 business models (made-to-order, ready-to-sell)
- Database: ~4 tables with relationships

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Backend Checks ✅
- [x] **Functional programming paradigm enforced**: Pure functions, immutability, function composition
- [x] **TypeScript strict mode enabled**: All projects use `strict: true` in tsconfig.json
- [x] **No class-based patterns**: Only functions and types, no classes except Sequelize models
- [x] **Monorepo structure**: packages/api, packages/common, packages/database
- [x] **Sequelize ORM for data access**: Database layer uses Sequelize with functional repository pattern
- [x] **Repository pattern using functional composition**: Repositories return functions, not classes
- [x] **Service layer with pure functions**: Business logic in pure, testable functions
- [x] **Result type for error handling**: Using neverthrow library for Result<T, E> pattern
- [x] **Yarn package manager**: Yarn Berry/v3+ for all dependencies
- [x] **No secrets in code**: Environment variables via dotenv, no hardcoded credentials

### Frontend Checks ✅
- [x] **React functional components only**: No class components, hooks-based architecture
- [x] **Component types clearly defined**: src/components/{core,shared,features} structure
- [x] **Functional programming in React**: Hooks, immutable state updates, pure components
- [x] **TypeScript strict mode enabled**: strict: true in tsconfig.json
- [x] **API responses mapped to domain models**: Separate types for API responses and domain models
- [x] **Axios for HTTP client**: Configured instance with interceptors
- [x] **Type-first development**: Prefer `type` over `interface`
- [x] **Yarn package manager**: Yarn Berry/v3+ for dependency management

### Universal Checks ✅
- [x] **Test coverage ≥ 80%**: Jest configured with coverage reporting, enforced in CI
- [x] **Security-first configuration**: No secrets, input validation, parameterized queries
- [x] **No any types**: TypeScript strict mode prevents implicit any
- [x] **Explicit return types**: All public functions declare return types

### Constants and Enums Management ✅
- [x] **Enums for related constant groups**: OrderStatus, PaymentMethod, BusinessType
- [x] **Const with as const for config**: Immutable configuration objects
- [x] **Proper naming conventions**: SCREAMING_SNAKE_CASE for constants, PascalCase for enums

**Status**: ✅ ALL GATE CHECKS PASSED

**Justification**: This is the base infrastructure setup, establishing the foundation that enforces all constitution requirements. All subsequent features will inherit these patterns and constraints.

## Project Structure

## Project Structure

### Documentation (this feature)

```text
specs/001-base-infrastructure-setup/
├── plan.md              # This file - implementation plan
├── data-model.md        # Entity definitions and database schema
├── quickstart.md        # Setup and testing guide
└── contracts/           # API specifications (OpenAPI)
    ├── products.openapi.yml
    ├── orders.openapi.yml
    └── payments.openapi.yml
```

### Source Code - Backend Repository (bakery-cms-api)

**Repository Root Structure:**
```text
bakery-cms-api/
├── packages/
│   ├── api/                      # Express.js API server
│   │   ├── src/
│   │   │   ├── server.ts         # Application entry point
│   │   │   ├── app.ts            # Express app configuration
│   │   │   ├── modules/          # Feature modules
│   │   │   │   ├── products/
│   │   │   │   │   ├── handlers/
│   │   │   │   │   │   └── products.handlers.ts
│   │   │   │   │   ├── services/
│   │   │   │   │   │   └── products.services.ts
│   │   │   │   │   ├── repositories/
│   │   │   │   │   │   └── products.repositories.ts
│   │   │   │   │   ├── validators/
│   │   │   │   │   │   └── products.validators.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   └── products.dto.ts
│   │   │   │   │   ├── mappers/
│   │   │   │   │   │   └── products.mappers.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── products.types.ts
│   │   │   │   │   └── routes.ts
│   │   │   │   ├── orders/
│   │   │   │   │   └── [same structure as products]
│   │   │   │   ├── payments/
│   │   │   │   │   └── [same structure as products]
│   │   │   │   └── statistics/
│   │   │   │       └── [same structure as products]
│   │   │   ├── middleware/
│   │   │   │   ├── error-handler.ts
│   │   │   │   ├── validation.ts
│   │   │   │   ├── auth.ts
│   │   │   │   └── rate-limiter.ts
│   │   │   ├── config/
│   │   │   │   ├── database.ts
│   │   │   │   ├── app.ts
│   │   │   │   └── env.ts
│   │   │   └── utils/
│   │   │       ├── result.ts
│   │   │       ├── logger.ts
│   │   │       └── error-factory.ts
│   │   ├── tests/
│   │   │   ├── integration/
│   │   │   │   ├── products.test.ts
│   │   │   │   ├── orders.test.ts
│   │   │   │   └── payments.test.ts
│   │   │   └── unit/
│   │   │       ├── services/
│   │   │       └── repositories/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── common/                   # Shared types and constants
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── product.types.ts
│   │   │   │   ├── order.types.ts
│   │   │   │   ├── payment.types.ts
│   │   │   │   └── result.types.ts
│   │   │   ├── enums/
│   │   │   │   ├── index.ts
│   │   │   │   ├── order.enums.ts
│   │   │   │   ├── payment.enums.ts
│   │   │   │   └── product.enums.ts
│   │   │   └── constants/
│   │   │       ├── index.ts
│   │   │       ├── config.constants.ts
│   │   │       ├── http.constants.ts
│   │   │       ├── api.constants.ts
│   │   │       └── error.constants.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── database/                 # Database models and migrations
│       ├── src/
│       │   ├── models/
│       │   │   ├── index.ts
│       │   │   ├── product.model.ts
│       │   │   ├── order.model.ts
│       │   │   ├── order-item.model.ts
│       │   │   └── payment.model.ts
│       │   ├── migrations/
│       │   │   ├── 20251216000001-create-products.ts
│       │   │   ├── 20251216000002-create-orders.ts
│       │   │   ├── 20251216000003-create-order-items.ts
│       │   │   └── 20251216000004-create-payments.ts
│       │   ├── seeders/
│       │   │   └── 20251216000001-seed-products.ts
│       │   └── config/
│       │       └── database.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # CI pipeline
│       └── deploy.yml            # Deployment pipeline
├── .env.example
├── package.json                  # Root package.json for workspace
├── yarn.lock
├── tsconfig.base.json            # Base TypeScript config
├── jest.config.js                # Jest configuration
├── .eslintrc.js                  # ESLint configuration
├── .prettierrc                   # Prettier configuration
└── README.md
```

### Source Code - Frontend Repository (bakery-cms-web)

**Repository Root Structure:**
```text
bakery-cms-web/
├── src/
│   ├── components/
│   │   ├── core/                 # Atomic UI components
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.types.ts
│   │   │   │   ├── Button.styles.css
│   │   │   │   └── Button.test.tsx
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Spinner/
│   │   │   ├── ErrorMessage/
│   │   │   └── index.ts
│   │   │
│   │   ├── shared/               # Composite reusable components
│   │   │   ├── ProductCard/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductCard.types.ts
│   │   │   │   └── ProductCard.test.tsx
│   │   │   ├── OrderSummary/
│   │   │   ├── PaymentQR/
│   │   │   ├── StatisticsChart/
│   │   │   └── index.ts
│   │   │
│   │   └── features/             # Feature-specific components
│   │       ├── products/
│   │       │   ├── ProductList/
│   │       │   │   ├── ProductList.tsx
│   │       │   │   ├── ProductList.types.ts
│   │       │   │   └── ProductList.test.tsx
│   │       │   ├── ProductDetail/
│   │       │   ├── ProductForm/
│   │       │   └── index.ts
│   │       ├── orders/
│   │       │   ├── OrderList/
│   │       │   ├── OrderDetail/
│   │       │   ├── CreateOrder/
│   │       │   └── index.ts
│   │       ├── payments/
│   │       │   ├── PaymentProcess/
│   │       │   ├── PaymentHistory/
│   │       │   └── index.ts
│   │       └── statistics/
│   │           ├── Dashboard/
│   │           ├── RevenueChart/
│   │           └── index.ts
│   │
│   ├── services/                 # API services
│   │   ├── api/
│   │   │   └── client.ts         # Axios instance configuration
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── statistics.service.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── api/                  # API response types
│   │   │   ├── product.api.ts
│   │   │   ├── order.api.ts
│   │   │   ├── payment.api.ts
│   │   │   └── statistics.api.ts
│   │   ├── models/               # Domain models
│   │   │   ├── product.model.ts
│   │   │   ├── order.model.ts
│   │   │   ├── payment.model.ts
│   │   │   └── statistics.model.ts
│   │   ├── mappers/              # API to Model mappers
│   │   │   ├── product.mapper.ts
│   │   │   ├── order.mapper.ts
│   │   │   ├── payment.mapper.ts
│   │   │   └── statistics.mapper.ts
│   │   └── common/
│   │       ├── result.types.ts
│   │       └── error.types.ts
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useProducts.ts
│   │   ├── useOrders.ts
│   │   ├── usePayments.ts
│   │   └── useStatistics.ts
│   │
│   ├── store/                    # Zustand stores
│   │   ├── productStore.ts
│   │   ├── orderStore.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── pages/
│   │   ├── ProductsPage.tsx
│   │   ├── OrdersPage.tsx
│   │   ├── PaymentsPage.tsx
│   │   ├── StatisticsPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── tests/
│   ├── components/
│   │   ├── core/
│   │   ├── shared/
│   │   └── features/
│   ├── integration/
│   │   └── user-flows.test.tsx
│   └── unit/
│       ├── services/
│       ├── hooks/
│       └── utils/
│
├── public/
│   └── vite.svg
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── yarn.lock
├── .eslintrc.cjs
├── .prettierrc
├── .env.example
└── README.md
```

**Structure Decision**: Two-repository architecture selected based on constitution requirements for clear Backend/Frontend separation. Backend uses monorepo structure with Turborepo for managing packages (api, common, database). Frontend is a standard React SPA with Vite. Both repositories follow strict functional programming patterns and TypeScript-first development.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: No violations

This infrastructure setup fully complies with all constitution requirements. No simpler alternatives are rejected because this IS the simplest approach that satisfies all requirements:
- Functional programming is enforced from the start
- Monorepo structure prevents architectural drift
- TypeScript strict mode catches errors early
- Component type separation ensures maintainability

---

## Implementation Steps

### Step 1: Code Structure Setup

#### Backend Structure (bakery-cms-api)

**packages/common/src/**
```text
enums/
  order.enums.ts          # OrderStatus, OrderType, BusinessModel
  payment.enums.ts        # PaymentMethod, PaymentStatus
  product.enums.ts        # BusinessType, ProductStatus
constants/
  config.constants.ts     # MAX_ORDER_ITEMS, PAGE_SIZE, etc.
  http.constants.ts       # HTTP_STATUS codes
  api.constants.ts        # API_ROUTES, API_VERSION
  error.constants.ts      # ERROR_MESSAGES, ERROR_CODES
types/
  product.types.ts        # Product, ProductRepository, ProductService
  order.types.ts          # Order, OrderItem, OrderRepository, OrderService
  payment.types.ts        # Payment, PaymentRepository, PaymentService
  result.types.ts         # Result<T, E> type definitions
  error.types.ts          # AppError, ErrorCode types
```

**packages/database/src/**
```text
models/
  product.model.ts        # Sequelize Product model
  order.model.ts          # Sequelize Order model
  order-item.model.ts     # Sequelize OrderItem model
  payment.model.ts        # Sequelize Payment model
  index.ts                # Model initialization and associations
migrations/
  20251216000001-create-products.ts
  20251216000002-create-orders.ts
  20251216000003-create-order-items.ts
  20251216000004-create-payments.ts
seeders/
  20251216000001-seed-products.ts
config/
  database.config.ts      # Sequelize configuration
```

**packages/api/src/modules/**

Each module (products, orders, payments, statistics) follows this structure:
```text
[module]/
  handlers/
    [module].handlers.ts       # Express request handlers
  services/
    [module].services.ts       # Business logic (pure functions)
  repositories/
    [module].repositories.ts   # Data access (functional composition)
  validators/
    [module].validators.ts     # Input validation (Joi schemas)
  dto/
    [module].dto.ts           # Data transfer objects
  mappers/
    [module].mappers.ts       # Entity ↔ DTO transformations
  types/
    [module].types.ts         # Module-specific types
  routes.ts                   # Express router configuration
```

#### Frontend Structure (bakery-cms-web)

**src/components/**
```text
core/                         # Atomic UI components
  Button/, Input/, Card/, Modal/, Spinner/, ErrorMessage/
  
shared/                       # Composite reusable components
  ProductCard/, OrderSummary/, PaymentQR/, StatisticsChart/
  
features/                     # Feature-specific components
  products/
    ProductList/, ProductDetail/, ProductForm/
  orders/
    OrderList/, OrderDetail/, CreateOrder/
  payments/
    PaymentProcess/, PaymentHistory/
  statistics/
    Dashboard/, RevenueChart/
```

**src/services/**
```text
api/
  client.ts                   # Axios instance configuration
product.service.ts            # Product API service
order.service.ts              # Order API service
payment.service.ts            # Payment API service
statistics.service.ts         # Statistics API service
```

**src/types/**
```text
api/                          # API response types
  product.api.ts, order.api.ts, payment.api.ts
models/                       # Domain models
  product.model.ts, order.model.ts, payment.model.ts
mappers/                      # API to Model mappers
  product.mapper.ts, order.mapper.ts, payment.mapper.ts
common/
  result.types.ts, error.types.ts
```

---

### Step 2: Data Types Setup

#### Backend Types (packages/common/src/types/)

**result.types.ts**
```typescript
// Using neverthrow library for Result type
import { Result, Ok, Err } from 'neverthrow';

export type { Result };
export { ok, err } from 'neverthrow';

export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;
```

**error.types.ts**
```typescript
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export type AppError = {
  code: ErrorCode;
  statusCode: number;
  message: string;
  isOperational: boolean;
  details?: unknown;
  stack?: string;
};

export type ValidationErrorDetail = {
  field: string;
  message: string;
  value?: unknown;
};
```

**product.types.ts**
```typescript
import { BusinessType, ProductStatus } from '../enums/product.enums';
import { Result } from './result.types';

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductDTO = {
  name: string;
  description?: string;
  price: number;
  category?: string;
  businessType: BusinessType;
  imageUrl?: string;
};

export type UpdateProductDTO = Partial<CreateProductDTO> & {
  status?: ProductStatus;
};

export type ProductFilters = {
  status?: ProductStatus;
  businessType?: BusinessType;
  category?: string;
  page?: number;
  limit?: number;
};

// Repository function type
export type ProductRepository = {
  findById: (id: string) => Promise<Product | null>;
  findAll: (filters?: ProductFilters) => Promise<Product[]>;
  create: (data: CreateProductDTO) => Promise<Product>;
  update: (id: string, data: UpdateProductDTO) => Promise<Product>;
  delete: (id: string) => Promise<void>;
  count: (filters?: ProductFilters) => Promise<number>;
};

// Service function type
export type ProductService = {
  create: (data: CreateProductDTO) => Promise<Result<Product>>;
  getById: (id: string) => Promise<Result<Product>>;
  getAll: (filters?: ProductFilters) => Promise<Result<{ products: Product[]; total: number }>>;
  update: (id: string, data: UpdateProductDTO) => Promise<Result<Product>>;
  delete: (id: string) => Promise<Result<void>>;
};
```

**order.types.ts**
```typescript
import { OrderStatus, OrderType, BusinessModel } from '../enums/order.enums';
import { Result } from './result.types';

export type Order = {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  businessModel: BusinessModel;
  totalAmount: number;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOrderItemDTO = {
  productId: string;
  quantity: number;
};

export type CreateOrderDTO = {
  orderType: OrderType;
  businessModel: BusinessModel;
  items: CreateOrderItemDTO[];
  customerName?: string;
  customerPhone?: string;
  notes?: string;
};

export type UpdateOrderDTO = {
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  items?: CreateOrderItemDTO[];
};

export type OrderFilters = {
  status?: OrderStatus;
  orderType?: OrderType;
  businessModel?: BusinessModel;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
};

export type OrderRepository = {
  findById: (id: string) => Promise<Order | null>;
  findAll: (filters?: OrderFilters) => Promise<Order[]>;
  create: (data: CreateOrderDTO) => Promise<Order>;
  update: (id: string, data: UpdateOrderDTO) => Promise<Order>;
  updateStatus: (id: string, status: OrderStatus) => Promise<Order>;
  delete: (id: string) => Promise<void>;
  count: (filters?: OrderFilters) => Promise<number>;
};

export type OrderService = {
  create: (data: CreateOrderDTO) => Promise<Result<Order>>;
  getById: (id: string) => Promise<Result<Order>>;
  getAll: (filters?: OrderFilters) => Promise<Result<{ orders: Order[]; total: number }>>;
  update: (id: string, data: UpdateOrderDTO) => Promise<Result<Order>>;
  confirmOrder: (id: string) => Promise<Result<Order>>;
  cancelOrder: (id: string) => Promise<Result<Order>>;
};
```

**payment.types.ts**
```typescript
import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';
import { Result } from './result.types';

export type Payment = {
  id: string;
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  qrCodeData: string | null;
  transactionRef: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePaymentDTO = {
  orderId: string;
  paymentMethod: PaymentMethod;
  amount: number;
};

export type PaymentRepository = {
  findById: (id: string) => Promise<Payment | null>;
  findByOrderId: (orderId: string) => Promise<Payment | null>;
  create: (data: CreatePaymentDTO) => Promise<Payment>;
  updateStatus: (id: string, status: PaymentStatus) => Promise<Payment>;
  markAsPaid: (id: string, transactionRef?: string) => Promise<Payment>;
};

export type PaymentService = {
  create: (data: CreatePaymentDTO) => Promise<Result<Payment>>;
  getByOrderId: (orderId: string) => Promise<Result<Payment>>;
  markAsPaid: (paymentId: string, transactionRef?: string) => Promise<Result<Payment>>;
  generateVietQR: (payment: Payment) => Promise<Result<string>>;
};
```

#### Frontend Types

Similar structure but with separate API response types and mappers as shown in data-model.md.

---

### Step 3: Database Models (Sequelize)

**packages/database/src/models/product.model.ts**
```typescript
import { DataTypes, Model, Sequelize } from 'sequelize';
import { BusinessType, ProductStatus } from '@bakery-cms/common/enums';

export type ProductAttributes = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  businessType: BusinessType;
  status: ProductStatus;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class ProductModel extends Model<ProductAttributes> implements ProductAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare category: string | null;
  declare businessType: BusinessType;
  declare status: ProductStatus;
  declare imageUrl: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initProductModel = (sequelize: Sequelize): typeof ProductModel => {
  ProductModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      businessType: {
        type: DataTypes.ENUM(...Object.values(BusinessType)),
        allowNull: false,
        field: 'business_type',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(ProductStatus)),
        allowNull: false,
        defaultValue: ProductStatus.AVAILABLE,
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'image_url',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'products',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['status'] },
        { fields: ['business_type'] },
        { fields: ['category'] },
      ],
    }
  );

  return ProductModel;
};
```

Similar Sequelize models for Order, OrderItem, and Payment following the same pattern.

---

### Step 4: Migration Files

**packages/database/src/migrations/20251216000001-create-products.ts**
```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('products', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    business_type: {
      type: DataTypes.ENUM('made-to-order', 'ready-to-sell', 'both'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('available', 'out-of-stock'),
      allowNull: false,
      defaultValue: 'available',
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes
  await queryInterface.addIndex('products', ['status']);
  await queryInterface.addIndex('products', ['business_type']);
  await queryInterface.addIndex('products', ['category']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('products');
};
```

**packages/database/src/migrations/20251216000002-create-orders.ts**
```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('orders', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    order_type: {
      type: DataTypes.ENUM('temporary', 'official'),
      allowNull: false,
      defaultValue: 'temporary',
    },
    business_model: {
      type: DataTypes.ENUM('made-to-order', 'ready-to-sell'),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('draft', 'confirmed', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Add indexes
  await queryInterface.addIndex('orders', ['order_number'], { unique: true });
  await queryInterface.addIndex('orders', ['status']);
  await queryInterface.addIndex('orders', ['created_at']);
  await queryInterface.addIndex('orders', ['order_type']);
  await queryInterface.addIndex('orders', ['business_model']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('orders');
};
```

**packages/database/src/migrations/20251216000003-create-order-items.ts**
```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('order_items', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes
  await queryInterface.addIndex('order_items', ['order_id']);
  await queryInterface.addIndex('order_items', ['product_id']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('order_items');
};
```

**packages/database/src/migrations/20251216000004-create-payments.ts**
```typescript
import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('payments', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'orders',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    payment_method: {
      type: DataTypes.ENUM('vietqr', 'cash', 'bank-transfer'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    qr_code_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transaction_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes
  await queryInterface.addIndex('payments', ['order_id'], { unique: true });
  await queryInterface.addIndex('payments', ['status']);
  await queryInterface.addIndex('payments', ['transaction_ref'], { 
    unique: true,
    where: { transaction_ref: { [Op.ne]: null } }
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('payments');
};
```

---

### Step 5: Seed Data

**packages/database/src/seeders/20251216000001-seed-products.ts**
```typescript
import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const now = new Date();
  
  await queryInterface.bulkInsert('products', [
    {
      id: uuidv4(),
      name: 'Chocolate Chip Cookie',
      description: 'Classic chocolate chip cookie with Belgian chocolate',
      price: 5000,
      category: 'Classic',
      business_type: 'both',
      status: 'available',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      name: 'Oatmeal Raisin Cookie',
      description: 'Healthy oatmeal cookie with raisins',
      price: 4500,
      category: 'Healthy',
      business_type: 'made-to-order',
      status: 'available',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      name: 'Double Chocolate Cookie',
      description: 'Extra chocolate cookie for chocolate lovers',
      price: 6000,
      category: 'Premium',
      business_type: 'ready-to-sell',
      status: 'available',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
  ]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('products', {});
};
```

---

### Step 6: Business Functions/Components

#### Backend Service Functions (Functional Programming)

**packages/api/src/modules/products/services/products.services.ts**
```typescript
import { ProductRepository, CreateProductDTO, UpdateProductDTO, Product } from '@bakery-cms/common/types';
import { ok, err, Result } from '@bakery-cms/common/types/result.types';
import { AppError } from '@bakery-cms/common/types/error.types';
import { validateProductData, validateProductId } from '../validators/products.validators';
import { createNotFoundError, createValidationError } from '../../../utils/error-factory';

// Pure function - Create product
export const createProduct = (repository: ProductRepository) => 
  async (data: CreateProductDTO): Promise<Result<Product, AppError>> => {
    // Validation
    const validationResult = validateProductData(data);
    if (!validationResult.success) {
      return err(createValidationError(validationResult.error));
    }

    // Business logic (data access)
    try {
      const product = await repository.create(data);
      return ok(product);
    } catch (error) {
      return err(handleDatabaseError(error));
    }
  };

// Pure function - Get product by ID
export const getProductById = (repository: ProductRepository) =>
  async (id: string): Promise<Result<Product, AppError>> => {
    // Validation
    const validationResult = validateProductId(id);
    if (!validationResult.success) {
      return err(createValidationError(validationResult.error));
    }

    // Data access
    try {
      const product = await repository.findById(id);
      
      if (!product) {
        return err(createNotFoundError('Product not found', { productId: id }));
      }
      
      return ok(product);
    } catch (error) {
      return err(handleDatabaseError(error));
    }
  };

// Pure function - Get all products with filters
export const getAllProducts = (repository: ProductRepository) =>
  async (filters?: ProductFilters): Promise<Result<{ products: Product[]; total: number }, AppError>> => {
    try {
      const [products, total] = await Promise.all([
        repository.findAll(filters),
        repository.count(filters),
      ]);
      
      return ok({ products, total });
    } catch (error) {
      return err(handleDatabaseError(error));
    }
  };

// Factory function - Create product service
export const createProductService = (repository: ProductRepository): ProductService => ({
  create: createProduct(repository),
  getById: getProductById(repository),
  getAll: getAllProducts(repository),
  update: updateProduct(repository),
  delete: deleteProduct(repository),
});
```

**packages/api/src/modules/products/repositories/products.repositories.ts**
```typescript
import { ProductModel } from '@bakery-cms/database/models';
import { ProductRepository, Product, CreateProductDTO, ProductFilters } from '@bakery-cms/common/types';

// Functional repository - no classes
export const createProductRepository = (): ProductRepository => {
  const findById = async (id: string): Promise<Product | null> => {
    const product = await ProductModel.findByPk(id);
    return product ? product.toJSON() as Product : null;
  };

  const findAll = async (filters?: ProductFilters): Promise<Product[]> => {
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.businessType) where.businessType = filters.businessType;
    if (filters?.category) where.category = filters.category;

    const limit = filters?.limit || 20;
    const offset = ((filters?.page || 1) - 1) * limit;

    const products = await ProductModel.findAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return products.map(p => p.toJSON() as Product);
  };

  const create = async (data: CreateProductDTO): Promise<Product> => {
    const product = await ProductModel.create(data);
    return product.toJSON() as Product;
  };

  const update = async (id: string, data: UpdateProductDTO): Promise<Product> => {
    const product = await ProductModel.findByPk(id);
    if (!product) throw new Error('Product not found');
    
    await product.update(data);
    return product.toJSON() as Product;
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await ProductModel.destroy({ where: { id } });
  };

  const count = async (filters?: ProductFilters): Promise<number> => {
    const where: any = {};
    
    if (filters?.status) where.status = filters.status;
    if (filters?.businessType) where.businessType = filters.businessType;
    if (filters?.category) where.category = filters.category;

    return await ProductModel.count({ where });
  };

  return {
    findById,
    findAll,
    create,
    update,
    delete: deleteProduct,
    count,
  };
};
```

#### Frontend Components (Functional React)

**src/components/features/products/ProductList/ProductList.tsx**
```typescript
import { useState, useEffect } from 'react';
import { Product } from '../../../../types/models/product.model';
import { AppError } from '../../../../types/common/error.types';
import { productService } from '../../../../services/product.service';
import { ProductCard } from '../../../shared/ProductCard/ProductCard';
import { Spinner } from '../../../core/Spinner/Spinner';
import { ErrorMessage } from '../../../core/ErrorMessage/ErrorMessage';
import { ProductListProps } from './ProductList.types';

export const ProductList = ({ filters }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      const result = await productService.getAll(filters);
      
      if (result.success) {
        setProducts(result.data.products);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchProducts();
  }, [filters]);

  const handleAddToCart = async (productId: string) => {
    // Add to cart logic
    console.log('Add to cart:', productId);
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  if (products.length === 0) return <div>No products found</div>;

  return (
    <div className="product-list">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
        />
      ))}
    </div>
  );
};
```

**src/services/product.service.ts**
```typescript
import { AxiosInstance } from 'axios';
import { Result } from '../types/common/result.types';
import { Product } from '../types/models/product.model';
import { ProductAPIResponse } from '../types/api/product.api';
import { mapProductFromAPI } from '../types/mappers/product.mapper';
import { ok, err } from '../types/common/result.types';
import { handleAPIError } from '../utils/error-handler';

export type ProductService = {
  getAll: (filters?: any) => Promise<Result<{ products: Product[]; total: number }>>;
  getById: (id: string) => Promise<Result<Product>>;
  create: (data: any) => Promise<Result<Product>>;
  update: (id: string, data: any) => Promise<Result<Product>>;
  delete: (id: string) => Promise<Result<void>>;
};

export const createProductService = (client: AxiosInstance): ProductService => ({
  getAll: async (filters) => {
    try {
      const response = await client.get<{ products: ProductAPIResponse[]; total: number }>('/products', {
        params: filters,
      });
      
      const products = response.data.products.map(mapProductFromAPI);
      return ok({ products, total: response.data.total });
    } catch (error) {
      return err(handleAPIError(error));
    }
  },

  getById: async (id) => {
    try {
      const response = await client.get<ProductAPIResponse>(`/products/${id}`);
      const product = mapProductFromAPI(response.data);
      return ok(product);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },

  create: async (data) => {
    try {
      const response = await client.post<ProductAPIResponse>('/products', data);
      const product = mapProductFromAPI(response.data);
      return ok(product);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },

  update: async (id, data) => {
    try {
      const response = await client.put<ProductAPIResponse>(`/products/${id}`, data);
      const product = mapProductFromAPI(response.data);
      return ok(product);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },

  delete: async (id) => {
    try {
      await client.delete(`/products/${id}`);
      return ok(undefined);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },
});
```

---

### Step 7: Logic Implementation

#### Order Creation Logic Flow

**Operation**: Create Order

**Input**:
- `CreateOrderDTO`: orderType, businessModel, items[], customerName?, customerPhone?, notes?

**Process**:
1. Validate input data (Joi schema)
2. Validate all products exist and are available
3. Calculate unit prices from current product prices
4. Calculate subtotals for each item
5. Calculate total order amount
6. Generate unique order number (ORD-YYYYMMDD-XXXX)
7. Create order in transaction
8. Create all order items in transaction
9. Return created order with items

**Output**:
- Success: `Result<Order>`
- Error: `Result` with AppError (validation, not found, internal)

**Error Handling**:
- Validation Error → 400 with field details
- Product Not Found → 404
- Product Out of Stock → 422 (business rule violation)
- Database Error → 500

**Example Implementation**:
```typescript
export const createOrder = (orderRepo: OrderRepository, productRepo: ProductRepository) =>
  async (data: CreateOrderDTO): Promise<Result<Order, AppError>> => {
    // 1. Validate input
    const validation = validateCreateOrderData(data);
    if (!validation.success) {
      return err(createValidationError(validation.error));
    }

    // 2. Validate products exist and available
    const productIds = data.items.map(item => item.productId);
    const products = await productRepo.findByIds(productIds);
    
    if (products.length !== productIds.length) {
      return err(createNotFoundError('Some products not found'));
    }

    const unavailableProducts = products.filter(p => p.status !== ProductStatus.AVAILABLE);
    if (unavailableProducts.length > 0) {
      return err(createBusinessRuleError('Some products are out of stock'));
    }

    // 3-4. Calculate prices and subtotals
    const itemsWithPrices = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal: item.quantity * product.price,
      };
    });

    // 5. Calculate total
    const totalAmount = itemsWithPrices.reduce((sum, item) => sum + item.subtotal, 0);

    // 6. Generate order number
    const orderNumber = generateOrderNumber();

    // 7-8. Create order with items (in transaction)
    try {
      const order = await orderRepo.create({
        orderNumber,
        orderType: data.orderType,
        businessModel: data.businessModel,
        totalAmount,
        status: OrderStatus.DRAFT,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        items: itemsWithPrices,
      });

      return ok(order);
    } catch (error) {
      return err(handleDatabaseError(error));
    }
  };
```

---

### Step 8: Unit Tests

#### Backend Tests

**packages/api/src/modules/products/tests/products.services.test.ts**
```typescript
import { createProductService } from '../services/products.services';
import { ProductRepository } from '@bakery-cms/common/types';
import { BusinessType, ProductStatus } from '@bakery-cms/common/enums';

describe('Product Service', () => {
  let mockRepository: jest.Mocked<ProductRepository>;
  let productService: ProductService;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };
    
    productService = createProductService(mockRepository);
  });

  describe('createProduct', () => {
    it('should create product with valid data', async () => {
      const productData = {
        name: 'Test Cookie',
        price: 5000,
        businessType: BusinessType.BOTH,
      };

      const createdProduct = {
        id: 'uuid',
        ...productData,
        status: ProductStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(createdProduct);

      const result = await productService.create(productData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Cookie');
      }
    });

    it('should reject invalid data', async () => {
      const invalidData = {
        name: '',  // Empty name
        price: -100,  // Negative price
        businessType: 'invalid' as any,
      };

      const result = await productService.create(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const product = {
        id: 'uuid',
        name: 'Test Cookie',
        price: 5000,
        businessType: BusinessType.BOTH,
        status: ProductStatus.AVAILABLE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findById.mockResolvedValue(product);

      const result = await productService.getById('uuid');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('uuid');
      }
    });

    it('should return not found for invalid ID', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await productService.getById('invalid-uuid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
```

**Test Coverage Requirements**:
- [ ] Product Service: create, getById, getAll, update, delete
- [ ] Product Repository: all CRUD operations
- [ ] Order Service: create, confirm, cancel, update
- [ ] Order Repository: all CRUD operations
- [ ] Payment Service: create, markAsPaid, generateVietQR
- [ ] Payment Repository: all operations
- [ ] Validators: all validation functions
- [ ] Mappers: all transformation functions

#### Frontend Tests

**src/components/features/products/ProductList/ProductList.test.tsx**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { ProductList } from './ProductList';
import { productService } from '../../../../services/product.service';
import { ok, err } from '../../../../types/common/result.types';

jest.mock('../../../../services/product.service');

describe('ProductList', () => {
  it('should render loading state initially', () => {
    render(<ProductList />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should display products after loading', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Chocolate Chip',
        price: 5000,
        businessType: 'both',
        status: 'available',
      },
    ];

    (productService.getAll as jest.Mock).mockResolvedValue(
      ok({ products: mockProducts, total: 1 })
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Chocolate Chip')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    (productService.getAll as jest.Mock).mockResolvedValue(
      err({ code: 'INTERNAL_ERROR', message: 'Server error' })
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

**Test Coverage Requirements**:
- [ ] Core Components: Button, Input, Card, Modal
- [ ] Shared Components: ProductCard, OrderSummary, PaymentQR
- [ ] Feature Components: ProductList, OrderList, PaymentProcess
- [ ] Services: all service functions
- [ ] Hooks: useProducts, useOrders, usePayments
- [ ] Mappers: all mapper functions
- [ ] Utils: formatters, validators
