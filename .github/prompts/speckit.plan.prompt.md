---
agent: speckit.plan
---

# Implementation Planning Workflow

## Context & Objectives

This workflow generates a complete implementation plan for a feature, following the project's constitution and architectural principles.

## Prerequisites

- Feature specification must exist in `.specify/docs/spec/[feature-name]/specification.md`
- Constitution file at `.specify/memory/constitution.md`
- Plan template at `.specify/templates/plan-template.md`

## Workflow Overview

```text
User Request → Setup → Load Context → Research → Design → Update Context → Validation → Report
```

## Phase 0: Setup & Context Loading

### Step 1: Initialize Planning Environment

Run setup script to get feature context:

```bash
cd /Users/hoanganh/Documents/NodeJS/Bakery-CMS
.specify/scripts/bash/setup-plan.sh --json
```

Parse JSON output for:
- `FEATURE_SPEC`: Path to specification file
- `IMPL_PLAN`: Path to plan.md file
- `SPECS_DIR`: Feature specs directory
- `BRANCH`: Feature branch name

### Step 2: Load Essential Documents

**REQUIRED READING**:
1. Read `FEATURE_SPEC` (specification.md) completely
2. Read `.specify/memory/constitution.md` completely
3. Load `IMPL_PLAN` template (already copied by setup script)

**Constitution Compliance**: Extract and understand:
- Repository structure requirements (Backend/Frontend separation)
- Functional programming paradigm (NON-NEGOTIABLE)
- TypeScript-first development (strict mode)
- Component architecture (Core/Shared/Detail) for Frontend
- Monorepo structure for Backend
- Testing requirements (80% coverage minimum)
- Security requirements (no secrets in code)
- Performance standards (<200ms API response time)

## Phase 1: Technical Context & Constitution Check

### Step 1: Fill Technical Context

Based on the feature specification and constitution, populate:

```markdown
**Language/Version**: [e.g., TypeScript with Node.js 18+, React 18]
**Primary Dependencies**: [e.g., Express.js, Sequelize, Axios]
**Storage**: [MySQL with Sequelize ORM or N/A]
**Testing**: [Jest for unit tests, React Testing Library for components]
**Target Platform**: [e.g., Backend: Node.js API, Frontend: Web Browser]
**Project Type**: [Backend Monorepo + Frontend SPA]
**Performance Goals**: [From constitution: <200ms p95 API response]
**Constraints**: [From constitution: Functional programming, TypeScript strict]
**Scale/Scope**: [From spec: number of endpoints, components, entities]
```

**CRITICAL**: Mark any unknown as "NEEDS CLARIFICATION" - these will be resolved in research phase.

### Step 2: Constitution Compliance Check

**GATE CHECKS** (MUST PASS):

#### Backend Checks:
- [ ] Functional programming paradigm enforced (pure functions, immutability)
- [ ] TypeScript strict mode enabled
- [ ] No class-based patterns (only functions)
- [ ] Monorepo structure with packages: api, common, database
- [ ] Sequelize ORM for data access
- [ ] Repository pattern using functional composition
- [ ] Service layer with pure functions
- [ ] Result type for error handling
- [ ] Yarn package manager
- [ ] No secrets in code (environment variables only)

#### Frontend Checks:
- [ ] React functional components only (NO classes)
- [ ] Component types clearly defined: Core/Shared/Detail
- [ ] Functional programming in React (hooks, immutable state)
- [ ] TypeScript strict mode enabled
- [ ] API responses mapped to domain models
- [ ] Axios for HTTP client
- [ ] Type-first development (type over interface)
- [ ] Yarn package manager

#### Universal Checks:
- [ ] Test coverage ≥ 80%
- [ ] Security-first configuration
- [ ] No any types (except documented edge cases)
- [ ] Explicit return types on all functions

**ERROR Condition**: If ANY gate check fails without valid justification → STOP and request clarification.

### Step 3: Project Structure Decision

Determine structure based on feature scope:

**Backend Repository** (bakery-cms-api):
```text
packages/
├── api/                      # Express.js API server
│   ├── src/
│   │   ├── modules/
│   │   │   └── [feature]/    # Feature module
│   │   │       ├── handlers/
│   │   │       ├── services/
│   │   │       ├── repositories/
│   │   │       ├── validators/
│   │   │       ├── dto/
│   │   │       ├── mappers/
│   │   │       └── types/
│   │   ├── middleware/
│   │   └── config/
│   └── tests/
├── common/                   # Shared types and constants
│   └── src/
│       ├── types/
│       ├── enums/
│       └── constants/
└── database/                 # Database models and migrations
    └── src/
        ├── models/
        ├── migrations/
        └── seeders/
```

**Frontend Repository** (bakery-cms-web):
```text
src/
├── components/
│   ├── core/                 # Atomic UI components
│   ├── shared/               # Composite reusable components
│   └── features/             # Feature-specific components
│       └── [feature]/
├── services/                 # API services
├── types/
│   ├── api/                  # API response types
│   ├── models/               # Domain models
│   └── mappers/              # API to Model mappers
├── hooks/                    # Custom React hooks
└── utils/
tests/
├── components/
├── integration/
└── unit/
```

## Phase 2: Research & Requirements Resolution

### Trigger Research If Needed

**Research Required When**:
- Technical Context has "NEEDS CLARIFICATION"
- New technology not in constitution
- Integration patterns unclear
- Performance requirements ambiguous

### Research Process

For each unknown, create research task:

1. **Identify Research Questions**:
   - What decisions need to be made?
   - What technologies need evaluation?
   - What patterns need validation?
   - What integrations need design?

2. **Conduct Research**:
   - Review constitution for existing patterns
   - Check existing codebase for similar implementations
   - Research best practices for technology stack
   - Evaluate alternatives

3. **Document Findings in research.md**:

```markdown
# Research: [Feature Name]

## Research Question 1: [Question]

**Decision**: [What was chosen]
**Rationale**: [Why this choice]
**Alternatives Considered**: [What else was evaluated]
**Constitution Alignment**: [How this follows project rules]
**Implementation Notes**: [Key points for implementation]

## Research Question 2: ...
```

### Confirm Research with User

**CRITICAL STEP**: Before proceeding to design phase:
1. Present research findings to user
2. Request confirmation: "Research complete. Findings documented in research.md. Please review and confirm before proceeding to design phase."
3. Wait for user approval
4. If user requests changes, update research.md and re-confirm

### Merge Research into Specification

After user confirmation:
1. Update specification.md with research findings
2. Add research conclusions to relevant sections:
   - Technical decisions → Architecture section
   - Data models → Data Type Setup section
   - API patterns → API Contracts section
3. Mark specification as "Research Complete"

## Phase 3: Design & Contracts

### Step 1: Data Model Design

Extract entities from specification and create `data-model.md`:

```markdown
# Data Model: [Feature Name]

## Entity: [EntityName]

**Description**: [Purpose and usage]

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | - | auto-generated |
| name | string | Yes | 1-255 chars | - |
| status | enum | Yes | OrderStatus enum | draft |
| createdAt | Date | Yes | - | current timestamp |

**Relationships**:
- belongsTo: User (userId)
- hasMany: OrderItems

**Validation Rules**:
- name must not be empty
- status must be valid OrderStatus value

**State Transitions**:
- draft → confirmed (on confirmation)
- confirmed → paid (on payment)
- any → cancelled (on cancellation)

**Sequelize Model Location**: `packages/database/src/models/[entity].model.ts`

**TypeScript Type Location**: `packages/common/src/types/[entity].types.ts`
```

**For Frontend**:
```markdown
## Domain Model: [ModelName]

**API Response Type** (`src/types/api/[model].api.ts`):
```typescript
type ProductAPIResponse = {
  id: string;
  product_name: string;
  product_price: number;
  created_at: string;
};
```

**Domain Model Type** (`src/types/models/[model].model.ts`):
```typescript
type Product = {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
};
```

**Mapper** (`src/types/mappers/[model].mapper.ts`):
```typescript
export const mapProductFromAPI = (response: ProductAPIResponse): Product => ({
  id: response.id,
  name: response.product_name,
  price: response.product_price,
  createdAt: new Date(response.created_at),
});
```
```

### Step 2: Code Structure Design

Create detailed structure for this specific feature:

#### Backend Structure:
```markdown
## Backend Code Structure

### packages/common/src/
```text
enums/
  [feature].enums.ts          # Feature-specific enums
constants/
  [feature].constants.ts      # Feature constants
types/
  [feature].types.ts          # Feature domain types
```

### packages/database/src/
```text
models/
  [entity].model.ts           # Sequelize models
migrations/
  YYYYMMDDHHMMSS-create-[entity].ts
seeders/
  YYYYMMDDHHMMSS-seed-[entity].ts  # If needed
```

### packages/api/src/modules/[feature]/
```text
handlers/
  [feature].handlers.ts       # Request handlers
services/
  [feature].services.ts       # Business logic (pure functions)
repositories/
  [feature].repositories.ts   # Data access (functional composition)
validators/
  [feature].validators.ts     # Input validation
dto/
  [feature].dto.ts           # Data transfer objects
mappers/
  [feature].mappers.ts       # Entity ↔ DTO transformations
types/
  [feature].types.ts         # Module-specific types
tests/
  [feature].test.ts          # Unit tests
```
```

#### Frontend Structure:
```markdown
## Frontend Code Structure

### src/components/
```text
core/                         # If new atomic components needed
  [ComponentName]/
    [ComponentName].tsx
    [ComponentName].types.ts
    [ComponentName].test.tsx

shared/                       # If new composite components needed
  [ComponentName]/
    [ComponentName].tsx
    [ComponentName].types.ts
    [ComponentName].test.tsx

features/[feature]/           # Feature-specific components
  [ComponentName]/
    [ComponentName].tsx
    [ComponentName].types.ts
    [ComponentName].test.tsx
```

### src/services/
```text
[feature].service.ts          # API service with Result type
```

### src/types/
```text
api/
  [feature].api.ts            # API response types
models/
  [feature].model.ts          # Domain model types
mappers/
  [feature].mapper.ts         # API to Model mappers
```

### src/hooks/
```text
use[Feature].ts               # Custom hook if needed
```
```

### Step 3: Data Types Setup

Create detailed TypeScript types:

#### Backend Types:
```typescript
// packages/common/src/types/[feature].types.ts

// Domain Types
export type [Entity] = {
  id: string;
  field1: string;
  field2: number;
  createdAt: Date;
  updatedAt: Date;
};

// Service Function Types
export type [Feature]Service = {
  create: (data: Create[Entity]DTO) => Promise<Result<[Entity]>>;
  getById: (id: string) => Promise<Result<[Entity]>>;
  update: (id: string, data: Update[Entity]DTO) => Promise<Result<[Entity]>>;
  delete: (id: string) => Promise<Result<void>>;
};

// Repository Function Types
export type [Feature]Repository = {
  findById: (id: string) => Promise<[Entity] | null>;
  findAll: (filters?: [Entity]Filters) => Promise<[Entity][]>;
  create: (data: [Entity]Data) => Promise<[Entity]>;
  update: (id: string, data: Partial<[Entity]Data>) => Promise<[Entity]>;
  delete: (id: string) => Promise<void>;
};
```

#### Frontend Types:
```typescript
// src/types/api/[feature].api.ts
export type [Entity]APIResponse = {
  id: string;
  field_name: string;  // snake_case from API
  created_at: string;
};

// src/types/models/[feature].model.ts
export type [Entity] = {
  id: string;
  fieldName: string;   // camelCase in domain
  createdAt: Date;
};

// src/types/mappers/[feature].mapper.ts
export const map[Entity]FromAPI = (response: [Entity]APIResponse): [Entity] => ({
  id: response.id,
  fieldName: response.field_name,
  createdAt: new Date(response.created_at),
});
```

### Step 4: Migration Files (Backend Only)

If database changes needed:

```typescript
// packages/database/src/migrations/YYYYMMDDHHMMSS-create-[entity].ts

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('[entities]', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    field_name: {
      type: DataTypes.STRING(255),
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
  await queryInterface.addIndex('[entities]', ['field_name']);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('[entities]');
};
```

### Step 5: Seed Data (If Needed)

```typescript
// packages/database/src/seeders/YYYYMMDDHHMMSS-seed-[entity].ts

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkInsert('[entities]', [
    {
      id: 'uuid-1',
      field_name: 'value1',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('[entities]', {});
};
```

### Step 6: Business Functions/Components Design

#### Backend Business Functions:
```typescript
// packages/api/src/modules/[feature]/services/[feature].services.ts

// Pure function for business logic
export const create[Entity] = async (
  repository: [Feature]Repository,
  data: Create[Entity]DTO
): Promise<Result<[Entity]>> => {
  // Validation
  const validationResult = validate[Entity]Data(data);
  if (!validationResult.success) {
    return err(validationResult.error);
  }

  // Business logic (pure)
  const entityData = map[Entity]DTOToData(data);
  
  // Data access
  try {
    const entity = await repository.create(entityData);
    return ok(entity);
  } catch (error) {
    return err(handleDatabaseError(error));
  }
};
```

#### Frontend Components:
```typescript
// src/components/features/[feature]/[Component]/[Component].tsx

export const [Component] = ({ prop1, prop2 }: [Component]Props) => {
  const [data, setData] = useState<[Entity][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await [feature]Service.getAll();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data.map(item => (
        <SharedComponent key={item.id} item={item} />
      ))}
    </div>
  );
};
```

### Step 7: Logic Implementation Design

Document logic flow for key operations:

```markdown
## Logic Flow: [Operation Name]

### Input:
- Parameters: [list]
- Validation: [rules]

### Process:
1. Validate input data
2. Check business rules
3. Transform data if needed
4. Execute repository operation
5. Handle errors
6. Map result to DTO

### Output:
- Success: Result<[Entity]>
- Error: Result with AppError

### Error Handling:
- Validation Error → 400 with details
- Not Found → 404
- Business Rule Violation → 422
- Database Error → 500

### Example Code:
[Provide example implementation]
```

### Step 8: Unit Test Design

Design test cases:

```markdown
## Unit Tests: [Feature]

### Backend Tests

**File**: `packages/api/src/modules/[feature]/tests/[feature].test.ts`

#### Service Tests:
- [ ] Should create entity with valid data
- [ ] Should reject invalid data
- [ ] Should handle duplicate entries
- [ ] Should update entity successfully
- [ ] Should delete entity successfully
- [ ] Should return not found for invalid ID

#### Repository Tests:
- [ ] Should create database record
- [ ] Should retrieve records with filters
- [ ] Should update existing record
- [ ] Should delete record

### Frontend Tests

**File**: `src/components/features/[feature]/[Component]/[Component].test.tsx`

#### Component Tests:
- [ ] Should render loading state initially
- [ ] Should display data after loading
- [ ] Should handle errors gracefully
- [ ] Should call service on mount
- [ ] Should update state on user interaction
```

### Step 9: API Contracts (Backend)

Create OpenAPI specification in `/contracts/` directory:

```yaml
# contracts/[feature].openapi.yml

openapi: 3.0.0
info:
  title: [Feature] API
  version: 1.0.0

paths:
  /api/v1/[feature]:
    get:
      summary: List [entities]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/[Entity]'
    
    post:
      summary: Create [entity]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Create[Entity]DTO'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/[Entity]'

components:
  schemas:
    [Entity]:
      type: object
      properties:
        id:
          type: string
          format: uuid
        fieldName:
          type: string
    
    Create[Entity]DTO:
      type: object
      required:
        - fieldName
      properties:
        fieldName:
          type: string
```

### Step 10: Quickstart Guide

Create `quickstart.md` for testing:

```markdown
# Quickstart: [Feature Name]

## Prerequisites
- Backend server running on http://localhost:3000
- Database migrations applied
- Test data seeded (if applicable)

## Backend Testing

### 1. Create [Entity]
```bash
curl -X POST http://localhost:3000/api/v1/[feature] \
  -H "Content-Type: application/json" \
  -d '{"fieldName": "value"}'
```

Expected: 201 Created with entity data

### 2. List [Entities]
```bash
curl http://localhost:3000/api/v1/[feature]
```

Expected: 200 OK with array of entities

### 3. Get [Entity] by ID
```bash
curl http://localhost:3000/api/v1/[feature]/{id}
```

Expected: 200 OK with entity data

## Frontend Testing

### 1. Start Development Server
```bash
cd frontend
yarn dev
```

### 2. Navigate to Feature
- Open http://localhost:5173/[feature]
- Should see list of entities
- Click create button
- Fill form and submit
- Verify entity appears in list

## Integration Testing

### Scenario 1: Complete CRUD Flow
1. Create new entity via API
2. Verify appears in Frontend list
3. Update entity via Frontend
4. Verify changes in API response
5. Delete entity via Frontend
6. Verify removed from list

### Scenario 2: Error Handling
1. Submit invalid data
2. Verify validation error displayed
3. Fix data and resubmit
4. Verify success
```

## Phase 4: Update Agent Context

After completing design phase:

```bash
.specify/scripts/bash/update-agent-context.sh copilot
```

This script will:
1. Detect AI agent in use (Copilot in this case)
2. Update `.github/copilot-instructions.md` or similar
3. Add new technologies from current plan
4. Preserve manual additions between markers
5. Ensure agent has latest context

## Phase 5: Re-evaluate Constitution Check

After design completion, verify:

1. **Constitution Compliance**: All design decisions align with constitution
2. **Gate Checks**: Re-run all gate checks from Phase 1
3. **Document Violations**: If any violations, document in "Complexity Tracking" section:

```markdown
## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [specific violation] | [business need] | [why simpler approach insufficient] |
```

4. **Approval Required**: If violations exist, get user approval before proceeding

## Phase 6: Completion & Handoff

### Final Plan Structure

Ensure `plan.md` contains:

- [x] Summary section
- [x] Technical Context (all NEEDS CLARIFICATION resolved)
- [x] Constitution Check (all gates passed or violations justified)
- [x] Project Structure (detailed, feature-specific)
- [x] Complexity Tracking (if violations exist)

### Generated Artifacts

Verify all files created:

- [ ] `plan.md` - Complete implementation plan
- [ ] `research.md` - Research findings (if research was needed)
- [ ] `data-model.md` - Entity and type definitions
- [ ] `contracts/` - API specifications (for backend features)
- [ ] `quickstart.md` - Testing guide

### Report to User

```markdown
# Implementation Plan Complete

**Feature**: [Feature Name]
**Branch**: [branch-name]
**Plan**: [path-to-plan.md]

## Generated Artifacts:
- ✓ Implementation Plan: [path]
- ✓ Research Document: [path] (if created)
- ✓ Data Model: [path]
- ✓ API Contracts: [path] (if applicable)
- ✓ Quickstart Guide: [path]
- ✓ Agent Context: Updated

## Constitution Compliance:
- All gate checks: [PASSED / PASSED with justified violations]
- Functional programming: Enforced
- TypeScript strict: Enabled
- Test coverage target: 80%+

## Next Steps:
1. Review plan.md and generated artifacts
2. Run `/speckit.tasks` to generate implementation tasks
3. Begin implementation following task breakdown

Ready to proceed with task generation?
```

## Key Rules & Best Practices

### MUST DO:
1. ✅ Read constitution completely before starting
2. ✅ Mark unknowns as "NEEDS CLARIFICATION"
3. ✅ Conduct research for all clarifications
4. ✅ Confirm research with user before design
5. ✅ Merge research into specification
6. ✅ Use functional programming patterns (pure functions, immutability)
7. ✅ Use TypeScript strict mode with explicit types
8. ✅ Separate Backend and Frontend clearly
9. ✅ Follow Component types (Core/Shared/Detail) for Frontend
10. ✅ Create detailed, feature-specific structure
11. ✅ Design all 8 implementation steps
12. ✅ Update agent context after design
13. ✅ Re-check constitution compliance
14. ✅ Get approval for any violations

### MUST NOT DO:
1. ❌ Skip constitution reading
2. ❌ Proceed with unresolved NEEDS CLARIFICATION
3. ❌ Skip user confirmation after research
4. ❌ Use class-based patterns
5. ❌ Use `any` types without justification
6. ❌ Mix Backend and Frontend in same repo
7. ❌ Create generic structure (must be feature-specific)
8. ❌ Skip any of the 8 implementation steps
9. ❌ Violate constitution without justification

### For Updates (Existing Code):
1. ✅ Confirm with user if replacing existing logic
2. ✅ Minimize redundant logic creation
3. ✅ Prefer refactoring over duplication
4. ✅ Document what will be replaced
5. ✅ Get explicit approval before replacement

## Error Handling

### If Constitution Check Fails:
1. Stop immediately
2. Report specific violations
3. Request user clarification or justification
4. Document approved violations in Complexity Tracking

### If Research Cannot Resolve Clarification:
1. Document what was researched
2. List remaining unknowns
3. Request user input
4. Do not proceed until resolved

### If User Rejects Research Findings:
1. Update research.md with user feedback
2. Re-conduct research if needed
3. Re-confirm before proceeding

## Success Criteria

Plan is complete when:
- [ ] All NEEDS CLARIFICATION resolved through research
- [ ] Research confirmed by user
- [ ] Research merged into specification
- [ ] All 8 implementation steps designed:
  1. Code structure
  2. Data types
  3. Data models
  4. Migration files (if applicable)
  5. Seed data (if applicable)
  6. Business functions/components
  7. Logic
  8. Unit tests
- [ ] Constitution compliance verified
- [ ] Agent context updated
- [ ] All artifacts generated
- [ ] Plan reviewed and approved
