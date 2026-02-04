# Tasks: File Upload for Products and Brands

**Input**: Design documents from `/specs/001-file-upload/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `bakery-cms-api/packages/`
- **Frontend**: `bakery-cms-web/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared types/enums for file upload feature

- [x] T001 Create file enums (FileCategory) in bakery-cms-api/packages/common/src/enums/file.enums.ts
- [x] T002 [P] Create file type definitions in bakery-cms-api/packages/common/src/types/file.types.ts
- [x] T003 [P] Add UPLOAD_DIR, MAX_IMAGE_SIZE, MAX_VIDEO_SIZE to environment config in bakery-cms-api/packages/api/src/config/env.ts
- [x] T004 [P] Create uploads directory structure at bakery-cms-api/uploads/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core file infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create File model with Sequelize in bakery-cms-api/packages/database/src/models/file.model.ts
- [x] T006 Create migration for files table in bakery-cms-api/packages/database/src/migrations/20251227000001-create-files.ts
- [x] T007 [P] Update model index to export FileModel in bakery-cms-api/packages/database/src/models/index.ts
- [x] T008 [P] Run migration to create files table
- [x] T009 Create files DTOs (CreateFileDto, FileResponseDto) in bakery-cms-api/packages/api/src/modules/files/dto/files.dto.ts
- [x] T010 [P] Create file validators (upload validation schemas) in bakery-cms-api/packages/api/src/modules/files/validators/files.validators.ts
- [x] T011 [P] Create file mappers (model to DTO transformations) in bakery-cms-api/packages/api/src/modules/files/mappers/files.mappers.ts
- [x] T012 Create file repository with CRUD operations in bakery-cms-api/packages/api/src/modules/files/repositories/files.repositories.ts
- [x] T013 Create file service with upload, delete, getById logic in bakery-cms-api/packages/api/src/modules/files/services/files.services.ts
- [x] T014 Create file handlers (upload, list, get, delete, download) in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts
- [x] T015 Configure Multer with disk storage, file filter, size limits in bakery-cms-api/packages/api/src/modules/files/middleware/multer.middleware.ts
- [x] T016 Create file routes with auth middleware in bakery-cms-api/packages/api/src/modules/files/routes.ts
- [x] T017 Register files router in main app in bakery-cms-api/packages/api/src/app.ts
- [x] T018 [P] Create frontend file API types in bakery-cms-web/src/types/api/file.api.ts
- [x] T019 [P] Create frontend file model types in bakery-cms-web/src/types/models/file.model.ts
- [x] T020 [P] Create file mapper (API to model) in bakery-cms-web/src/types/mappers/file.mapper.ts
- [x] T021 Create file service with upload, delete, getUrl methods in bakery-cms-web/src/services/file.service.ts
- [x] T022 [P] Create English translations for files in bakery-cms-web/src/i18n/locales/en.ts
- [x] T023 [P] Create Vietnamese translations for files in bakery-cms-web/src/i18n/locales/vi.ts
- [x] T024 Create shared FileUpload component in bakery-cms-web/src/components/shared/FileUpload/FileUpload.tsx
- [x] T025 [P] Create FileUpload types in bakery-cms-web/src/components/shared/FileUpload/FileUpload.types.ts
- [x] T026 [P] Create FileUpload index export in bakery-cms-web/src/components/shared/FileUpload/index.ts
- [x] T027 Create useFileUpload hook in bakery-cms-web/src/hooks/useFileUpload.ts (integrated into FileUpload component)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Upload Product Image (Priority: P1) 🎯 MVP

**Goal**: Allow sellers/managers to upload an image for a product with preview and display on product pages

**Independent Test**: Create a product, upload an image, verify preview shows, save product, verify image displays in product list and detail pages

### Backend Implementation for User Story 1

- [x] T028 [US1] Create migration to add image_file_id column to products table in bakery-cms-api/packages/database/src/migrations/20251227000002-add-image-file-to-products.ts
- [x] T029 [US1] Run migration for products image_file_id column
- [x] T030 [US1] Update Product model with imageFileId field and belongsTo association in bakery-cms-api/packages/database/src/models/product.model.ts
- [x] T031 [US1] Product image upload uses generic file upload handler (no separate handler needed)
- [x] T032 [US1] Product image upload uses generic /files route (product stores imageFileId)
- [x] T033 [US1] Update product repository to include imageFile in getProduct/getProducts with join in bakery-cms-api/packages/api/src/modules/products/repositories/products.repositories.ts
- [x] T034 [US1] Update product mappers to include imageFile in response DTOs in bakery-cms-api/packages/api/src/modules/products/mappers/products.mappers.ts
- [x] T035 [US1] Add file cleanup logic when product is deleted in bakery-cms-api/packages/api/src/modules/products/services/products.services.ts

### Frontend Implementation for User Story 1

- [x] T036 [US1] Update Product model type to include imageFile in bakery-cms-web/src/types/models/product.model.ts
- [x] T037 [US1] Update Product API types to include imageFile in bakery-cms-web/src/types/api/product.api.ts
- [x] T038 [US1] Update product mapper to map imageFile from API response in bakery-cms-web/src/types/mappers/product.mapper.ts
- [x] T039 [US1] Product image upload uses generic file service (no separate product service methods needed)
- [x] T040 [US1] Integrate FileUpload component into ProductForm for image in bakery-cms-web/src/components/features/products/ProductForm/ProductForm.tsx
- [x] T041 [US1] Add image translations to product i18n files in bakery-cms-web/src/i18n/locales/en.ts
- [x] T042 [P] [US1] Add image translations to Vietnamese product i18n in bakery-cms-web/src/i18n/locales/vi.ts
- [x] T043 [US1] Display product image in ProductTable component in bakery-cms-web/src/components/features/products/ProductTable/ProductTable.tsx
- [x] T044 [US1] Display product image in ProductDetail component in bakery-cms-web/src/components/features/products/ProductDetail/ProductDetail.tsx

**Checkpoint**: User Story 1 complete - products can have images uploaded, previewed, and displayed

---

## Phase 4: User Story 2 - Upload Brand Logo/Image (Priority: P2)

**Goal**: Allow managers to upload an image/logo for a brand for visual identification in stock management

**Independent Test**: Create a brand, upload an image, verify preview shows, save brand, verify image displays in brand list

### Backend Implementation for User Story 2

- [x] T045 [US2] Create migration to add image_file_id column to brands table in bakery-cms-api/packages/database/src/migrations/20251227000003-add-image-file-to-brands.ts
- [x] T046 [US2] Run migration for brands image_file_id column
- [x] T047 [US2] Update Brand model with imageFileId field and belongsTo association in bakery-cms-api/packages/database/src/models/brand.model.ts
- [x] T048 [US2] Brand image upload uses generic file upload handler (no separate handler needed)
- [x] T049 [US2] Brand image upload uses generic /files route (brand stores imageFileId)
- [x] T050 [US2] Update brand repository to include imageFile in getBrand/getBrands with join in bakery-cms-api/packages/api/src/modules/stock/repositories/brands.repositories.ts
- [x] T051 [US2] Update brand mappers to include imageFile in response DTOs in bakery-cms-api/packages/api/src/modules/stock/mappers/brands.mappers.ts
- [x] T052 [US2] Add file cleanup logic when brand is deleted in bakery-cms-api/packages/api/src/modules/stock/services/brands.services.ts

### Frontend Implementation for User Story 2

- [x] T053 [US2] Update Brand model type to include imageFile in bakery-cms-web/src/types/models/stock.model.ts
- [x] T054 [US2] Update Brand API types to include imageFile in bakery-cms-web/src/types/api/stock.api.ts
- [x] T055 [US2] Update brand mapper to map imageFile from API response in bakery-cms-web/src/types/mappers/stock.mapper.ts
- [x] T056 [US2] Brand image upload uses generic file service (no separate stock service methods needed)
- [x] T057 [US2] Integrate FileUpload component into inline BrandForm (brands are managed inline in StockItemDetailPage)
- [x] T058 [US2] Add brand image translations to English i18n in bakery-cms-web/src/i18n/locales/en.ts
- [x] T059 [P] [US2] Add brand image translations to Vietnamese i18n in bakery-cms-web/src/i18n/locales/vi.ts
- [x] T060 [US2] Display brand image in inline brand management (StockItemDetailPage)

**Checkpoint**: User Story 2 complete - brands can have images uploaded and displayed

---

## Phase 5: User Story 3 - View Uploaded Files (Priority: P3)

**Goal**: Serve uploaded files efficiently with proper caching headers

**Independent Test**: Upload a file, access via download endpoint, verify correct Content-Type, verify caching headers

### Backend Implementation for User Story 3

- [x] T061 [US3] Implement file download handler with sendFile and caching headers in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts (switched to express.static in app.ts)
- [x] T062 [US3] Add Cache-Control, ETag, Content-Disposition headers to download response in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts (handled by express.static with maxAge)
- [ ] T063 [US3] Implement file list endpoint with pagination for Manager+ in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts
- [x] T064 [US3] Add 404 handling for non-existent files with appropriate error message in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts (express.static handles 404)

### Frontend Implementation for User Story 3

- [x] T065 [US3] Add getFileUrl utility to construct download URLs in bakery-cms-web/src/services/file.service.ts (added getStaticUrl and updated getDownloadUrl)
- [x] T066 [US3] Ensure images use proper file URL in display components in bakery-cms-web/src/components/shared/FileUpload/FileUpload.tsx (using static URLs via updated mapper)

**Checkpoint**: User Story 3 complete - files are served efficiently with caching

---

## Phase 6: User Story 4 - Upload Product Video (Priority: P4)

**Goal**: Allow sellers/managers to upload a video for a product for enhanced presentation

**Independent Test**: Create a product, upload a video, verify video indicator shows, save product, verify video plays on product detail page

### Backend Implementation for User Story 4

- [ ] T067 [US4] Create migration to add video_file_id column to products table in bakery-cms-api/packages/database/src/migrations/20251226000004-add-video-file-to-products.ts
- [ ] T068 [US4] Run migration for products video_file_id column
- [ ] T069 [US4] Update Product model with videoFileId field and belongsTo association in bakery-cms-api/packages/database/src/models/product.model.ts
- [ ] T070 [US4] Create product video upload handler in bakery-cms-api/packages/api/src/modules/products/handlers/products.handlers.ts
- [ ] T071 [US4] Add uploadProductVideo and deleteProductVideo routes in bakery-cms-api/packages/api/src/modules/products/routes.ts
- [ ] T072 [US4] Update product service to include videoFile in getProduct with join in bakery-cms-api/packages/api/src/modules/products/services/products.services.ts
- [ ] T073 [US4] Update product mappers to include videoFile in response DTOs in bakery-cms-api/packages/api/src/modules/products/mappers/products.mappers.ts
- [ ] T074 [US4] Add video file cleanup logic when product is deleted in bakery-cms-api/packages/api/src/modules/products/services/products.services.ts

### Frontend Implementation for User Story 4

- [ ] T075 [US4] Update Product model type to include videoFile in bakery-cms-web/src/types/models/product.model.ts
- [ ] T076 [US4] Update Product API types to include videoFile in bakery-cms-web/src/types/api/product.api.ts
- [ ] T077 [US4] Update product mapper to map videoFile from API response in bakery-cms-web/src/types/mappers/product.mapper.ts
- [ ] T078 [US4] Add uploadProductVideo and deleteProductVideo to product service in bakery-cms-web/src/services/product.service.ts
- [ ] T079 [US4] Integrate FileUpload component into ProductForm for video (accept video types) in bakery-cms-web/src/components/features/products/ProductForm/ProductForm.tsx
- [ ] T080 [US4] Add video translations to product i18n files in bakery-cms-web/src/i18n/locales/en/products.json
- [ ] T081 [P] [US4] Add video translations to Vietnamese product i18n in bakery-cms-web/src/i18n/locales/vi/products.json
- [ ] T082 [US4] Create VideoPlayer component for product detail in bakery-cms-web/src/components/shared/VideoPlayer/VideoPlayer.tsx
- [ ] T083 [US4] Display product video in ProductDetail component with VideoPlayer in bakery-cms-web/src/components/features/products/ProductDetail/ProductDetail.tsx

**Checkpoint**: User Story 4 complete - products can have videos uploaded and played

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T084 [P] Add error handling for file size exceeded (413 status) in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts
- [ ] T085 [P] Add error handling for invalid file type with supported formats list in bakery-cms-api/packages/api/src/modules/files/handlers/files.handlers.ts
- [ ] T086 Add file upload logging in bakery-cms-api/packages/api/src/modules/files/services/files.services.ts
- [x] T087 [P] Update shared component exports in bakery-cms-web/src/components/shared/index.ts
- [ ] T088 Run quickstart.md validation to verify all endpoints work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in parallel or sequentially in priority order
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Enhances file serving for all stories
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Builds on US1 pattern but independent

### Within Each User Story

- Migration before model update
- Model update before service update
- Service before handlers
- Backend complete before frontend integration
- Type updates before service updates (frontend)
- Service before component integration

### Parallel Opportunities

**Phase 1 (Setup)**: T001-T004 can run in parallel
**Phase 2 (Foundational)**:
- T007, T008 after T005, T006
- T010, T011 can run in parallel
- T018, T019, T020 can run in parallel
- T022, T023, T025, T026 can run in parallel

**User Stories**: US1, US2, US3, US4 can be worked on in parallel by different developers after Phase 2

---

## Parallel Example: Foundational Phase

```bash
# After File model is created (T005-T006), launch these in parallel:
Task: "Create files DTOs in bakery-cms-api/packages/api/src/modules/files/dto/files.dto.ts"
Task: "Create file validators in bakery-cms-api/packages/api/src/modules/files/validators/files.validators.ts"
Task: "Create file mappers in bakery-cms-api/packages/api/src/modules/files/mappers/files.mappers.ts"

# Launch all frontend types in parallel:
Task: "Create frontend file API types in bakery-cms-web/src/types/api/file.api.ts"
Task: "Create frontend file model types in bakery-cms-web/src/types/models/file.model.ts"
Task: "Create file mapper in bakery-cms-web/src/types/mappers/file.mapper.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (23 tasks) - CRITICAL
3. Complete Phase 3: User Story 1 (17 tasks)
4. **STOP and VALIDATE**: Test product image upload independently
5. Deploy/demo if ready - **MVP complete with 44 tasks**

### Incremental Delivery

1. Setup + Foundational → Foundation ready (27 tasks)
2. Add User Story 1 → Product images work → Deploy (44 tasks total)
3. Add User Story 2 → Brand images work → Deploy (60 tasks total)
4. Add User Story 3 → File caching optimized → Deploy (66 tasks total)
5. Add User Story 4 → Product videos work → Deploy (83 tasks total)
6. Add Polish → Production ready → Deploy (88 tasks total)

### Suggested MVP Scope

**User Story 1 (Upload Product Image)** is sufficient for MVP:
- Delivers core value (product images)
- Establishes all infrastructure patterns
- 44 tasks to complete
- Remaining stories enhance but aren't required for initial value

---

## Summary

| Phase | Description | Task Count |
|-------|-------------|------------|
| Phase 1 | Setup | 4 |
| Phase 2 | Foundational | 23 |
| Phase 3 | User Story 1 - Product Image | 17 |
| Phase 4 | User Story 2 - Brand Image | 16 |
| Phase 5 | User Story 3 - File Viewing | 6 |
| Phase 6 | User Story 4 - Product Video | 17 |
| Phase 7 | Polish | 5 |
| **Total** | | **88** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
