# Tasks: Stock Management for CMS

**Input**: Design documents from `/specs/005-stock-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/stock-api.yaml

**Tests**: Tests are NOT explicitly requested in the feature specification. Test tasks are excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `bakery-cms-api/packages/` (api, common, database)
- **Frontend**: `bakery-cms-web/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and enums/types shared across all user stories

- [X] T001 [P] Create stock enums (StockItemStatus, MovementType) in bakery-cms-api/packages/common/src/enums/stock.enums.ts
- [X] T002 [P] Export stock enums from bakery-cms-api/packages/common/src/enums/index.ts
- [X] T003 Create stock module directory structure in bakery-cms-api/packages/api/src/modules/stock/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database models and migrations that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Models

- [X] T004 [P] Create Brand model in bakery-cms-api/packages/database/src/models/brand.model.ts
- [X] T005 [P] Create StockItem model in bakery-cms-api/packages/database/src/models/stock-item.model.ts
- [X] T006 Create StockItemBrand junction model in bakery-cms-api/packages/database/src/models/stock-item-brand.model.ts
- [X] T007 Create ProductStockItem junction model in bakery-cms-api/packages/database/src/models/product-stock-item.model.ts
- [X] T008 Create StockMovement model in bakery-cms-api/packages/database/src/models/stock-movement.model.ts
- [X] T009 Export all new models from bakery-cms-api/packages/database/src/models/index.ts
- [X] T010 Define model associations in bakery-cms-api/packages/database/src/models/associations.ts

### Database Migrations

- [X] T011 [P] Create migration for brands table in bakery-cms-api/packages/database/src/migrations/[timestamp]-create-brands.ts
- [X] T012 [P] Create migration for stock_items table in bakery-cms-api/packages/database/src/migrations/[timestamp]-create-stock-items.ts
- [X] T013 Create migration for stock_item_brands table in bakery-cms-api/packages/database/src/migrations/[timestamp]-create-stock-item-brands.ts
- [X] T014 Create migration for product_stock_items table in bakery-cms-api/packages/database/src/migrations/[timestamp]-create-product-stock-items.ts
- [X] T015 Create migration for stock_movements table in bakery-cms-api/packages/database/src/migrations/[timestamp]-create-stock-movements.ts
- [X] T016 Run migrations to create all tables: `yarn migrate`

### Shared DTOs and Types

- [X] T017 [P] Create stock items DTOs in bakery-cms-api/packages/api/src/modules/stock/dto/stock-items.dto.ts
- [X] T018 [P] Create brands DTOs in bakery-cms-api/packages/api/src/modules/stock/dto/brands.dto.ts
- [X] T019 [P] Create stock movements DTOs in bakery-cms-api/packages/api/src/modules/stock/dto/stock-movements.dto.ts
- [X] T020 [P] Create product-stock DTOs in bakery-cms-api/packages/api/src/modules/stock/dto/product-stock.dto.ts

### Frontend Types Foundation

- [X] T021 [P] Create stock API response types in bakery-cms-web/src/types/api/stock.api.ts
- [X] T022 [P] Create stock domain models in bakery-cms-web/src/types/models/stock.model.ts
- [X] T023 Create stock data mappers in bakery-cms-web/src/types/mappers/stock.mapper.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Manage Stock Items (Priority: P1) 🎯 MVP

**Goal**: Create and manage stock items with name, description, unit of measure, and quantity

**Independent Test**: Create a stock item "Flour" with 100 units, verify it appears in the stock list with correct values

### Backend Implementation for User Story 1

- [X] T024 [P] [US1] Create stock items validators in bakery-cms-api/packages/api/src/modules/stock/validators/stock-items.validators.ts
- [X] T025 [P] [US1] Create stock items mappers in bakery-cms-api/packages/api/src/modules/stock/mappers/stock-items.mappers.ts
- [X] T026 [US1] Create stock items repository in bakery-cms-api/packages/api/src/modules/stock/repositories/stock-items.repositories.ts
- [X] T027 [US1] Create stock items service with CRUD operations in bakery-cms-api/packages/api/src/modules/stock/services/stock-items.services.ts
- [X] T028 [US1] Create stock items handlers in bakery-cms-api/packages/api/src/modules/stock/handlers/stock-items.handlers.ts
- [X] T029 [US1] Create stock items routes (GET, POST, PATCH, DELETE, restore) in bakery-cms-api/packages/api/src/modules/stock/routes.ts
- [X] T030 [US1] Register stock routes in main app router bakery-cms-api/packages/api/src/app.ts

### Frontend Implementation for User Story 1

- [X] T031 [US1] Create stock service with stockItems CRUD methods in bakery-cms-web/src/services/stock.service.ts
- [X] T032 [US1] Create useStockItems custom hook in bakery-cms-web/src/hooks/useStockItems.ts
- [X] T033 [P] [US1] Create StockItemList component in bakery-cms-web/src/components/features/stock/StockItemList/StockItemList.tsx
- [X] T034 [P] [US1] Create StockItemForm component in bakery-cms-web/src/components/features/stock/StockItemForm/StockItemForm.tsx
- [X] T035 [US1] Create StockItemsPage in bakery-cms-web/src/pages/stock/StockItemsPage.tsx
- [X] T036 [US1] Add stock routes to React Router in bakery-cms-web/src/App.tsx or routes config
- [X] T037 [US1] Add Stock Items menu item to CMS navigation sidebar

**Checkpoint**: User Story 1 complete - can create, list, edit, delete stock items

---

## Phase 4: User Story 2 - Manage Brands and Brand Pricing (Priority: P1)

**Goal**: Associate multiple brands with each stock item where each brand has its own pricing (before/after tax)

**Independent Test**: Add "Brand A" (45000 VND) and "Brand B" (42000 VND) to a stock item, verify both display with prices

### Backend Implementation for User Story 2

- [X] T038 [P] [US2] Create brands validators in bakery-cms-api/packages/api/src/modules/stock/validators/brands.validators.ts
- [X] T039 [P] [US2] Create brands mappers in bakery-cms-api/packages/api/src/modules/stock/mappers/brands.mappers.ts
- [X] T040 [US2] Create brands repository in bakery-cms-api/packages/api/src/modules/stock/repositories/brands.repositories.ts
- [X] T041 [US2] Create stock-item-brands repository in bakery-cms-api/packages/api/src/modules/stock/repositories/stock-item-brands.repositories.ts
- [X] T042 [US2] Create brands service with CRUD operations in bakery-cms-api/packages/api/src/modules/stock/services/brands.services.ts
- [X] T043 [US2] Create brands handlers in bakery-cms-api/packages/api/src/modules/stock/handlers/brands.handlers.ts
- [X] T044 [US2] Add brands routes to bakery-cms-api/packages/api/src/modules/stock/routes.ts
- [X] T045 [US2] Add stock item brands endpoints (/stock-items/:id/brands) to routes.ts
- [X] T046 [US2] Update stock items service to include brands when fetching details in stock-items.services.ts

### Frontend Implementation for User Story 2

- [X] T047 [US2] Add brand methods to stock service in bakery-cms-web/src/services/stock.service.ts
- [X] T048 [US2] Create useBrands custom hook in bakery-cms-web/src/hooks/useBrands.ts
- [X] T049 [P] [US2] Create BrandManagement component in bakery-cms-web/src/components/features/stock/BrandManagement/BrandManagement.tsx
- [X] T050 [P] [US2] Create StockItemDetail component with brand list in bakery-cms-web/src/components/features/stock/StockItemDetail/StockItemDetail.tsx
- [X] T051 [US2] Create BrandsPage in bakery-cms-web/src/pages/stock/BrandsPage.tsx
- [X] T052 [US2] Create StockItemDetailPage in bakery-cms-web/src/pages/stock/StockItemDetailPage.tsx
- [X] T053 [US2] Add brand management to StockItemForm (add/remove brands with pricing)
- [X] T054 [US2] Add Brands menu item to CMS navigation sidebar

**Checkpoint**: User Story 2 complete - can manage brands and assign with prices to stock items

---

## Phase 5: User Story 3 - Link Stock Items to Products (Priority: P1)

**Goal**: Define which stock items and quantities are required to create each product (recipe/BOM)

**Independent Test**: Link "Flour: 200g", "Butter: 50g" to product "Croissant", verify recipe displays on product page

### Backend Implementation for User Story 3

- [X] T055 [P] [US3] Create product-stock validators in bakery-cms-api/packages/api/src/modules/stock/validators/product-stock.validators.ts
- [X] T056 [P] [US3] Create product-stock mappers in bakery-cms-api/packages/api/src/modules/stock/mappers/product-stock.mappers.ts
- [X] T057 [US3] Create product-stock-items repository in bakery-cms-api/packages/api/src/modules/stock/repositories/product-stock-items.repositories.ts
- [X] T058 [US3] Create product-stock service with recipe management in bakery-cms-api/packages/api/src/modules/stock/services/product-stock.services.ts
- [X] T059 [US3] Create product-stock handlers in bakery-cms-api/packages/api/src/modules/stock/handlers/product-stock.handlers.ts
- [X] T060 [US3] Add product stock items routes (/products/:id/stock-items, /products/:id/cost) to routes.ts
- [X] T061 [US3] Implement product cost calculation endpoint in product-stock.services.ts
- [X] T062 [US3] Add deletion protection to stock items (warn if linked to products)

### Frontend Implementation for User Story 3

- [X] T063 [US3] Add product-stock methods to stock service in bakery-cms-web/src/services/stock.service.ts
- [X] T064 [US3] Create useProductRecipe custom hook in bakery-cms-web/src/hooks/useProductRecipe.ts
- [X] T065 [US3] Create ProductRecipe component in bakery-cms-web/src/components/features/stock/ProductRecipe/ProductRecipe.tsx
- [X] T066 [US3] Add ProductRecipe component to existing ProductDetail page integration
- [X] T067 [US3] Display product cost calculation based on linked stock items and brand prices

**Checkpoint**: User Story 3 complete - can define product recipes and calculate costs

---

## Phase 6: User Story 4 - Stock Quantity Tracking (Priority: P2)

**Goal**: Track stock quantities with low-stock alerts when items fall below reorder threshold

**Independent Test**: Set reorder threshold to 50, reduce quantity below 50, verify low-stock warning appears

### Backend Implementation for User Story 4

- [X] T068 [US4] Update stock items service to compute status based on quantity and threshold in stock-items.services.ts
- [X] T069 [US4] Add receive stock endpoint handler in stock-items.handlers.ts
- [X] T070 [US4] Add adjust stock endpoint handler in stock-items.handlers.ts
- [X] T071 [US4] Implement negative stock prevention in stock receive/adjust operations
- [X] T072 [US4] Add low-stock items filtering to stock items list endpoint
- [X] T073 [US4] Create stock movements records when receiving/adjusting stock

### Frontend Implementation for User Story 4

- [X] T074 [US4] Add receive/adjust stock methods to stock service in bakery-cms-web/src/services/stock.service.ts
- [X] T075 [US4] Create LowStockDashboard component in bakery-cms-web/src/components/features/stock/LowStockDashboard/LowStockDashboard.tsx
- [X] T076 [US4] Add stock status badges (Available, Low Stock, Out of Stock) to StockItemList
- [ ] T077 [US4] Add receive/adjust stock modal/form to StockItemDetail page
- [ ] T078 [US4] Integrate LowStockDashboard widget into main dashboard (if exists)

**Checkpoint**: User Story 4 complete - stock quantities tracked with low-stock alerts

---

## Phase 7: User Story 5 - Stock Movement History (Priority: P3)

**Goal**: View history of all stock movements (additions, deductions, adjustments) with audit trail

**Independent Test**: Perform add, remove, adjust operations, verify all appear in movement history with timestamps and reasons

### Backend Implementation for User Story 5

- [X] T079 [P] [US5] Create stock movements validators in bakery-cms-api/packages/api/src/modules/stock/validators/stock-movements.validators.ts
- [X] T080 [P] [US5] Create stock movements mappers in bakery-cms-api/packages/api/src/modules/stock/mappers/stock-movements.mappers.ts
- [X] T081 [US5] Create stock movements repository in bakery-cms-api/packages/api/src/modules/stock/repositories/stock-movements.repositories.ts
- [X] T082 [US5] Create stock movements service with list/filter operations in bakery-cms-api/packages/api/src/modules/stock/services/stock-movements.services.ts
- [X] T083 [US5] Create stock movements handlers in bakery-cms-api/packages/api/src/modules/stock/handlers/stock-movements.handlers.ts
- [X] T084 [US5] Add stock movements routes (GET list, GET by id) to routes.ts
- [X] T085 [US5] Ensure all stock changes create movement records with user reference

### Frontend Implementation for User Story 5

- [X] T086 [US5] Add stock movements methods to stock service in bakery-cms-web/src/services/stock.service.ts
- [X] T087 [US5] Create useStockMovements custom hook in bakery-cms-web/src/hooks/useStockMovements.ts
- [X] T088 [US5] Create StockMovementHistory component in bakery-cms-web/src/components/features/stock/StockMovementHistory/StockMovementHistory.tsx
- [X] T089 [US5] Create StockMovementsPage in bakery-cms-web/src/pages/stock/StockMovementsPage.tsx
- [ ] T090 [US5] Add StockMovementHistory tab to StockItemDetail page
- [ ] T091 [US5] Add Stock Movements menu item to CMS navigation sidebar

**Checkpoint**: User Story 5 complete - full audit trail for all stock movements

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T092 [P] Add search functionality to stock items list (by name, brand name)
- [ ] T093 [P] Add pagination to all list views (stock items, brands, movements)
- [ ] T094 [P] Add sorting options to stock items list
- [ ] T095 Implement role-based access control (ADMIN/MANAGER only for stock management)
- [ ] T096 Add bulk import for stock items via CSV (FR-015)
- [ ] T097 [P] Add loading states and error handling to all frontend components
- [ ] T098 [P] Add form validation with user-friendly error messages
- [ ] T099 Code cleanup, refactoring, and documentation
- [ ] T100 Run quickstart.md validation - test complete user flows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (can run parallel to US1)
- **User Story 3 (Phase 5)**: Depends on Foundational phase; may integrate with US1/US2 for stock item data
- **User Story 4 (Phase 6)**: Depends on US1 completion (needs stock items to track)
- **User Story 5 (Phase 7)**: Depends on US4 completion (needs stock operations to record)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Run In Parallel With |
|-------|------------|--------------------------|
| US1 (Stock Items) | Foundational | US2, US3 |
| US2 (Brands) | Foundational | US1, US3 |
| US3 (Product Links) | Foundational + US1 entities | US2 (after foundation) |
| US4 (Quantity Tracking) | US1 complete | - |
| US5 (Movement History) | US4 complete | - |

### Within Each User Story

- Validators and mappers can run in parallel
- Repository before service
- Service before handlers
- Handlers before routes
- Backend before frontend (for that story)

### Parallel Opportunities

**Phase 2 (Foundational)**:
- T004 (Brand model) || T005 (StockItem model)
- T011 (brands migration) || T012 (stock_items migration)
- T017-T020 (all DTOs) in parallel
- T021-T022 (frontend types) in parallel

**Phase 3-5 (US1-US3)**:
- All three user stories can start in parallel after Foundational
- Within each story: validators || mappers
- Frontend components marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# After Foundational completes, launch US1 backend in order:
1. T024 (validators) || T025 (mappers)
2. T026 (repository)
3. T027 (service)
4. T028 (handlers)
5. T029 (routes)
6. T030 (register routes)

# Then launch US1 frontend:
7. T031 (stock service)
8. T032 (hook)
9. T033 (StockItemList) || T034 (StockItemForm)
10. T035 (page)
11. T036 (routes) + T037 (nav)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Manage Stock Items)
4. **STOP and VALIDATE**: Test stock item CRUD independently
5. Deploy/demo if ready - basic stock management is functional

### Incremental Delivery

1. **MVP**: Setup + Foundational + US1 → Basic stock item management
2. **+US2**: Add brand pricing → Multi-supplier cost tracking
3. **+US3**: Add product links → Recipe/BOM management with cost calculation
4. **+US4**: Add quantity tracking → Low-stock alerts
5. **+US5**: Add movement history → Full audit trail

### Parallel Team Strategy

With multiple developers after Foundational is complete:
- **Developer A**: User Story 1 (Stock Items)
- **Developer B**: User Story 2 (Brands)
- **Developer C**: User Story 3 (Product Links)

Then sequentially:
- US4 → US5 (depends on previous stories)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend paths: bakery-cms-api/packages/{api,common,database}/src/
- Frontend paths: bakery-cms-web/src/
