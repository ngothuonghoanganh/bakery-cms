# Implementation Plan: Stock Management for CMS

**Branch**: `005-stock-management` | **Date**: 2025-12-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-stock-management/spec.md`

## Summary

Stock Management feature enables tracking of raw materials/components (stock items) used to create bakery products. Each stock item can have multiple brand sources with different pricing (before/after tax). Products are linked to stock items via recipes (bill of materials), enabling cost calculations and inventory tracking. The feature includes stock quantity tracking with low-stock alerts and movement history for audit trails.

## Technical Context

**Language/Version**: TypeScript 5.3+ (Node.js 16+)
**Primary Dependencies**: Express.js, Sequelize ORM, neverthrow (Result type), Joi (validation)
**Storage**: MySQL (via Sequelize)
**Testing**: Jest (backend), Vitest (frontend)
**Target Platform**: Web application (REST API + React SPA)
**Project Type**: Web (monorepo backend + separate frontend repo)
**Performance Goals**: API responses < 200ms (p95), Database queries < 100ms (p95)
**Constraints**: Pagination max 100 items, Rate limiting 100 requests/15 minutes
**Scale/Scope**: Small business CMS, 1000+ stock items, 500+ products

### Frontend Stack
- **Framework**: React 19 with TypeScript
- **UI Library**: Ant Design 5.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router DOM 6.x
- **Build Tool**: Vite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence/Notes |
|-----------|--------|----------------|
| **Functional Programming (NON-NEGOTIABLE)** | ✅ PASS | Will use pure functions, factory functions for services/repositories, Result type for error handling |
| **SOLID Principles** | ✅ PASS | Handlers/Services/Repositories separation, dependency injection via factory functions |
| **Type-Driven Development** | ✅ PASS | Using `type` over `interface`, strict TypeScript, explicit return types |
| **Immutability** | ✅ PASS | Spread operators for updates, no parameter mutation |
| **Module Organization** | ✅ PASS | Stock module with handlers/, services/, repositories/, dto/, mappers/, validators/ |
| **Sequelize for ORM** | ✅ PASS | All new models use Sequelize with migrations |
| **Soft Delete Pattern** | ✅ PASS | All entities use paranoid: true with deletedAt field |
| **Result Type Error Handling** | ✅ PASS | Using neverthrow for all service operations |
| **React Functional Components** | ✅ PASS | All frontend components will be functional with hooks |
| **Component Types (Core/Shared/Detail)** | ✅ PASS | Stock feature uses Detail components with Core/Shared from existing library |
| **API to Domain Model Mapping** | ✅ PASS | Mappers transform API responses to domain models |
| **80% Test Coverage** | ✅ PASS | Unit tests for services, integration tests for APIs |
| **Security (JWT, RBAC, Input Validation)** | ✅ PASS | Admin/Manager role restriction, Joi validation |

**Gate Result**: ✅ PASSED - No constitution violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/005-stock-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── stock-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
# Backend (bakery-cms-api)
bakery-cms-api/
├── packages/
│   ├── api/src/
│   │   └── modules/
│   │       └── stock/                    # NEW: Stock module
│   │           ├── handlers/
│   │           │   ├── stock-items.handlers.ts
│   │           │   ├── brands.handlers.ts
│   │           │   └── stock-movements.handlers.ts
│   │           ├── services/
│   │           │   ├── stock-items.services.ts
│   │           │   ├── brands.services.ts
│   │           │   ├── stock-movements.services.ts
│   │           │   └── product-stock.services.ts
│   │           ├── repositories/
│   │           │   ├── stock-items.repositories.ts
│   │           │   ├── brands.repositories.ts
│   │           │   ├── stock-item-brands.repositories.ts
│   │           │   ├── product-stock-items.repositories.ts
│   │           │   └── stock-movements.repositories.ts
│   │           ├── dto/
│   │           │   ├── stock-items.dto.ts
│   │           │   ├── brands.dto.ts
│   │           │   └── stock-movements.dto.ts
│   │           ├── mappers/
│   │           │   ├── stock-items.mappers.ts
│   │           │   ├── brands.mappers.ts
│   │           │   └── stock-movements.mappers.ts
│   │           ├── validators/
│   │           │   ├── stock-items.validators.ts
│   │           │   ├── brands.validators.ts
│   │           │   └── stock-movements.validators.ts
│   │           └── routes.ts
│   │
│   ├── common/src/
│   │   └── enums/
│   │       └── stock.enums.ts            # NEW: Stock-related enums
│   │
│   └── database/src/
│       ├── models/
│       │   ├── stock-item.model.ts       # NEW
│       │   ├── brand.model.ts            # NEW
│       │   ├── stock-item-brand.model.ts # NEW (junction with pricing)
│       │   ├── product-stock-item.model.ts # NEW (product recipe)
│       │   └── stock-movement.model.ts   # NEW (audit trail)
│       └── migrations/
│           ├── YYYYMMDD-create-stock-items.ts
│           ├── YYYYMMDD-create-brands.ts
│           ├── YYYYMMDD-create-stock-item-brands.ts
│           ├── YYYYMMDD-create-product-stock-items.ts
│           └── YYYYMMDD-create-stock-movements.ts

# Frontend (bakery-cms-web)
bakery-cms-web/
├── src/
│   ├── components/
│   │   └── features/
│   │       └── stock/                    # NEW: Stock feature components
│   │           ├── StockItemList/
│   │           ├── StockItemForm/
│   │           ├── StockItemDetail/
│   │           ├── BrandManagement/
│   │           ├── ProductRecipe/
│   │           ├── StockMovementHistory/
│   │           └── LowStockDashboard/
│   │
│   ├── pages/
│   │   └── stock/                        # NEW: Stock pages
│   │       ├── StockItemsPage.tsx
│   │       ├── StockItemDetailPage.tsx
│   │       ├── BrandsPage.tsx
│   │       └── StockMovementsPage.tsx
│   │
│   ├── services/
│   │   └── stock.service.ts              # NEW: Stock API service
│   │
│   ├── types/
│   │   ├── api/
│   │   │   └── stock.api.ts              # NEW: Stock API response types
│   │   ├── models/
│   │   │   └── stock.model.ts            # NEW: Stock domain models
│   │   └── mappers/
│   │       └── stock.mapper.ts           # NEW: Stock data mappers
│   │
│   └── hooks/
│       ├── useStockItems.ts              # NEW
│       ├── useBrands.ts                  # NEW
│       └── useStockMovements.ts          # NEW
```

**Structure Decision**: Following existing monorepo structure for backend (bakery-cms-api) with packages/api, packages/common, packages/database. Frontend follows existing bakery-cms-web structure with components/features, pages, services, and types directories.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
