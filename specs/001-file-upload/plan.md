# Implementation Plan: File Upload for Products and Brands

**Branch**: `001-file-upload` | **Date**: 2025-12-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-file-upload/spec.md`

## Summary

Implement file upload functionality to allow users to upload images and videos for products and brands. The feature includes:
- Backend: File entity with metadata storage, Multer-based upload API, file serving endpoints
- Frontend: Upload components in ProductForm and BrandForm with preview functionality
- Storage: Local filesystem (temp directory) with unique file identifiers
- Integration: Product and Brand entities linked to File records via foreign keys

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js 18+
**Primary Dependencies**:
- Backend: Express.js 4.x, Sequelize 6.x, Multer 2.x (already installed), Zod
- Frontend: React 19, Ant Design 5.x, Axios, Zustand
**Storage**: MySQL 8.x (metadata), Local filesystem (files in temp directory)
**Testing**: Jest (backend), Vitest + React Testing Library (frontend)
**Target Platform**: Web application (Linux server, modern browsers)
**Project Type**: Web application (separate backend API + frontend SPA)
**Performance Goals**:
- Upload: < 30 seconds for 10MB files
- File retrieval: < 500ms for cached files
- Image display: < 2 seconds page load
**Constraints**:
- Image max size: 10MB
- Video max size: 100MB
- Supported image formats: JPEG, PNG, GIF, WebP
- Supported video formats: MP4, WebM
**Scale/Scope**: Single image per product, single video per product, single image per brand

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **Backend: Functional Programming** | PASS | Using factory functions, pure functions for services/repositories/handlers |
| **Backend: SOLID Principles** | PASS | File module follows SRP (handlers/services/repositories separation) |
| **Backend: TypeScript Strict Mode** | PASS | Using `type` over `interface`, no `any`, explicit return types |
| **Backend: Layered Architecture** | PASS | handlers → services → repositories pattern |
| **Backend: Result Type Error Handling** | PASS | Using neverthrow Result pattern for all service returns |
| **Backend: Sequelize ORM** | PASS | File model follows existing Sequelize patterns with UUID, soft-delete |
| **Frontend: Functional Components** | PASS | All components use React hooks, no class components |
| **Frontend: Component Types (Core/Shared/Feature)** | PASS | FileUpload as shared component, ProductForm/BrandForm integration as feature |
| **Frontend: Immutable State** | PASS | Using useState with immutable updates |
| **Frontend: Service Layer** | PASS | file.service.ts follows existing patterns with Result type |
| **Frontend: Type-Safe API Client** | PASS | Axios with typed responses, mappers for DTO transformation |
| **Security: JWT Authentication** | PASS | All file endpoints protected with authenticateJWT middleware |
| **Security: RBAC** | PASS | Seller+ for products, Manager+ for brands |
| **Security: Input Validation** | PASS | File type/size validation with Multer + Zod schemas |
| **Testing: 80% Coverage** | PASS | Unit tests for handlers/services/repositories, component tests |
| **Database: Migrations** | PASS | Migration for files table creation |

**Constitution Gate**: PASSED - No violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-file-upload/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── files-api.yaml
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
bakery-cms-api/packages/
├── api/src/
│   └── modules/
│       └── files/                    # NEW: Files module
│           ├── handlers/
│           │   └── files.handlers.ts
│           ├── services/
│           │   └── files.services.ts
│           ├── repositories/
│           │   └── files.repositories.ts
│           ├── validators/
│           │   └── files.validators.ts
│           ├── mappers/
│           │   └── files.mappers.ts
│           ├── dto/
│           │   └── files.dto.ts
│           └── routes.ts
├── database/src/
│   ├── models/
│   │   └── file.model.ts            # NEW: File model
│   └── migrations/
│       └── 20251226XXXXXX-create-files.ts  # NEW: Migration
└── common/src/
    ├── enums/
    │   └── file.enums.ts            # NEW: FileType, FileStatus enums
    └── types/
        └── file.types.ts            # NEW: File type definitions

bakery-cms-web/src/
├── components/
│   ├── shared/
│   │   └── FileUpload/              # NEW: Reusable upload component
│   │       ├── FileUpload.tsx
│   │       ├── FileUpload.types.ts
│   │       └── index.ts
│   └── features/
│       ├── products/
│       │   └── ProductForm/         # MODIFY: Add image/video upload
│       └── stock/
│           └── BrandForm/           # MODIFY: Add image upload
├── services/
│   └── file.service.ts              # NEW: File API service
├── hooks/
│   └── useFileUpload.ts             # NEW: Upload hook
├── types/
│   ├── api/
│   │   └── file.api.ts              # NEW: API response types
│   ├── models/
│   │   └── file.model.ts            # NEW: Domain model
│   └── mappers/
│       └── file.mapper.ts           # NEW: API to model mapper
└── i18n/locales/
    ├── en/files.json                # NEW: English translations
    └── vi/files.json                # NEW: Vietnamese translations
```

**Structure Decision**: Web application structure with separate backend (bakery-cms-api) and frontend (bakery-cms-web) repositories. Following existing monorepo patterns in backend with packages/api, packages/database, packages/common structure.

## Complexity Tracking

No constitution violations requiring justification.
