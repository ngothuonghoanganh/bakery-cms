# Tasks: Soft Delete Implementation

**Input**: Design documents from `/specs/002-soft-delete-implementation/`
**Prerequisites**: plan.md, specification.md, data-model.md, diagrams.md, testing-guide.md, quickstart.md

**Organization**: Tasks organized by functional area following 8-step implementation approach. This is an UPDATE to existing modules, focusing on enhancing delete operations with soft delete functionality.

---

## Task Format

Each task follows this format:
```
- [ ] [TaskID] [P?] [Story?] Description with exact file path
```

Where:
- `[TaskID]`: Sequential task ID (T001, T002...)
- `[P]`: Optional marker for parallelizable tasks
- `[Story]`: User story label ([US1], [US2], [US3], [US4])
- Description: Clear action with exact file path

Example:
```
- [ ] T001 Create soft delete types in packages/common/src/types/soft-delete.types.ts
- [ ] T015 [P] [US2] Implement soft delete for Product repository
```

---

## Phase 1: Setup & Foundation

**Purpose**: Shared infrastructure that enables soft delete across all entities

**Critical Gate**: This phase MUST complete before any entity-specific implementation

### Step 1: Create Shared Types

- [X] T001 [P] Create soft delete types file in packages/common/src/types/soft-delete.types.ts
- [X] T002 [P] Define SoftDeletable type in packages/common/src/types/soft-delete.types.ts
- [X] T003 [P] Define SoftDeleteFilter type in packages/common/src/types/soft-delete.types.ts
- [X] T004 [P] Define SoftDeleteMetadata type in packages/common/src/types/soft-delete.types.ts
- [X] T005 [P] Define WithDeleted utility type in packages/common/src/types/soft-delete.types.ts
- [X] T006 Export soft delete types from packages/common/src/index.ts

### Step 2: Database Schema Migration

- [X] T007 Create migration file packages/database/src/migrations/YYYYMMDDHHMMSS-add-soft-delete-fields.ts
- [X] T008 Implement up() function to add deletedAt columns to products, orders, order_items, payments tables
- [X] T009 Add indexes on deletedAt columns for all 4 tables in migration up()
- [X] T010 Add partial indexes (WHERE deleted_at IS NULL) for all 4 tables in migration up()
- [X] T011 Update orders.order_number unique constraint to exclude deleted records in migration up()
- [X] T012 Update payments.order_id unique constraint to exclude deleted records in migration up()
- [X] T013 Implement down() function to rollback all schema changes
- [X] T014 Run migration in development environment: cd bakery-cms-api && npm run migrate:up
- [X] T015 Verify migration success by checking table schema
- [X] T016 Test migration rollback: npm run migrate:down
- [X] T017 Re-run migration for development work: npm run migrate:up

**Checkpoint**: ✅ Foundation ready - database schema updated, types available, entity-specific work can begin

---

## Phase 2: User Story 1 - Product Soft Delete (Priority: P1) 🎯 MVP

**Goal**: Enable soft delete for Products with restore capability

**Independent Test**: Create product → Delete product → Verify not in list → Restore product → Verify back in list

### Step 1: Update Product Model

- [X] T018 [US1] Add deletedAt field to ProductModel class in packages/database/src/models/product.model.ts
- [X] T019 [US1] Add deletedAt to model initialization in initProductModel() in packages/database/src/models/product.model.ts
- [X] T020 [US1] Configure defaultScope to filter deleted records in packages/database/src/models/product.model.ts
- [X] T021 [US1] Add withDeleted scope to ProductModel in packages/database/src/models/product.model.ts
- [X] T022 [US1] Add onlyDeleted scope to ProductModel in packages/database/src/models/product.model.ts
- [X] T023 [US1] Add deletedAt index to model configuration in packages/database/src/models/product.model.ts

### Step 2: Update Product Repository

- [X] T024 [P] [US1] Implement deleteProduct function (soft delete) in packages/api/src/modules/products/repositories/products.repositories.ts
- [X] T025 [P] [US1] Implement restoreProduct function in packages/api/src/modules/products/repositories/products.repositories.ts
- [X] T026 [P] [US1] Implement forceDeleteProduct function (hard delete) in packages/api/src/modules/products/repositories/products.repositories.ts
- [X] T027 [US1] Export new repository functions from packages/api/src/modules/products/repositories/products.repositories.ts
- [X] T028 [US1] Update ProductRepository type definition in packages/common/src/types/product.types.ts to include delete, restore, forceDelete

### Step 3: Update Product Service

- [X] T029 [US1] Update deleteProduct service function to use soft delete in packages/api/src/modules/products/services/products.services.ts
- [X] T030 [US1] Add logging for soft delete operations in packages/api/src/modules/products/services/products.services.ts
- [X] T031 [P] [US1] Implement restoreProduct service function in packages/api/src/modules/products/services/products.services.ts
- [X] T032 [US1] Export restoreProduct from service in packages/api/src/modules/products/services/products.services.ts
- [X] T033 [US1] Update ProductService type definition in packages/common/src/types/product.types.ts to include restoreProduct

### Step 4: Update Product Tests

- [X] T034 [P] [US1] Write test for soft delete in packages/api/src/modules/products/repositories/products.repositories.test.ts
- [X] T035 [P] [US1] Write test for restore in packages/api/src/modules/products/repositories/products.repositories.test.ts
- [X] T036 [P] [US1] Write test for force delete in packages/api/src/modules/products/repositories/products.repositories.test.ts
- [X] T037 [P] [US1] Write test for defaultScope filtering in packages/api/src/modules/products/repositories/products.repositories.test.ts
- [ ] T038 [P] [US1] Write test for withDeleted scope in packages/api/src/modules/products/tests/products.repositories.test.ts
- [ ] T039 [P] [US1] Write service tests for soft delete in packages/api/src/modules/products/tests/products.services.test.ts
- [ ] T040 [P] [US1] Write service tests for restore in packages/api/src/modules/products/tests/products.services.test.ts
- [ ] T041 [P] [US1] Write integration test for DELETE /api/products/:id in packages/api/src/modules/products/tests/products.integration.test.ts
- [ ] T042 [US1] Run Product tests to verify 80% coverage: cd bakery-cms-api && npm test -- products
- [ ] T043 [US1] Fix any failing Product tests

**Checkpoint**: ✅ Product soft delete fully functional and independently tested

---

## Phase 3: User Story 2 - Order Soft Delete with Cascade (Priority: P1) 🎯 MVP

**Goal**: Enable soft delete for Orders with automatic cascade to OrderItems and Payment

**Independent Test**: Create order with items → Delete order → Verify order, items, and payment all soft deleted → Restore order → Verify all restored

### Step 1: Update Order Model

- [X] T044 [US2] Add deletedAt field to OrderModel class in packages/database/src/models/order.model.ts
- [X] T045 [US2] Add deletedAt to model initialization in initOrderModel() in packages/database/src/models/order.model.ts
- [X] T046 [US2] Configure defaultScope to filter deleted records in packages/database/src/models/order.model.ts
- [X] T047 [US2] Add withDeleted scope to OrderModel in packages/database/src/models/order.model.ts
- [X] T048 [US2] Add onlyDeleted scope to OrderModel in packages/database/src/models/order.model.ts
- [X] T049 [US2] Add deletedAt index to model configuration in packages/database/src/models/order.model.ts

### Step 2: Update OrderItem Model

- [X] T050 [P] [US2] Add deletedAt field to OrderItemModel class in packages/database/src/models/order-item.model.ts
- [X] T051 [P] [US2] Add deletedAt to model initialization in initOrderItemModel() in packages/database/src/models/order-item.model.ts
- [X] T052 [P] [US2] Configure defaultScope to filter deleted records in packages/database/src/models/order-item.model.ts
- [X] T053 [P] [US2] Add withDeleted scope to OrderItemModel in packages/database/src/models/order-item.model.ts
- [X] T054 [P] [US2] Add onlyDeleted scope to OrderItemModel in packages/database/src/models/order-item.model.ts

### Step 3: Update Order Repository with Cascade Logic

- [X] T055 [US2] Implement deleteOrder function with transaction-based cascade in packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T056 [US2] Implement soft delete for Order in transaction in packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T057 [US2] Implement cascade soft delete for OrderItems in transaction in packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T058 [US2] Implement cascade soft delete for Payment in transaction in packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T059 [US2] Add transaction commit/rollback error handling in packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T060 [P] [US2] Implement restoreOrder function with cascade in packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T061 [US2] Export new repository functions from packages/api/src/modules/orders/repositories/orders.repositories.ts
- [X] T062 [US2] Update OrderRepository type definition in packages/common/src/types/order.types.ts

### Step 4: Update Order Service

- [X] T063 [US2] Update deleteOrder service to check DRAFT status business rule in packages/api/src/modules/orders/services/orders.services.ts
- [X] T064 [US2] Update deleteOrder service to use repository soft delete in packages/api/src/modules/orders/services/orders.services.ts
- [X] T065 [US2] Add logging for cascade soft delete operations in packages/api/src/modules/orders/services/orders.services.ts
- [X] T066 [P] [US2] Implement restoreOrder service function in packages/api/src/modules/orders/services/orders.services.ts
- [X] T067 [US2] Export restoreOrder from service in packages/api/src/modules/orders/services/orders.services.ts
- [X] T068 [US2] Update OrderService type definition in packages/common/src/types/order.types.ts

### Step 5: Update Order Tests

- [ ] T069 [P] [US2] Write test for cascade soft delete in packages/api/src/modules/orders/tests/orders.repositories.test.ts
- [ ] T070 [P] [US2] Write test verifying OrderItems are soft deleted in packages/api/src/modules/orders/tests/orders.repositories.test.ts
- [ ] T071 [P] [US2] Write test verifying Payment is soft deleted in packages/api/src/modules/orders/tests/orders.repositories.test.ts
- [ ] T072 [P] [US2] Write test for transaction rollback on error in packages/api/src/modules/orders/tests/orders.repositories.test.ts
- [ ] T073 [P] [US2] Write test for cascade restore in packages/api/src/modules/orders/tests/orders.repositories.test.ts
- [ ] T074 [P] [US2] Write service test for DRAFT order deletion in packages/api/src/modules/orders/tests/orders.services.test.ts
- [ ] T075 [P] [US2] Write service test rejecting non-DRAFT order deletion in packages/api/src/modules/orders/tests/orders.services.test.ts
- [ ] T076 [P] [US2] Write service tests for restore in packages/api/src/modules/orders/tests/orders.services.test.ts
- [ ] T077 [P] [US2] Write integration test for DELETE /api/orders/:id in packages/api/src/modules/orders/tests/orders.integration.test.ts
- [X] T078 [US2] Run Order tests to verify 80% coverage: cd bakery-cms-api && npm test -- orders
- [X] T079 [US2] Fix any failing Order tests

**Checkpoint**: ✅ Order soft delete with cascade fully functional and independently tested

---

## Phase 4: User Story 3 - Payment Soft Delete (Priority: P1) 🎯 MVP

**Goal**: Enable soft delete for Payments (independent operation)

**Independent Test**: Create payment → Delete payment → Verify not in queries → Restore payment → Verify restored

### Step 1: Update Payment Model

- [ ] T080 [US3] Add deletedAt field to PaymentModel class in packages/database/src/models/payment.model.ts
- [ ] T081 [US3] Add deletedAt to model initialization in initPaymentModel() in packages/database/src/models/payment.model.ts
- [ ] T082 [US3] Configure defaultScope to filter deleted records in packages/database/src/models/payment.model.ts
- [ ] T083 [US3] Add withDeleted scope to PaymentModel in packages/database/src/models/payment.model.ts
- [ ] T084 [US3] Add onlyDeleted scope to PaymentModel in packages/database/src/models/payment.model.ts
- [ ] T085 [US3] Add deletedAt index to model configuration in packages/database/src/models/payment.model.ts

### Step 2: Update Payment Repository

- [ ] T086 [P] [US3] Implement deletePayment function (soft delete) in packages/api/src/modules/payments/repositories/payments.repositories.ts
- [ ] T087 [P] [US3] Implement restorePayment function in packages/api/src/modules/payments/repositories/payments.repositories.ts
- [ ] T088 [US3] Export new repository functions from packages/api/src/modules/payments/repositories/payments.repositories.ts
- [ ] T089 [US3] Update PaymentRepository type definition in packages/common/src/types/payment.types.ts

### Step 3: Update Payment Service

- [ ] T090 [US3] Update deletePayment service function to use soft delete in packages/api/src/modules/payments/services/payments.services.ts
- [ ] T091 [US3] Add logging for soft delete operations in packages/api/src/modules/payments/services/payments.services.ts
- [ ] T092 [P] [US3] Implement restorePayment service function in packages/api/src/modules/payments/services/payments.services.ts
- [ ] T093 [US3] Export restorePayment from service in packages/api/src/modules/payments/services/payments.services.ts
- [ ] T094 [US3] Update PaymentService type definition in packages/common/src/types/payment.types.ts

### Step 4: Update Payment Tests

- [ ] T095 [P] [US3] Write test for soft delete in packages/api/src/modules/payments/tests/payments.repositories.test.ts
- [ ] T096 [P] [US3] Write test for restore in packages/api/src/modules/payments/tests/payments.repositories.test.ts
- [ ] T097 [P] [US3] Write test for defaultScope filtering in packages/api/src/modules/payments/tests/payments.repositories.test.ts
- [ ] T098 [P] [US3] Write service tests for soft delete in packages/api/src/modules/payments/tests/payments.services.test.ts
- [ ] T099 [P] [US3] Write service tests for restore in packages/api/src/modules/payments/tests/payments.services.test.ts
- [ ] T100 [P] [US3] Write integration test for DELETE /api/payments/:id in packages/api/src/modules/payments/tests/payments.integration.test.ts
- [ ] T101 [US3] Run Payment tests to verify 80% coverage: cd bakery-cms-api && npm test -- payments
- [ ] T102 [US3] Fix any failing Payment tests

**Checkpoint**: ✅ Payment soft delete fully functional and independently tested

---

## Phase 5: User Story 4 - Migration Testing & Validation (Priority: P1) 🎯 MVP

**Goal**: Comprehensive testing of migration and overall soft delete functionality

**Independent Test**: Full migration cycle testing and cross-entity validation

### Step 1: Migration Tests

- [ ] T103 [P] [US4] Create migration test file packages/database/src/migrations/__tests__/soft-delete-migration.test.ts
- [ ] T104 [P] [US4] Write test verifying deletedAt column added to all tables
- [ ] T105 [P] [US4] Write test verifying indexes created on deletedAt columns
- [ ] T106 [P] [US4] Write test verifying partial indexes created
- [ ] T107 [P] [US4] Write test verifying unique constraint updates
- [ ] T108 [P] [US4] Write test for migration rollback (down function)
- [ ] T109 [US4] Run migration tests: cd bakery-cms-api && npm test -- migrations

### Step 2: Integration Tests

- [ ] T110 [P] [US4] Write integration test for Product soft delete → list query filtering
- [ ] T111 [P] [US4] Write integration test for Order cascade soft delete verification
- [ ] T112 [P] [US4] Write integration test for Payment independent soft delete
- [ ] T113 [P] [US4] Write integration test for restore operations across entities
- [ ] T114 [P] [US4] Write integration test for unique constraint with soft delete
- [ ] T115 [US4] Run all integration tests: cd bakery-cms-api && npm test -- integration

### Step 3: Performance Validation

- [ ] T116 [P] [US4] Test delete operation performance (<200ms p95)
- [ ] T117 [P] [US4] Test query performance with soft delete filtering (<5% overhead)
- [ ] T118 [US4] Run performance tests and validate against success metrics

### Step 4: Backward Compatibility

- [ ] T119 [US4] Run full test suite to ensure no regressions: cd bakery-cms-api && npm test
- [ ] T120 [US4] Verify all existing tests pass with soft delete enabled
- [ ] T121 [US4] Test all existing DELETE endpoints return 204 (no breaking changes)

**Checkpoint**: ✅ Migration and full integration tested, backward compatibility verified

---

## Phase 6: Documentation & Polish (Priority: P2)

**Purpose**: Update documentation and finalize implementation

### Step 1: Documentation Updates

- [ ] T122 [P] Update API documentation in bakery-cms-api/docs/API.md to reflect soft delete behavior
- [ ] T123 [P] Update database documentation in bakery-cms-api/DATABASE_IMPLEMENTATION.md
- [ ] T124 [P] Update testing guide in bakery-cms-api/docs/TESTING_GUIDE.md with soft delete examples
- [ ] T125 [P] Update main README.md in bakery-cms-api/ to mention soft delete
- [ ] T126 Update quickstart.md validation scenarios in specs/002-soft-delete-implementation/quickstart.md

### Step 2: Code Quality

- [ ] T127 [P] Run ESLint and fix any warnings: cd bakery-cms-api && npm run lint
- [ ] T128 [P] Run TypeScript type checking: cd bakery-cms-api && npm run type-check
- [ ] T129 [P] Check test coverage meets 80% threshold: cd bakery-cms-api && npm run test:coverage
- [ ] T130 Review and optimize database indexes if needed

### Step 3: Final Validation

- [ ] T131 Follow quickstart.md testing scenarios for all entities
- [ ] T132 Verify all acceptance criteria from specification.md are met
- [ ] T133 Verify success metrics can be measured (logging, performance)
- [ ] T134 Create or update deployment runbook with migration steps
- [ ] T135 Prepare rollback plan documentation

**Checkpoint**: ✅ Documentation complete, code quality verified, ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 1 (Setup & Foundation)**: No dependencies - must complete FIRST ⚠️ BLOCKS ALL OTHER PHASES
2. **Phase 2 (Product Soft Delete)**: Depends on Phase 1
3. **Phase 3 (Order Soft Delete)**: Depends on Phase 1 (can run parallel with Phase 2)
4. **Phase 4 (Payment Soft Delete)**: Depends on Phase 1 (can run parallel with Phases 2 & 3)
5. **Phase 5 (Migration Testing)**: Depends on Phases 1-4 completion
6. **Phase 6 (Documentation)**: Depends on Phase 5 completion

### Within Each Phase (The 8 Steps)

1. **Model Updates** → Must complete first
2. **Repository Updates** → After models, many tasks can run in parallel [P]
3. **Service Updates** → After repository
4. **Tests** → After logic, many can run in parallel [P]

### Parallel Execution Opportunities

**After Phase 1 completes, these can run in parallel**:
- Phase 2 (Product) - Developer A
- Phase 3 (Order) - Developer B  
- Phase 4 (Payment) - Developer C

**Within each phase, tasks marked [P] can run simultaneously**:
- Type definitions [P]
- Repository functions [P]
- Test files [P]

### Critical Path

```
Phase 1 (T001-T017) → MUST COMPLETE FIRST
    ↓
[Phase 2 || Phase 3 || Phase 4] → Can run in parallel
    ↓
Phase 5 (T103-T121) → Integration testing
    ↓
Phase 6 (T122-T135) → Documentation & polish
```

---

## Implementation Strategy

### Recommended Approach: Sequential by Entity

**Best for small teams or solo developers:**

1. ✅ **Phase 1: Foundation** (T001-T017) - ~2-3 days
   - Setup types and run migration
   - CRITICAL: Must complete before entity work

2. ✅ **Phase 2: Product Soft Delete** (T018-T043) - ~2 days
   - Complete all 4 steps for Product
   - Validate independently before moving on

3. ✅ **Phase 3: Order Soft Delete** (T044-T079) - ~3 days
   - Most complex due to cascade logic
   - Validate cascade behavior thoroughly

4. ✅ **Phase 4: Payment Soft Delete** (T080-T102) - ~1 day
   - Simplest entity (no cascade)
   - Quick validation

5. ✅ **Phase 5: Testing & Validation** (T103-T121) - ~2 days
   - Migration tests
   - Integration tests
   - Performance validation

6. ✅ **Phase 6: Documentation** (T122-T135) - ~1 day
   - Update all docs
   - Final validation

**Total Estimate**: 11-13 days

### Alternative: Parallel by Entity

**Best for teams with 3+ developers:**

1. ✅ **Phase 1: Foundation** (T001-T017) - Team effort
   - All developers collaborate
   - ~1 day with full team

2. **Parallel Development**:
   - **Developer A**: Phase 2 (Product) - T018-T043
   - **Developer B**: Phase 3 (Order) - T044-T079
   - **Developer C**: Phase 4 (Payment) - T080-T102
   - ~3 days in parallel

3. ✅ **Phase 5: Testing** (T103-T121) - Team effort
   - Integration and validation
   - ~1-2 days

4. ✅ **Phase 6: Documentation** (T122-T135) - Can split
   - ~0.5 day

**Total Estimate**: 5-7 days with parallel development

### MVP Definition

**Minimum Viable Product includes**:
- Phase 1: Foundation (REQUIRED)
- Phase 2: Product Soft Delete (REQUIRED for MVP)
- Phase 3: Order Soft Delete (REQUIRED for MVP)
- Phase 4: Payment Soft Delete (REQUIRED for MVP)
- Phase 5: Testing (REQUIRED for MVP)
- Phase 6: Documentation (REQUIRED for completeness)

**All phases required for MVP** - This is an infrastructure update affecting core delete operations.

### Checkpoint Strategy

After each phase, validate:
1. ✅ All tests pass for that entity
2. ✅ Entity can be independently tested per user story goal
3. ✅ No regressions in existing functionality
4. ✅ Performance metrics within acceptable range

Do not proceed to next phase until current phase checkpoint is validated.

---

## Testing Strategy

### Unit Tests (Per Entity)

For each entity (Product, Order, Payment):
- Repository function tests (soft delete, restore, force delete)
- Scope filtering tests (defaultScope, withDeleted, onlyDeleted)
- Service function tests (business logic, error handling)
- Validator tests (if applicable)

### Integration Tests (Cross-Entity)

- End-to-end DELETE endpoint tests
- Cascade delete verification (Order → Items → Payment)
- Query filtering verification (deleted records excluded)
- Restore operation verification
- Unique constraint behavior with soft delete

### Migration Tests

- Migration up() success
- Migration down() rollback
- Index creation verification
- Constraint update verification
- Data integrity after migration

### Performance Tests

- Delete operation latency (<200ms p95)
- Query performance overhead (<5%)
- Transaction performance for cascade deletes
- Index efficiency verification

### Coverage Target

- **Overall**: >80% code coverage
- **New code**: 100% coverage for soft delete functionality
- **Critical paths**: 100% coverage for cascade delete logic

---

## Risk Mitigation Tasks

### Data Safety
- [ ] T015: Verify migration success before proceeding
- [ ] T016: Test migration rollback works correctly
- [ ] T072: Test transaction rollback on cascade delete errors

### Performance
- [ ] T010: Add partial indexes for query optimization
- [ ] T116-T118: Validate performance metrics

### Backward Compatibility
- [ ] T119-T121: Full regression testing
- [ ] Verify API contracts unchanged (204 responses maintained)

### Code Quality
- [ ] T127-T129: Linting, type checking, coverage validation
- [ ] All checkpoint validations before proceeding

---

## Success Criteria

Implementation is complete when:
- ✅ All 135 tasks completed
- ✅ Migration runs successfully (up and down)
- ✅ All 4 entities (Product, Order, OrderItem, Payment) have soft delete
- ✅ Cascade delete works for Order → Items → Payment
- ✅ All scopes working correctly (defaultScope, withDeleted, onlyDeleted)
- ✅ All existing tests pass (no regressions)
- ✅ New tests achieve >80% coverage
- ✅ Performance metrics met (<200ms p95, <5% overhead)
- ✅ Documentation updated
- ✅ Quickstart validation passes
- ✅ All acceptance criteria from specification.md met

---

## Parallel Execution Examples

### Example 1: Foundation Phase Parallelization

After T001-T006 (types) complete:
```bash
# Developer A
T007-T013: Create migration up()

# Developer B (parallel)
T014-T017: Test migration in dev environment
```

### Example 2: Product Phase Parallelization

After T018-T023 (model updates) complete:
```bash
# Developer A
T024-T027: Repository functions

# Developer B (parallel)
T029-T033: Service functions

# Developer C (parallel)
T034-T041: Test files
```

### Example 3: Multi-Entity Parallelization

After Phase 1 complete:
```bash
# Team A
Phase 2 (Product): T018-T043

# Team B (parallel)
Phase 3 (Order): T044-T079

# Team C (parallel)
Phase 4 (Payment): T080-T102
```

---

## Notes for Implementation

### Update vs New Feature
This is an **UPDATE** to existing functionality:
- ✅ Preserve all existing API contracts
- ✅ Maintain backward compatibility
- ✅ Enhance existing delete operations (no new endpoints needed for MVP)
- ✅ Focus on repository and service layer changes
- ⚠️ No handler changes required (DELETE endpoints work the same externally)

### Key Technical Decisions
- Using **model-level scopes** (not global paranoid mode)
- **Manual soft delete** for better control
- **Transaction-based cascade** for data consistency
- **Partial indexes** for query optimization

### Critical Success Factors
1. **Foundation First**: Phase 1 must complete before any entity work
2. **Independent Testing**: Each entity must be testable independently
3. **Cascade Logic**: Order cascade must be thoroughly tested
4. **Performance**: Monitor query performance throughout
5. **No Breaking Changes**: API responses must remain identical

---

**Ready to begin implementation!**

Suggested first steps:
1. Review all task descriptions
2. Start with Phase 1 (Foundation) - T001-T017
3. After Phase 1 checkpoint, choose sequential or parallel strategy
4. Validate checkpoint criteria after each phase
