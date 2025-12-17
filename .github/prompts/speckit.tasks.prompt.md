---
agent: speckit.tasks
---

# Task Generation Workflow

## Context & Objectives

This workflow generates a detailed, executable task breakdown following the 8-step implementation approach defined in the project constitution and plan.

## Prerequisites

- Plan must exist: `.specify/docs/spec/[feature-name]/plan.md`
- Specification must exist: `.specify/docs/spec/[feature-name]/specification.md`
- Constitution file: `.specify/memory/constitution.md`

## Workflow Overview

```text
Check Prerequisites → Load Documents → Analyze Structure → Generate Tasks → Validate → Report
```

## Phase 0: Setup & Prerequisites Check

### Step 1: Verify Required Documents

Run prerequisites check:

```bash
cd /Users/hoanganh/Documents/NodeJS/Bakery-CMS
.specify/scripts/bash/check-prerequisites.sh --json
```

Parse JSON output for:
- `FEATURE_DIR`: Path to feature directory
- `AVAILABLE_DOCS`: List of available documents

**REQUIRED DOCUMENTS**:
- `plan.md` - Technical stack, structure, architecture
- `specification.md` - User stories, business rules, requirements

**OPTIONAL DOCUMENTS** (load if available):
- `data-model.md` - Entity definitions
- `contracts/` - API specifications
- `research.md` - Technical decisions
- `quickstart.md` - Testing scenarios

### Step 2: Load Project Rules

Read and understand:
1. Constitution: `.specify/memory/constitution.md`
   - Functional programming requirements
   - TypeScript strict mode
   - Component architecture (Frontend)
   - Monorepo structure (Backend)
   - Testing requirements (80% coverage)
   - 8-step implementation approach

2. Plan.md:
   - Technical stack
   - Dependencies
   - Project structure
   - File organization
   - Performance goals
   - Constraints

3. Specification.md:
   - User stories with priorities (P1, P2, P3)
   - Business rules
   - Functional requirements
   - Success metrics

## Phase 1: Document Analysis

### Step 1: Extract Technical Context

From `plan.md`, extract:
- Programming languages and versions
- Frameworks and libraries
- Project type (Backend/Frontend/Both)
- Repository structure
- File organization patterns
- Testing framework
- Build tools

### Step 2: Extract User Stories

From `specification.md`, extract:
- User stories with priorities (P1, P2, P3, etc.)
- For each story identify:
  - Story ID (US1, US2, US3...)
  - Priority level
  - Description
  - Acceptance criteria
  - Dependencies on other stories

### Step 3: Extract Entities and Data Models

From `data-model.md` (if exists):
- Entity definitions
- Fields and types
- Relationships
- Validation rules
- State transitions
- Database migrations needed

### Step 4: Extract API Contracts

From `contracts/` (if exists):
- API endpoints
- HTTP methods
- Request/response schemas
- Error responses
- Map endpoints to user stories

### Step 5: Extract Technical Decisions

From `research.md` (if exists):
- Key technical decisions
- Libraries to use
- Patterns to follow
- Setup requirements

## Phase 2: Task Structure Design

### The 8-Step Implementation Approach

Based on project constitution, EVERY feature implementation follows these steps:

```text
1. Create/Update Code Structure
2. Create/Update Data Types
3. Create/Update Data Models
4. Create/Update Migration Files (if database changes)
5. Create/Update Seed Data (if needed)
6. Create/Update Business Functions/Components
7. Create/Update Logic
8. Create/Update Unit Tests
```

### Task Organization Philosophy

**Organization Principle**: Tasks MUST be organized by User Story to enable:
- Independent implementation of each story
- Independent testing of each story
- Parallel development by multiple team members
- Incremental delivery (MVP → Full Feature)

**Phase Structure**:
1. **Phase 1: Setup** - Project initialization (shared infrastructure)
2. **Phase 2: Foundational** - Blocking prerequisites that ALL user stories depend on
3. **Phase 3+: User Stories** - One phase per user story (in priority order)
4. **Final Phase: Polish** - Cross-cutting improvements

### For Updates vs New Features

**For New Features**:
- Follow all 8 steps completely
- Create new files and structures

**For Updates/Modifications**:
- **CRITICAL**: Confirm with user before replacing existing logic
- Document what will be replaced
- Prefer refactoring over creating redundant logic
- Only include relevant steps (may skip steps 1-5 if structure exists)
- Focus on steps 6-8 (functions, logic, tests)
- Add tasks for cleanup of old code

## Phase 3: Task Generation

### Task Format (MANDATORY)

Every task MUST follow this exact format:

```text
- [ ] [TaskID] [P?] [Story?] Description with exact file path
```

**Format Components**:
1. **Checkbox**: `- [ ]` (markdown checkbox)
2. **Task ID**: Sequential (T001, T002, T003...) in execution order
3. **[P] marker**: Include ONLY if parallelizable (different files, no dependencies)
4. **[Story] label**: 
   - Format: `[US1]`, `[US2]`, `[US3]` etc.
   - Required for user story phase tasks
   - NOT used in Setup, Foundational, or Polish phases
5. **Description**: Clear action with exact file path

**Examples**:
```text
✅ - [ ] T001 Create project structure per implementation plan
✅ - [ ] T005 [P] Implement authentication middleware in src/middleware/auth.ts
✅ - [ ] T012 [P] [US1] Create User model in src/models/user.ts
✅ - [ ] T014 [US1] Implement UserService in src/services/user.service.ts

❌ - [ ] Create User model (missing ID, Story label, path)
❌ T001 [US1] Create model (missing checkbox, path)
❌ - [ ] [US1] Create User model (missing Task ID, path)
```

### Phase 1: Setup Tasks

**Purpose**: Project initialization and shared infrastructure

Generate tasks for:
- [ ] T001: Project structure creation (if new project)
- [ ] T002: Initialize package.json / dependencies
- [ ] T003: [P] Configure TypeScript (tsconfig.json)
- [ ] T004: [P] Configure ESLint and Prettier
- [ ] T005: [P] Configure Jest / testing framework
- [ ] T006: [P] Setup environment configuration (.env.example)
- [ ] T007: [P] Create base folder structure
- [ ] T008: [P] Setup CI/CD configuration (if needed)

**Note**: Mark all independent tasks as `[P]` for parallel execution.

### Phase 2: Foundational Tasks (CRITICAL GATE)

**Purpose**: Infrastructure that BLOCKS all user stories

**⚠️ CRITICAL**: No user story implementation can begin until this phase completes.

Generate tasks for shared infrastructure:
- [ ] T009: Database connection setup (Backend)
- [ ] T010: [P] Base error handling setup
- [ ] T011: [P] Base Result type implementation
- [ ] T012: [P] Logger setup
- [ ] T013: [P] Validation utilities
- [ ] T014: [P] API client setup with Axios (Frontend)
- [ ] T015: [P] Base middleware (error handler, logger) (Backend)
- [ ] T016: [P] Base repository pattern setup (Backend)
- [ ] T017: [P] Authentication/Authorization framework (if required)
- [ ] T018: Database migration framework setup (Backend)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

### Phase 3+: User Story Tasks

**One Phase Per User Story** - Follow the 8-step approach for each story:

#### Example: Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of story value]

**Independent Test**: [How to verify this story works standalone]

**Step 1: Create/Update Code Structure** (if needed)

```text
- [ ] T020 [P] [US1] Create [feature] module directory structure in packages/api/src/modules/[feature]/ (Backend)
- [ ] T021 [P] [US1] Create [feature] component directory in src/components/features/[feature]/ (Frontend)
- [ ] T022 [P] [US1] Create subdirectories: handlers/, services/, repositories/, validators/, dto/, mappers/, types/, tests/ (Backend)
- [ ] T023 [P] [US1] Create subdirectories for component: [Component].tsx, [Component].types.ts, [Component].test.tsx (Frontend)
```

**Step 2: Create/Update Data Types**

```text
Backend:
- [ ] T024 [P] [US1] Define [Entity] domain type in packages/common/src/types/[feature].types.ts
- [ ] T025 [P] [US1] Define [Feature]Service function type in packages/common/src/types/[feature].types.ts
- [ ] T026 [P] [US1] Define [Feature]Repository function type in packages/common/src/types/[feature].types.ts
- [ ] T027 [P] [US1] Create DTOs in packages/api/src/modules/[feature]/dto/[feature].dto.ts
- [ ] T028 [P] [US1] Define enums in packages/common/src/enums/[feature].enums.ts
- [ ] T029 [P] [US1] Define constants in packages/common/src/constants/[feature].constants.ts

Frontend:
- [ ] T030 [P] [US1] Create API response types in src/types/api/[feature].api.ts
- [ ] T031 [P] [US1] Create domain model types in src/types/models/[feature].model.ts
- [ ] T032 [P] [US1] Create component prop types in src/components/features/[feature]/[Component].types.ts
```

**Step 3: Create/Update Data Models**

```text
Backend:
- [ ] T033 [P] [US1] Create [Entity] Sequelize model in packages/database/src/models/[entity].model.ts
- [ ] T034 [P] [US1] Define associations for [Entity] model
- [ ] T035 [P] [US1] Add model validation rules
- [ ] T036 [P] [US1] Add model hooks (if needed)

Frontend:
- [ ] T037 [P] [US1] Create mapper functions in src/types/mappers/[feature].mapper.ts
- [ ] T038 [P] [US1] Implement mapXFromAPI functions for all entities
```

**Step 4: Create/Update Migration Files** (Backend only, if database changes)

```text
- [ ] T039 [US1] Create migration file packages/database/src/migrations/YYYYMMDDHHMMSS-create-[entity].ts
- [ ] T040 [US1] Implement up() function for migration
- [ ] T041 [US1] Implement down() function for rollback
- [ ] T042 [US1] Add indexes in migration
- [ ] T043 [US1] Add foreign key constraints in migration
- [ ] T044 [US1] Run migration to verify: npm run migrate:up
```

**Step 5: Create/Update Seed Data** (if needed)

```text
- [ ] T045 [P] [US1] Create seed file packages/database/src/seeders/YYYYMMDDHHMMSS-seed-[entity].ts
- [ ] T046 [US1] Implement up() function with test data
- [ ] T047 [US1] Implement down() function for cleanup
- [ ] T048 [US1] Run seeder to verify: npm run seed:up
```

**Step 6: Create/Update Business Functions/Components**

```text
Backend:
- [ ] T049 [P] [US1] Implement repository functions in packages/api/src/modules/[feature]/repositories/[feature].repositories.ts
- [ ] T050 [P] [US1] Implement service functions in packages/api/src/modules/[feature]/services/[feature].services.ts
- [ ] T051 [P] [US1] Implement validators in packages/api/src/modules/[feature]/validators/[feature].validators.ts
- [ ] T052 [P] [US1] Implement mappers in packages/api/src/modules/[feature]/mappers/[feature].mappers.ts

Frontend:
- [ ] T053 [P] [US1] Create Core component (if new atomic UI needed) in src/components/core/[Component]/[Component].tsx
- [ ] T054 [P] [US1] Create Shared component (if new composite needed) in src/components/shared/[Component]/[Component].tsx
- [ ] T055 [US1] Create Detail component (feature-specific) in src/components/features/[feature]/[Component]/[Component].tsx
- [ ] T056 [US1] Implement custom hook (if needed) in src/hooks/use[Feature].ts
```

**Step 7: Create/Update Logic**

```text
Backend:
- [ ] T057 [US1] Implement request handlers in packages/api/src/modules/[feature]/handlers/[feature].handlers.ts
- [ ] T058 [US1] Register routes in API router
- [ ] T059 [US1] Add error handling middleware for feature
- [ ] T060 [US1] Add validation middleware for feature endpoints
- [ ] T061 [US1] Implement logging for feature operations

Frontend:
- [ ] T062 [US1] Create API service in src/services/[feature].service.ts
- [ ] T063 [US1] Implement service functions with Result type
- [ ] T064 [US1] Add error handling in service layer
- [ ] T065 [US1] Integrate service with components
- [ ] T066 [US1] Implement state management in components
- [ ] T067 [US1] Add loading and error states
- [ ] T068 [US1] Implement user interactions (forms, buttons, etc.)
```

**Step 8: Create/Update Unit Tests**

```text
Backend:
- [ ] T069 [P] [US1] Write repository function tests in packages/api/src/modules/[feature]/tests/[feature].repositories.test.ts
- [ ] T070 [P] [US1] Write service function tests in packages/api/src/modules/[feature]/tests/[feature].services.test.ts
- [ ] T071 [P] [US1] Write validator tests in packages/api/src/modules/[feature]/tests/[feature].validators.test.ts
- [ ] T072 [P] [US1] Write handler tests in packages/api/src/modules/[feature]/tests/[feature].handlers.test.ts
- [ ] T073 [P] [US1] Write integration tests in packages/api/src/modules/[feature]/tests/[feature].integration.test.ts
- [ ] T074 [US1] Run tests to verify 80% coverage: npm test -- [feature]

Frontend:
- [ ] T075 [P] [US1] Write Core component tests in src/components/core/[Component]/[Component].test.tsx
- [ ] T076 [P] [US1] Write Shared component tests in src/components/shared/[Component]/[Component].test.tsx
- [ ] T077 [P] [US1] Write Detail component tests in src/components/features/[feature]/[Component]/[Component].test.tsx
- [ ] T078 [P] [US1] Write custom hook tests in src/hooks/use[Feature].test.ts
- [ ] T079 [P] [US1] Write service tests in src/services/[feature].service.test.ts
- [ ] T080 [US1] Run tests to verify 80% coverage: npm test -- [feature]
```

**Checkpoint**: User Story 1 should now be fully functional and independently testable

#### For Subsequent User Stories

Repeat the same 8-step structure for each user story:
- Phase 4: User Story 2 (P2)
- Phase 5: User Story 3 (P3)
- And so on...

Each story gets:
1. Goal statement
2. Independent test criteria
3. All 8 implementation steps (adapted to that story's needs)
4. Checkpoint for independent validation

**Important for Updates**: If updating existing features:
- Skip steps 1-5 if structure/types/models already exist
- Focus on steps 6-8 (functions, logic, tests)
- Add explicit confirmation tasks: "Confirm replacing existing [function] in [file]"
- Add cleanup tasks: "Remove deprecated [function] from [file]"

### Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

```text
- [ ] TXXX [P] Update documentation in docs/ and README.md
- [ ] TXXX [P] Refactor common code patterns
- [ ] TXXX [P] Optimize performance across features
- [ ] TXXX [P] Security audit and hardening
- [ ] TXXX [P] Code style and linting cleanup
- [ ] TXXX Run quickstart.md validation for all user stories
- [ ] TXXX Verify 80% test coverage across all stories
- [ ] TXXX Final integration testing of all stories together
```

## Phase 4: Dependencies & Execution Order

### Document Dependencies Clearly

```markdown
## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - No other story dependencies
- **User Story 2 (Phase 4)**: Depends on Foundational - May integrate with US1 but independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational - May integrate with US1/US2 but independently testable
- **Polish (Final)**: Depends on all desired user stories

### Within Each User Story (The 8 Steps)
1. Code Structure (Step 1) - First, creates directories
2. Data Types (Step 2) - After structure, can run in parallel [P]
3. Data Models (Step 3) - After types defined
4. Migrations (Step 4) - After models created
5. Seed Data (Step 5) - After migrations run
6. Business Functions (Step 6) - After models and types, can run in parallel [P]
7. Logic (Step 7) - After business functions
8. Unit Tests (Step 8) - After logic, can run in parallel [P]

### Parallel Opportunities
- All [P] tasks in same phase can run simultaneously
- Different user stories can be developed in parallel (after Foundational)
- Within a user story: Types, some Functions, and some Tests can run in parallel
```

## Phase 5: Implementation Strategy

Document implementation approaches:

```markdown
## Implementation Strategy

### MVP First (Recommended)
1. Complete Phase 1: Setup ✓
2. Complete Phase 2: Foundational ✓ CRITICAL - blocks everything
3. Complete Phase 3: User Story 1 ✓
4. **STOP and VALIDATE**: Test US1 independently
5. Demo/Deploy MVP if ready

### Incremental Delivery
1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Demo/Deploy (MVP!)
3. Add US2 → Test independently → Demo/Deploy
4. Add US3 → Test independently → Demo/Deploy
5. Each story adds value without breaking previous stories

### Parallel Team Strategy
With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational done:
   - Developer A: User Story 1 (all 8 steps)
   - Developer B: User Story 2 (all 8 steps)
   - Developer C: User Story 3 (all 8 steps)
3. Stories complete and integrate independently

### Update Strategy (For Existing Features)
1. Phase 1: Setup - Skip if structure exists
2. Phase 2: Foundational - Update only if needed
3. For each User Story being updated:
   - **CONFIRM with user**: Document what will be replaced
   - Steps 1-5: Update only if structure/types/models change
   - Steps 6-8: Main focus - update functions, logic, tests
   - Add cleanup tasks for deprecated code
4. Final Phase: Remove redundant code, refactor for consistency
```

## Phase 6: Task Validation

Before finalizing tasks.md, verify:

### Format Validation
- [ ] Every task has checkbox `- [ ]`
- [ ] Every task has Task ID (T001, T002...)
- [ ] User story tasks have [Story] label ([US1], [US2]...)
- [ ] Parallelizable tasks have [P] marker
- [ ] Every task has exact file path
- [ ] Task IDs are sequential

### Completeness Validation
- [ ] All 8 steps present for each user story
- [ ] Setup phase includes project initialization
- [ ] Foundational phase includes blocking infrastructure
- [ ] Each user story phase has:
  - Goal statement
  - Independent test criteria
  - All 8 implementation steps (or explicitly noted as not needed)
  - Checkpoint statement
- [ ] Polish phase includes cross-cutting concerns

### Dependency Validation
- [ ] Dependencies section clearly documents:
  - Phase completion order
  - User story dependencies (or independence)
  - Within-story step order
  - Parallel opportunities
- [ ] No circular dependencies
- [ ] Foundational phase properly blocks user stories

### User Story Validation
- [ ] Each user story can be implemented independently (after Foundational)
- [ ] Each user story can be tested independently
- [ ] Each user story delivers value on its own
- [ ] User stories follow priority order (P1, P2, P3...)

### Update-Specific Validation (if updating existing code)
- [ ] Explicit confirmation tasks for replacements
- [ ] Tasks to minimize redundant code
- [ ] Cleanup tasks for deprecated code
- [ ] Refactoring tasks noted
- [ ] User approval checkpoints included

## Phase 7: Generation & Report

### Generate tasks.md

Use template structure from `.specify/templates/tasks-template.md` and fill with:

1. **Header**:
   ```markdown
   # Tasks: [Feature Name]
   
   **Input**: Design documents from `/specs/[feature-dir]/`
   **Prerequisites**: plan.md, specification.md, data-model.md, contracts/, research.md
   
   **Organization**: Tasks organized by user story following 8-step implementation approach
   ```

2. **Format explanation**

3. **All phases with tasks**

4. **Dependencies section**

5. **Implementation strategy**

6. **Parallel execution examples**

### Report to User

```markdown
# Task Generation Complete

**Feature**: [Feature Name]
**Tasks File**: [path-to-tasks.md]

## Summary:
- Total Tasks: [count]
- Setup Tasks: [count]
- Foundational Tasks: [count]
- User Story Tasks:
  - US1 (P1): [count] tasks
  - US2 (P2): [count] tasks
  - US3 (P3): [count] tasks
- Polish Tasks: [count]

## User Stories Breakdown:
Each story follows 8-step implementation:
1. Code Structure
2. Data Types
3. Data Models
4. Migration Files (if applicable)
5. Seed Data (if applicable)
6. Business Functions/Components
7. Logic
8. Unit Tests

## Parallel Opportunities:
- [count] tasks can run in parallel within phases
- [count] user stories can be developed in parallel after Foundational phase

## Independent Test Criteria:
- US1: [criteria]
- US2: [criteria]
- US3: [criteria]

## Suggested MVP:
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: User Story 1 (P1)
Total: [count] tasks for MVP

## Format Validation:
✓ All tasks follow checkbox format
✓ All tasks have Task IDs
✓ User story tasks labeled correctly
✓ File paths specified
✓ Dependencies documented

## Next Steps:
1. Review tasks.md for completeness
2. Confirm task breakdown matches plan
3. Run `/speckit.implement` to begin implementation
4. Or start with MVP (Setup + Foundational + US1)

Ready to begin implementation?
```

## Key Rules & Best Practices

### MUST DO:
1. ✅ Read constitution, plan, and specification completely
2. ✅ Follow 8-step implementation approach for EVERY user story
3. ✅ Organize tasks by user story (enable independent work)
4. ✅ Use exact task format (checkbox, ID, labels, path)
5. ✅ Separate Foundational (blocking) from User Stories
6. ✅ Make each user story independently testable
7. ✅ Mark parallelizable tasks with [P]
8. ✅ Label user story tasks with [US1], [US2], etc.
9. ✅ Include exact file paths in every task
10. ✅ Document dependencies clearly
11. ✅ Provide implementation strategy options
12. ✅ Validate all tasks before finalizing

### For Updates:
13. ✅ Confirm with user before replacing logic
14. ✅ Document what will be replaced
15. ✅ Add cleanup tasks for old code
16. ✅ Minimize redundant logic
17. ✅ Focus on steps 6-8 if structure exists

### MUST NOT DO:
1. ❌ Skip constitution reading
2. ❌ Omit any of the 8 steps without justification
3. ❌ Create vague tasks without file paths
4. ❌ Mix tasks from different user stories in same phase
5. ❌ Create circular dependencies
6. ❌ Forget [Story] labels on user story tasks
7. ❌ Use inconsistent task format
8. ❌ Make user stories dependent on each other (unless necessary)
9. ❌ Skip Foundational phase (blocks all stories)
10. ❌ Violate functional programming principles

### For Updates:
11. ❌ Replace existing logic without user confirmation
12. ❌ Create redundant parallel implementations
13. ❌ Leave deprecated code without cleanup tasks

## Success Criteria

Tasks.md is complete when:
- [ ] All required documents loaded and analyzed
- [ ] Constitution compliance understood
- [ ] 8-step approach applied to all user stories
- [ ] Task format validation passes
- [ ] Completeness validation passes
- [ ] Dependency validation passes
- [ ] User story independence verified
- [ ] Parallel opportunities identified
- [ ] Implementation strategies documented
- [ ] Update strategy defined (if applicable)
- [ ] User approval obtained (if replacing code)
- [ ] Report generated with summary
