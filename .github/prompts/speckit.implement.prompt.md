---
agent: speckit.implement
---

# Implementation Execution Workflow

## Context & Objectives

This workflow executes the implementation plan by strictly following the task breakdown in tasks.md. The implementation MUST adhere to the project constitution, follow SOLID principles, and respect the existing codebase patterns.

## Core Principles (NON-NEGOTIABLE)

### 1. Strict Task Adherence
- ✅ Execute ONLY tasks listed in tasks.md
- ✅ Follow task order and dependencies exactly
- ❌ Do NOT create code outside task scope
- ❌ Do NOT implement features not in tasks
- ❌ Do NOT auto-handle tasks not requested by user

### 2. Constitution Compliance
- ✅ Functional programming paradigm (pure functions, immutability)
- ✅ TypeScript strict mode with explicit types
- ✅ SOLID principles in every implementation
- ✅ No class-based patterns (functions only)
- ✅ Result type for error handling
- ✅ Repository pattern with functional composition
- ❌ No any types without justification
- ❌ No mutations of state

### 3. Existing Codebase Respect
- ✅ Study existing code patterns before implementing
- ✅ Follow established naming conventions
- ✅ Use existing utilities and helpers
- ✅ Match existing file structure
- ✅ Reuse existing types and functions
- ❌ Do NOT duplicate existing functionality
- ❌ Do NOT create parallel implementations
- ❌ Do NOT deviate from existing patterns

### 4. SOLID Principles Application

#### Single Responsibility Principle (SRP)
```typescript
// ✅ GOOD: Each function has one responsibility
const validateUserData = (data: unknown): Result<UserDTO> => { /* ... */ };
const createUser = (repo: UserRepository) => 
  async (data: UserDTO): Promise<Result<User>> => { /* ... */ };
const userToDTO = (user: User): UserResponseDTO => ({ /* ... */ });

// ❌ BAD: Function doing multiple things
const createAndValidateUser = async (data: unknown): Promise<User> => {
  // Validation, creation, and transformation in one function
};
```

#### Open/Closed Principle (OCP)
```typescript
// ✅ GOOD: Extend through composition
type PaymentProcessor = (amount: number) => Promise<Result<PaymentResult>>;

const processVietQR: PaymentProcessor = async (amount) => { /* ... */ };
const processCash: PaymentProcessor = async (amount) => { /* ... */ };

const paymentProcessors: Record<PaymentMethod, PaymentProcessor> = {
  [PaymentMethod.VIETQR]: processVietQR,
  [PaymentMethod.CASH]: processCash,
};

// ❌ BAD: Modifying existing function for new payment methods
const processPayment = async (method: string, amount: number) => {
  if (method === 'vietqr') { /* ... */ }
  else if (method === 'cash') { /* ... */ }
  // Adding new method requires modifying this function
};
```

#### Liskov Substitution Principle (LSP)
```typescript
// ✅ GOOD: Consistent function signatures
type Repository<T> = {
  findById: (id: string) => Promise<T | null>;
  findAll: (filters?: unknown) => Promise<T[]>;
  create: (data: unknown) => Promise<T>;
};

// All repositories follow same signature
const userRepository: Repository<User> = { /* ... */ };
const orderRepository: Repository<Order> = { /* ... */ };

// ❌ BAD: Inconsistent signatures
const userRepo = {
  getUser: (id: string) => Promise<User | null>,
  getAllUsers: () => Promise<User[]>,
};
const orderRepo = {
  findById: (id: string) => Promise<Order>,
  list: (page: number) => Promise<Order[]>,
};
```

#### Interface Segregation Principle (ISP)
```typescript
// ✅ GOOD: Specific function types
type ReadRepository<T> = {
  findById: (id: string) => Promise<T | null>;
  findAll: (filters?: unknown) => Promise<T[]>;
};

type WriteRepository<T> = {
  create: (data: unknown) => Promise<T>;
  update: (id: string, data: unknown) => Promise<T>;
  delete: (id: string) => Promise<void>;
};

// Use only what you need
const readOnlyService = (repo: ReadRepository<User>) => ({
  getUsers: () => repo.findAll(),
});

// ❌ BAD: Force all operations even if not needed
type Repository<T> = {
  findById: (id: string) => Promise<T | null>;
  create: (data: unknown) => Promise<T>;
  update: (id: string, data: unknown) => Promise<T>;
  delete: (id: string) => Promise<void>;
  // Read-only service forced to accept write operations
};
```

#### Dependency Inversion Principle (DIP)
```typescript
// ✅ GOOD: Depend on abstractions (function types)
type OrderRepository = {
  create: (data: OrderData) => Promise<Order>;
};

type OrderService = {
  createOrder: (data: CreateOrderDTO) => Promise<Result<Order>>;
};

// Service depends on repository abstraction
const createOrderService = (repository: OrderRepository): OrderService => ({
  createOrder: async (data) => {
    // Implementation depends on abstraction, not concrete repository
    const order = await repository.create(mapDTOToData(data));
    return ok(order);
  },
});

// ❌ BAD: Depend on concretions
const createOrderService = async (data: CreateOrderDTO): Promise<Order> => {
  // Direct database access - tightly coupled
  const order = await OrderModel.create(data);
  return order;
};
```

## Prerequisites & Setup

### Phase 0: Environment Verification

Run prerequisites check with task list:

```bash
cd /Users/hoanganh/Documents/NodeJS/Bakery-CMS
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Parse JSON output for:
- `FEATURE_DIR`: Path to feature directory
- `AVAILABLE_DOCS`: List of available documents (must include tasks.md)

**CRITICAL**: If tasks.md does not exist, STOP and inform user to run `/speckit.tasks` first.

### Phase 1: Checklist Verification

**If `FEATURE_DIR/checklists/` exists:**

1. Scan all checklist files
2. Count for each checklist:
   - Total items: Lines matching `- [ ]` or `- [X]` or `- [x]`
   - Completed: Lines matching `- [X]` or `- [x]`
   - Incomplete: Lines matching `- [ ]`

3. Generate status table:
   ```text
   | Checklist    | Total | Completed | Incomplete | Status |
   |--------------|-------|-----------|------------|--------|
   | ux.md        | 12    | 12        | 0          | ✓ PASS |
   | security.md  | 8     | 5         | 3          | ✗ FAIL |
   ```

4. **If ANY checklist has incomplete items:**
   - Display table
   - STOP and ask: "Some checklists are incomplete. Do you want to proceed with implementation anyway? (yes/no)"
   - Wait for user response
   - If "no"/"wait"/"stop": Halt execution
   - If "yes"/"proceed"/"continue": Continue to Phase 2

5. **If all checklists complete:**
   - Display table showing all passed
   - Automatically proceed to Phase 2

### Phase 2: Load Implementation Context

**REQUIRED DOCUMENTS**:
1. **tasks.md** - Complete task breakdown with execution order
2. **plan.md** - Technical stack, architecture, file structure
3. **specification.md** - Business requirements, user stories
4. **constitution.md** - Project rules and patterns

**OPTIONAL DOCUMENTS** (load if available):
5. **data-model.md** - Entity definitions and relationships
6. **contracts/** - API specifications
7. **research.md** - Technical decisions
8. **quickstart.md** - Integration scenarios

### Phase 3: Analyze Existing Codebase

**CRITICAL STEP**: Before implementing ANY task, analyze existing code patterns:

1. **Identify existing patterns:**
   - How are similar features implemented?
   - What utilities/helpers already exist?
   - What naming conventions are used?
   - What error handling patterns are used?

2. **Scan for reusable code:**
   - Search for existing types that can be reused
   - Find existing validation functions
   - Locate existing mappers and transformers
   - Identify existing middleware and utilities

3. **Check for similar implementations:**
   ```bash
   # Example: Search for similar feature patterns
   grep -r "Repository" packages/api/src/modules/
   grep -r "Service" packages/api/src/modules/
   grep -r "Handler" packages/api/src/modules/
   ```

4. **Document patterns to follow:**
   - File naming: `[feature].services.ts`, `[feature].repositories.ts`
   - Function naming: `create[Entity]`, `get[Entity]ById`, `update[Entity]`
   - Type naming: `[Entity]DTO`, `[Entity]Data`, `[Entity]Response`
   - Import order: external → internal → types

### Phase 4: Project Setup Verification

**REQUIRED**: Verify/create ignore files based on actual project setup.

**Detection Logic:**
1. Check if git repository:
   ```bash
   git rev-parse --git-dir 2>/dev/null
   ```
   If success → verify/create `.gitignore`

2. Check for Docker:
   ```bash
   ls Dockerfile* 2>/dev/null || grep -q "Docker" plan.md
   ```
   If found → verify/create `.dockerignore`

3. Check for ESLint:
   ```bash
   ls .eslintrc* eslint.config.* 2>/dev/null
   ```
   If found → verify/create `.eslintignore` or update `eslint.config.*`

4. Check for Prettier:
   ```bash
   ls .prettierrc* 2>/dev/null
   ```
   If found → verify/create `.prettierignore`

**Essential Patterns by Technology** (from plan.md):

**Node.js/TypeScript** (this project):
```text
# .gitignore
node_modules/
dist/
build/
*.log
.env*
.DS_Store
coverage/
.turbo/
*.tsbuildinfo

# .dockerignore
node_modules/
.git/
.env*
*.log
dist/
coverage/
.turbo/
README.md

# .eslintignore
node_modules/
dist/
build/
coverage/
*.config.js
```

**Action**:
- If file exists: Verify essential patterns present, append missing ones
- If file missing: Create with full pattern set

## Task Execution Framework

### Phase 5: Parse tasks.md Structure

Extract and organize:

1. **Task List:**
   ```typescript
   type Task = {
     id: string;              // T001, T002, etc.
     phase: string;           // Setup, Foundational, US1, US2, Polish
     parallel: boolean;       // Has [P] marker
     userStory?: string;      // US1, US2, US3, etc.
     description: string;     // Task description
     filePath: string;        // Exact file path
     completed: boolean;      // Checked in tasks.md?
   };
   ```

2. **Phase Information:**
   ```typescript
   type Phase = {
     name: string;           // "Phase 1: Setup"
     purpose: string;        // Purpose description
     tasks: Task[];          // All tasks in this phase
     dependencies: string[]; // Which phases must complete first
   };
   ```

3. **Execution Order:**
   - Extract phase dependencies from "Dependencies & Execution Order" section
   - Identify blocking tasks (Foundational phase)
   - Identify parallel opportunities ([P] tasks)
   - Map user story independence

### Phase 6: Task-by-Task Execution

**CRITICAL RULES**:
1. ✅ Execute ONLY uncompleted tasks (checkbox `- [ ]`)
2. ✅ Follow phase order strictly (Setup → Foundational → US1 → US2 → Polish)
3. ✅ Respect dependencies within phases
4. ✅ Complete Foundational phase BEFORE any User Story tasks
5. ✅ Ask user before starting each phase (unless told to continue automatically)
6. ❌ Do NOT skip ahead to later phases
7. ❌ Do NOT implement features not in current task
8. ❌ Do NOT create extra code "for future use"

### Execution Pattern for Each Task

```markdown
## Task: [Task ID] - [Description]

### 1. Pre-Implementation Analysis
- [ ] Read task requirements from tasks.md
- [ ] Check if this modifies existing files
- [ ] If modifying existing: Review current implementation
- [ ] Identify existing patterns to follow
- [ ] Identify existing code to reuse

### 2. Existing Code Check (CRITICAL)
```bash
# Check if file exists
ls [file-path] 2>/dev/null

# If exists, read and analyze
cat [file-path]
```

**If file exists:**
- Read complete file
- Understand existing structure
- Identify what needs to change
- Plan minimal changes
- **Ask user for confirmation if replacing logic**

**If file doesn't exist:**
- Proceed with creation following patterns

### 3. Pattern Compliance Check
Before writing code, verify:
- [ ] Follows functional programming (pure functions, immutability)
- [ ] Uses TypeScript strict mode (explicit types, no any)
- [ ] Follows SOLID principles (appropriate to task)
- [ ] Matches existing naming conventions
- [ ] Uses existing types/utilities where possible
- [ ] Returns Result type for error handling
- [ ] Has explicit return type

### 4. Implementation
Write code that:
- Implements ONLY what the task specifies
- Follows existing patterns exactly
- Reuses existing code where possible
- Adds no extra functionality
- Has minimal scope

**Example - Backend Service Implementation:**
```typescript
// Task: T050 [P] [US1] Implement service functions in packages/api/src/modules/user/services/user.services.ts

// 1. Check existing imports and patterns
import { Result, ok, err } from '@common/types';
import { UserRepository } from '../repositories/user.repositories';
import { CreateUserDTO, UserResponseDTO } from '../dto/user.dto';
import { User } from '@common/types/user.types';
import { validateUserData } from '../validators/user.validators';
import { userToResponseDTO } from '../mappers/user.mappers';
import { AppError, createValidationError } from '@common/errors';

// 2. Follow functional programming - dependency injection
export const createUserService = (repository: UserRepository) => ({
  
  // 3. Pure function with explicit types
  createUser: async (data: CreateUserDTO): Promise<Result<UserResponseDTO, AppError>> => {
    // 4. Validation using existing validator
    const validationResult = validateUserData(data);
    if (!validationResult.success) {
      return err(validationResult.error);
    }

    // 5. Business logic
    try {
      const userData = {
        name: data.name,
        email: data.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 6. Use repository abstraction
      const user = await repository.create(userData);
      
      // 7. Transform using existing mapper
      const responseDTO = userToResponseDTO(user);
      
      return ok(responseDTO);
    } catch (error) {
      return err(handleDatabaseError(error));
    }
  },

  // Implement other service functions as specified in task...
});

// 8. Type for service (following ISP)
export type UserService = ReturnType<typeof createUserService>;
```

**Example - Frontend Component Implementation:**
```typescript
// Task: T055 [US1] Create Detail component in src/components/features/user/UserList/UserList.tsx

import { useState, useEffect } from 'react';
import { User } from '@/types/models/user.model';
import { userService } from '@/services/user.service';
import { AppError } from '@/types/errors';
import { Spinner } from '@/components/core/Spinner';
import { ErrorMessage } from '@/components/core/ErrorMessage';
import { UserCard } from '@/components/shared/UserCard';

// 1. Define props type
type UserListProps = {
  categoryId?: string;
};

// 2. Functional component only
export const UserList = ({ categoryId }: UserListProps) => {
  // 3. Immutable state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  // 4. Data fetching
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      
      // Use existing service
      const result = await userService.getUsers({ categoryId });
      
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error);
      }
      
      setLoading(false);
    };

    fetchUsers();
  }, [categoryId]);

  // 5. Handle user interaction
  const handleUserAction = async (userId: string) => {
    // Immutable state update
    const result = await userService.performAction(userId);
    
    if (result.success) {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? result.data : user
        )
      );
    }
  };

  // 6. Conditional rendering
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;

  // 7. Use existing shared components
  return (
    <div className="user-list">
      {users.map(user => (
        <UserCard
          key={user.id}
          user={user}
          onAction={handleUserAction}
        />
      ))}
    </div>
  );
};
```

### 5. Code Validation
After implementation, verify:
- [ ] TypeScript compiles without errors
- [ ] ESLint passes (no warnings)
- [ ] Follows functional programming principles
- [ ] Follows SOLID principles
- [ ] No code duplication
- [ ] No extra functionality beyond task
- [ ] Uses existing utilities/types
- [ ] Has proper error handling

### 6. Task Completion
- [ ] Mark task as complete in tasks.md: `- [X]`
- [ ] Commit changes with task ID in message: `feat: [TaskID] - [Description]`
- [ ] Report completion to user
- [ ] Move to next task

## Phase 7: Phase-by-Phase Execution

### Phase 1: Setup
**Purpose**: Project initialization and configuration

**Before starting:**
- Verify project structure doesn't exist or needs updates
- Check if this is new project or update

**Execution:**
```text
For each task in Setup phase:
  1. Read task requirements
  2. Check if already done (files exist and correct)
  3. If exists: Verify and update if needed
  4. If not exists: Create following existing patterns
  5. Mark complete: - [X] TXXX
```

**Checkpoint:** Verify all setup tasks complete before Foundational phase

### Phase 2: Foundational (CRITICAL GATE)
**Purpose**: Shared infrastructure that blocks all user stories

**⚠️ CRITICAL**: This phase MUST be 100% complete before ANY user story work begins.

**Before starting:**
- Ask user: "Starting Foundational phase (blocking prerequisites). This must complete before user story implementation. Continue? (yes/no)"
- If "no": Stop and wait for user
- If "yes": Proceed

**Execution:**
```text
For each task in Foundational phase:
  1. Analyze existing infrastructure
  2. Check if functionality already exists
  3. If exists: Reuse, don't duplicate
  4. If not exists: Implement following patterns
  5. Test infrastructure works
  6. Mark complete: - [X] TXXX
```

**Checkpoint:** 
- Verify ALL foundational tasks complete
- Test infrastructure is working
- Report to user: "Foundational phase complete. Ready to start user story implementation."

### Phase 3+: User Story Implementation

**For each User Story phase:**

**Before starting phase:**
- Identify user story (US1, US2, US3, etc.)
- Check priority (P1, P2, P3, etc.)
- Read story goal and acceptance criteria
- Ask user: "Starting User Story [N] - [Title] (Priority: P[N]). This story can be implemented independently. Continue? (yes/no)"

**Execution follows 8-step structure:**

#### Step 1: Code Structure
```text
Tasks marked: [US1] Create/Update code structure
- Check if directories exist
- Create only if needed
- Follow existing structure pattern
- Mark complete: - [X] TXXX
```

#### Step 2: Data Types
```text
Tasks marked: [US1] Create/Update data types
- Check existing types that can be reused
- Create only new types needed for THIS story
- Follow existing type naming conventions
- No any types
- Explicit return types
- Mark complete: - [X] TXXX
```

#### Step 3: Data Models
```text
Tasks marked: [US1] Create/Update data models
- Check if models exist
- Reuse existing models if possible
- Create new models only for new entities in THIS story
- Follow Sequelize patterns (Backend)
- Follow mapper patterns (Frontend)
- Mark complete: - [X] TXXX
```

#### Step 4: Migration Files (Backend only)
```text
Tasks marked: [US1] Create/Update migration files
- Only if database schema changes
- Create migration following existing pattern
- Test migration up and down
- Mark complete: - [X] TXXX
```

#### Step 5: Seed Data (if needed)
```text
Tasks marked: [US1] Create/Update seed data
- Only if test data needed
- Follow existing seed pattern
- Test seeder works
- Mark complete: - [X] TXXX
```

#### Step 6: Business Functions/Components
```text
Tasks marked: [US1] Create/Update business functions/components
- Check existing functions to reuse
- Implement ONLY functions for THIS story
- Follow functional programming strictly
- Follow SOLID principles
- Use dependency injection
- Pure functions with explicit types
- Mark complete: - [X] TXXX
```

#### Step 7: Logic
```text
Tasks marked: [US1] Create/Update logic
- Implement handlers/controllers (Backend)
- Implement state management (Frontend)
- Connect functions from Step 6
- Add error handling using Result type
- No logic outside task scope
- Mark complete: - [X] TXXX
```

#### Step 8: Unit Tests
```text
Tasks marked: [US1] Create/Update unit tests
- Write tests for new functions
- Follow existing test patterns
- Aim for 80% coverage
- All tests must pass
- Mark complete: - [X] TXXX
```

**After completing all steps for user story:**
- Run tests for this story
- Verify story works independently
- Report to user: "User Story [N] complete. Story is independently testable and functional."
- Ask: "Proceed to next user story or stop for review?"

### Phase N: Polish & Cross-Cutting

**Purpose**: Final improvements and cleanup

**Before starting:**
- Verify all desired user stories complete
- Ask user: "All user stories complete. Start polish phase (documentation, optimization, cleanup)? (yes/no)"

**Execution:**
```text
For each polish task:
  1. Refactor common patterns
  2. Update documentation
  3. Performance optimization
  4. Remove any temporary code
  5. Final test run
  6. Mark complete: - [X] TXXX
```

## Phase 8: Update Strategy (For Existing Code)

**When modifying existing files:**

### Step 1: Analyze Current Implementation
```bash
# Read entire file
cat [existing-file-path]

# Understand:
- What does current code do?
- What patterns are used?
- What will change?
- What can be reused?
```

### Step 2: Confirm with User (MANDATORY)
```text
⚠️ CONFIRMATION REQUIRED ⚠️

Task: [Task ID] requires modifying existing file
File: [file-path]

Current implementation:
[Show relevant current code]

Planned changes:
[Describe what will be replaced/updated]

Reason:
[Why this change is needed per task]

Will replace logic:
- [Function/code being replaced]

Will reuse:
- [Functions/types being kept]

Proceed with replacement? (yes/no)
```

**User Response:**
- If "no": Skip this task, mark as skipped, ask for clarification
- If "yes": Proceed with minimal changes

### Step 3: Minimal Implementation
```text
When updating existing code:
1. Change ONLY what task requires
2. Keep existing patterns
3. Reuse existing functions
4. Don't refactor unless task specifies
5. Don't add extra features
6. Preserve existing tests that still apply
```

### Step 4: Cleanup Tasks
```text
If task includes cleanup:
- Remove deprecated code
- Remove redundant implementations
- Update related imports
- Update related tests
```

## Progress Tracking & Reporting

### After Each Task
```text
✅ Task T[XXX] Complete: [Description]
   File: [file-path]
   Changes: [brief description]
   Status: [compiled/tested/passed]
```

### After Each Phase
```text
✅ Phase [N]: [Phase Name] Complete
   Total tasks: [count]
   Completed: [count]
   Skipped: [count] (with reasons)
   
   Checkpoint: [verification result]
   
   Next: [Next phase name] ([count] tasks)
```

### After Each User Story
```text
✅ User Story [N] - [Title] Complete
   Priority: P[N]
   Total tasks: [count]
   
   Independent Test Result:
   [How to verify this story works]
   
   Coverage: [percentage]%
   Tests: [passed/total]
```

## Error Handling & Recovery

### If Task Fails
1. Report error clearly:
   ```text
   ❌ Task T[XXX] Failed: [Description]
   Error: [error message]
   File: [file-path]
   
   Possible causes:
   - [cause 1]
   - [cause 2]
   
   Suggested fixes:
   - [fix 1]
   - [fix 2]
   ```

2. Ask user:
   ```text
   How to proceed?
   1. Retry task
   2. Skip and continue
   3. Stop for manual fix
   4. Get help
   ```

### If Foundational Phase Fails
```text
⚠️ CRITICAL: Foundational phase task failed

This blocks ALL user story implementation.
Must be resolved before proceeding.

Failed task: T[XXX]
Error: [details]

Cannot proceed to user stories until resolved.
```

### If User Story Task Fails
```text
⚠️ User Story [N] task failed

This affects only User Story [N].
Other user stories can potentially proceed independently.

Failed task: T[XXX]
Story: US[N]

Options:
1. Fix and retry this story
2. Skip this story, proceed to next
3. Stop for review
```

## Validation & Quality Gates

### Before Phase Completion
- [ ] All tasks in phase completed or explicitly skipped
- [ ] All files compile without errors
- [ ] ESLint passes with no errors
- [ ] TypeScript strict mode satisfied
- [ ] No console warnings

### Before User Story Completion
- [ ] All 8 steps completed for story
- [ ] Story works independently (test scenario passes)
- [ ] Tests written and passing
- [ ] Coverage ≥ 80% for new code
- [ ] Follows functional programming
- [ ] Follows SOLID principles
- [ ] No code duplication

### Before Final Completion
- [ ] All phases complete
- [ ] All user stories functional independently
- [ ] All tests passing
- [ ] Documentation updated
- [ ] No temporary/debug code remaining
- [ ] Constitution compliance verified

## Final Report

```markdown
# Implementation Complete

**Feature**: [Feature Name]
**Branch**: [branch-name]

## Summary
- Total Tasks: [count]
- Completed: [count]
- Skipped: [count] (see details below)
- Duration: [time]

## Phases Completed
- ✅ Phase 1: Setup ([count] tasks)
- ✅ Phase 2: Foundational ([count] tasks)
- ✅ Phase 3: User Story 1 - [Title] ([count] tasks)
- ✅ Phase 4: User Story 2 - [Title] ([count] tasks)
- ✅ Phase N: Polish ([count] tasks)

## User Stories Delivered
- ✅ US1 (P1): [Title] - Independently functional and tested
- ✅ US2 (P2): [Title] - Independently functional and tested
- ✅ US3 (P3): [Title] - Independently functional and tested

## Quality Metrics
- Test Coverage: [percentage]% (target: 80%)
- Tests Passing: [passed]/[total]
- TypeScript Errors: 0
- ESLint Errors: 0
- Constitution Compliance: ✓ PASS

## Files Created/Modified
### Backend
- packages/common/src/types/[feature].types.ts
- packages/database/src/models/[entity].model.ts
- packages/api/src/modules/[feature]/...

### Frontend  
- src/components/features/[feature]/...
- src/services/[feature].service.ts
- src/types/...

## Skipped Tasks (if any)
- T[XXX]: [Reason for skipping]

## Verification Steps
Run these commands to verify implementation:

Backend:
```bash
cd backend
npm run lint
npm run type-check
npm run test
npm run build
```

Frontend:
```bash
cd frontend
npm run lint
npm run type-check
npm run test
npm run build
```

Integration:
Follow quickstart.md scenarios

## Next Steps
1. ✓ Implementation complete
2. [ ] Run integration tests
3. [ ] Deploy to staging
4. [ ] Manual QA testing
5. [ ] Production deployment

Implementation completed successfully! 🎉
```

## Key Rules Summary

### ALWAYS DO:
1. ✅ Execute ONLY tasks in tasks.md
2. ✅ Follow phase and task order strictly
3. ✅ Complete Foundational phase before user stories
4. ✅ Follow functional programming paradigm
5. ✅ Apply SOLID principles
6. ✅ Analyze existing code before implementing
7. ✅ Reuse existing patterns and code
8. ✅ Ask confirmation before replacing logic
9. ✅ Use TypeScript strict mode
10. ✅ Return Result type for error handling
11. ✅ Mark tasks complete: - [X]
12. ✅ Test after each phase
13. ✅ Report progress regularly
14. ✅ Verify user story independence

### NEVER DO:
1. ❌ Implement code not in tasks
2. ❌ Skip Foundational phase tasks
3. ❌ Auto-handle tasks not requested
4. ❌ Create extra "future" features
5. ❌ Duplicate existing functionality
6. ❌ Use class-based patterns
7. ❌ Use any types without justification
8. ❌ Mutate state
9. ❌ Skip user confirmation for updates
10. ❌ Deviate from existing patterns
11. ❌ Add code outside task scope
12. ❌ Proceed if Foundational phase fails

## Success Criteria

Implementation is successful when:
- [ ] All tasks in tasks.md completed or explicitly skipped with reason
- [ ] All user stories independently functional and tested
- [ ] All tests passing with ≥80% coverage
- [ ] TypeScript compiles with strict mode
- [ ] ESLint passes with no errors
- [ ] Constitution compliance verified
- [ ] Functional programming paradigm followed throughout
- [ ] SOLID principles applied appropriately
- [ ] No code duplication
- [ ] No extra functionality beyond scope
- [ ] Existing patterns respected and followed
- [ ] Documentation updated
- [ ] Final report generated
