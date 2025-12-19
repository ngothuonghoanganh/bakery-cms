# Tasks: Authentication and Authorization

**Input**: Design documents from `/specs/004-authentication-authorization/`  
**Prerequisites**: plan.md, specification.md, data-model.md, contracts/, quickstart.md

**Organization**: Tasks organized by functional requirement following 8-step implementation approach

---

## Task Format

```text
- [ ] [TaskID] [P?] [Feature?] Description with exact file path
```

**Format Components**:
- **Checkbox**: `- [ ]` (markdown checkbox)  
- **Task ID**: Sequential (T001, T002, T003...) in execution order  
- **[P] marker**: Include ONLY if parallelizable (different files, no dependencies)  
- **[Feature] label**: [AUTH], [OAUTH], [RBAC], [ADMIN] for feature grouping  
- **Description**: Clear action with exact file path

---

## Phase 1: Setup & Foundation

### Project Infrastructure Setup

- [ ] T001 [P] Configure authentication dependencies in bakery-cms-api/package.json (jsonwebtoken, bcrypt, passport, dotenv)
- [ ] T002 [P] Configure authentication dependencies in bakery-cms-web/package.json (axios, zustand state management)
- [ ] T003 [P] Create environment variables template in bakery-cms-api/.env.example for JWT secrets and OAuth credentials
- [ ] T004 [P] Configure JWT and OAuth constants in bakery-cms-api/packages/common/src/constants/auth.constants.ts
- [ ] T005 [P] Setup TypeScript configuration for authentication types in bakery-cms-api/packages/common/src/types/auth.types.ts
- [ ] T006 [P] Initialize authentication middleware directory structure in bakery-cms-api/packages/api/src/middleware/
- [ ] T007 [P] Setup authentication module directory in bakery-cms-api/packages/api/src/modules/auth/
- [ ] T008 [P] Create authentication component directories in bakery-cms-web/src/components/core/, bakery-cms-web/src/components/shared/, bakery-cms-web/src/components/features/auth/

### Database Foundation

- [ ] T009 Create User model migration in bakery-cms-api/packages/database/src/migrations/004-create-users-table.ts
- [ ] T010 Create AuthSession model migration in bakery-cms-api/packages/database/src/migrations/005-create-auth-sessions-table.ts
- [ ] T011 Run database migrations to create auth tables: `npm run migrate:up`
- [ ] T012 Create admin user seeder in bakery-cms-api/packages/database/src/seeders/admin-user.seeder.ts
- [ ] T013 [P] Setup database indexes for authentication performance optimization
- [ ] T014 [P] Configure database connection pool settings for authentication workload

**Checkpoint**: Foundation ready - authentication implementation can begin

---

## Phase 2: Core Authentication (BR-001, BR-002) 🎯 MVP

**Goal**: Implement email/password authentication with 365-day JWT tokens  
**Business Rules**: BR-001 (Multi-Authentication Support), BR-002 (Long-term Token Validity)  
**Independent Test**: User can register, login with email/password, receive 365-day token, and access protected endpoints

### Step 1: Create/Update Code Structure

- [ ] T015 [P] [AUTH] Create auth module directories in bakery-cms-api/packages/api/src/modules/auth/{controllers,services,repositories,dto,validators,utils}/
- [ ] T016 [P] [AUTH] Create authentication component directories in bakery-cms-web/src/components/{core/AuthButton,shared/LoginForm,features/auth/LoginPage}/
- [ ] T017 [P] [AUTH] Create auth services directory in bakery-cms-web/src/services/auth.service.ts
- [ ] T018 [P] [AUTH] Create auth hooks directory in bakery-cms-web/src/hooks/useAuth.ts

### Step 2: Create/Update Data Types

Backend Types:
- [ ] T019 [P] [AUTH] Define User domain type in bakery-cms-api/packages/common/src/types/auth.types.ts
- [ ] T020 [P] [AUTH] Define AuthSession domain type in bakery-cms-api/packages/common/src/types/auth.types.ts
- [ ] T021 [P] [AUTH] Define AuthService function type in bakery-cms-api/packages/common/src/types/auth.types.ts
- [ ] T022 [P] [AUTH] Define UserRepository function type in bakery-cms-api/packages/common/src/types/auth.types.ts
- [ ] T023 [P] [AUTH] Create authentication DTOs in bakery-cms-api/packages/api/src/modules/auth/dto/auth.dto.ts
- [ ] T024 [P] [AUTH] Define authentication enums in bakery-cms-api/packages/common/src/enums/auth.enums.ts (UserRole, UserStatus, AuthProvider)

Frontend Types:
- [ ] T025 [P] [AUTH] Create API response types in bakery-cms-web/src/types/api/auth.api.ts
- [ ] T026 [P] [AUTH] Create domain model types in bakery-cms-web/src/types/models/auth.model.ts
- [ ] T027 [P] [AUTH] Create authentication form types in bakery-cms-web/src/types/forms/auth.forms.ts

### Step 3: Create/Update Data Models

Backend Models:
- [ ] T028 [P] [AUTH] Implement User Sequelize model in bakery-cms-api/packages/database/src/models/user.model.ts
- [ ] T029 [P] [AUTH] Implement AuthSession Sequelize model in bakery-cms-api/packages/database/src/models/auth-session.model.ts
- [ ] T030 [P] [AUTH] Define model associations between User and AuthSession
- [ ] T031 [P] [AUTH] Add model validation rules for email, password requirements
- [ ] T032 [P] [AUTH] Add model hooks for password hashing and session cleanup

Frontend Models:
- [ ] T033 [P] [AUTH] Create API response mappers in bakery-cms-web/src/types/mappers/auth.mapper.ts
- [ ] T034 [P] [AUTH] Implement mapAuthFromAPI and mapUserFromAPI functions

### Step 4: Create/Update Migration Files

- [ ] T035 [AUTH] Complete User table migration with proper indexes in bakery-cms-api/packages/database/src/migrations/004-create-users-table.ts
- [ ] T036 [AUTH] Complete AuthSession table migration with foreign keys in bakery-cms-api/packages/database/src/migrations/005-create-auth-sessions-table.ts
- [ ] T037 [AUTH] Add authentication-specific database indexes for performance
- [ ] T038 [AUTH] Test migration rollback functionality: `npm run migrate:down`

### Step 5: Create/Update Seed Data

- [ ] T039 [AUTH] Complete admin user seeder implementation in bakery-cms-api/packages/database/src/seeders/admin-user.seeder.ts
- [ ] T040 [AUTH] Add test user data for development environment
- [ ] T041 [AUTH] Run admin seeder to verify: `npm run seed:up`
- [ ] T042 [AUTH] Verify admin login with seeded credentials

### Step 6: Create/Update Business Functions/Components

Backend Functions:
- [ ] T043 [P] [AUTH] Implement user repository functions in bakery-cms-api/packages/api/src/modules/auth/repositories/user.repository.ts
- [ ] T044 [P] [AUTH] Implement auth session repository functions in bakery-cms-api/packages/api/src/modules/auth/repositories/auth-session.repository.ts
- [ ] T045 [P] [AUTH] Implement password utility functions in bakery-cms-api/packages/api/src/modules/auth/utils/password.utils.ts (bcrypt 12 rounds)
- [ ] T046 [P] [AUTH] Implement JWT utility functions in bakery-cms-api/packages/api/src/modules/auth/utils/jwt.utils.ts (365-day expiration)
- [ ] T047 [P] [AUTH] Implement authentication validators in bakery-cms-api/packages/api/src/modules/auth/validators/auth.validator.ts

Frontend Components:
- [ ] T048 [P] [AUTH] Create Core Input component in bakery-cms-web/src/components/core/Input/Input.tsx
- [ ] T049 [P] [AUTH] Create Core Button component in bakery-cms-web/src/components/core/Button/Button.tsx
- [ ] T050 [AUTH] Create Shared LoginForm component in bakery-cms-web/src/components/shared/LoginForm/LoginForm.tsx
- [ ] T051 [AUTH] Create Shared RegisterForm component in bakery-cms-web/src/components/shared/RegisterForm/RegisterForm.tsx

### Step 7: Create/Update Logic

Backend Logic:
- [ ] T052 [AUTH] Implement authentication service functions in bakery-cms-api/packages/api/src/modules/auth/services/auth.service.ts
- [ ] T053 [AUTH] Implement authentication controllers in bakery-cms-api/packages/api/src/modules/auth/controllers/auth.controller.ts
- [ ] T054 [AUTH] Implement JWT middleware for token validation in bakery-cms-api/packages/api/src/middleware/auth.middleware.ts
- [ ] T055 [AUTH] Register authentication routes in bakery-cms-api/packages/api/src/modules/auth/routes.ts
- [ ] T056 [AUTH] Add authentication routes to main API router
- [ ] T057 [AUTH] Implement error handling for authentication endpoints

Frontend Logic:
- [ ] T058 [AUTH] Create authentication service in bakery-cms-web/src/services/auth.service.ts
- [ ] T059 [AUTH] Implement useAuth custom hook in bakery-cms-web/src/hooks/useAuth.ts
- [ ] T060 [AUTH] Extend Zustand auth store in bakery-cms-web/src/stores/authStore.ts
- [ ] T061 [AUTH] Create Detail LoginPage component in bakery-cms-web/src/components/features/auth/LoginPage/LoginPage.tsx
- [ ] T062 [AUTH] Create Detail RegisterPage component in bakery-cms-web/src/components/features/auth/RegisterPage/RegisterPage.tsx
- [ ] T063 [AUTH] Implement token refresh logic and automatic retry

### Step 8: Create/Update Unit Tests

Backend Tests:
- [ ] T064 [P] [AUTH] Write user repository tests in bakery-cms-api/packages/api/src/modules/auth/tests/user.repository.test.ts
- [ ] T065 [P] [AUTH] Write auth session repository tests in bakery-cms-api/packages/api/src/modules/auth/tests/auth-session.repository.test.ts
- [X] T066 [P] [AUTH] Write authentication service tests in bakery-cms-api/packages/api/src/modules/auth/tests/auth.service.test.ts
- [ ] T067 [P] [AUTH] Write authentication controller tests in bakery-cms-api/packages/api/src/modules/auth/tests/auth.controller.test.ts
- [X] T068 [P] [AUTH] Write JWT utility tests in bakery-cms-api/packages/api/src/modules/auth/tests/jwt.utils.test.ts
- [X] T069 [P] [AUTH] Write password utility tests in bakery-cms-api/packages/api/src/modules/auth/tests/password.utils.test.ts
- [X] T070 [AUTH] Run authentication tests to verify coverage: `npm test -- auth`

Frontend Tests:
- [ ] T071 [P] [AUTH] Write Core Input component tests in bakery-cms-web/src/components/core/Input/Input.test.tsx
- [ ] T072 [P] [AUTH] Write Core Button component tests in bakery-cms-web/src/components/core/Button/Button.test.tsx
- [ ] T073 [P] [AUTH] Write Shared LoginForm tests in bakery-cms-web/src/components/shared/LoginForm/LoginForm.test.tsx
- [ ] T074 [P] [AUTH] Write authentication service tests in bakery-cms-web/src/services/auth.service.test.ts
- [ ] T075 [P] [AUTH] Write useAuth hook tests in bakery-cms-web/src/hooks/useAuth.test.ts
- [ ] T076 [AUTH] Run frontend authentication tests: `npm test -- auth`

**Checkpoint**: Core authentication fully functional - users can register, login, and access protected endpoints

---

## Phase 3: OAuth Integration (BR-001, BR-007) 

**Goal**: Add Google and Facebook OAuth with PKCE security  
**Business Rules**: BR-001 (Multi-Authentication Support), BR-007 (OAuth Security Compliance)  
**Independent Test**: Users can login via Google/Facebook OAuth, tokens are issued, PKCE flow is secure

### Step 1: Create/Update Code Structure

- [X] T077 [P] [OAUTH] Create OAuth service directory in bakery-cms-api/packages/api/src/modules/auth/services/oauth.service.ts
- [X] T078 [P] [OAUTH] Create OAuth controllers in bakery-cms-api/packages/api/src/modules/auth/controllers/oauth.controller.ts
- [X] T079 [P] [OAUTH] Create OAuth utilities in bakery-cms-api/packages/api/src/modules/auth/utils/oauth.utils.ts
- [X] T080 [P] [OAUTH] Create OAuth configuration in bakery-cms-api/packages/api/src/config/oauth.config.ts

### Step 2: Create/Update Data Types

Backend OAuth Types:
- [X] T081 [P] [OAUTH] Define OAuth provider types in bakery-cms-api/packages/common/src/types/oauth.types.ts
- [X] T082 [P] [OAUTH] Define OAuthService function type in bakery-cms-api/packages/common/src/types/oauth.types.ts
- [X] T083 [P] [OAUTH] Create OAuth DTOs in bakery-cms-api/packages/api/src/modules/auth/dto/oauth.dto.ts
- [X] T084 [P] [OAUTH] Define OAuth configuration types for Google/Facebook

Frontend OAuth Types:
- [ ] T085 [P] [OAUTH] Create OAuth API types in bakery-cms-web/src/types/api/oauth.api.ts
- [ ] T086 [P] [OAUTH] Create OAuth component prop types

### Step 3: Create/Update Data Models

- [X] T087 [P] [OAUTH] Update User model to support OAuth providers (Google, Facebook)
- [X] T088 [P] [OAUTH] Add OAuth provider validation to existing User model
- [X] T089 [P] [OAUTH] Update user repository to handle OAuth user creation and lookup

### Step 4: Create/Update Migration Files

- [X] T090 [OAUTH] Create migration to add OAuth provider fields to users table in bakery-cms-api/packages/database/src/migrations/006-add-oauth-fields-to-users.ts
- [X] T091 [OAUTH] Add indexes for OAuth provider lookups
- [X] T092 [OAUTH] Run OAuth migration: `npm run migrate:up`

### Step 5: Create/Update Seed Data

- [X] T093 [P] [OAUTH] Add OAuth test users to development seeders (optional)
- [X] T094 [OAUTH] Verify OAuth user seeding works correctly

### Step 6: Create/Update Business Functions/Components

Backend Functions:
- [X] T095 [P] [OAUTH] Implement PKCE code generation and verification functions in bakery-cms-api/packages/api/src/modules/auth/utils/oauth.utils.ts
- [X] T096 [P] [OAUTH] Implement Google OAuth provider service in bakery-cms-api/packages/api/src/modules/auth/services/oauth.service.ts
- [X] T097 [P] [OAUTH] Implement Facebook OAuth provider service in bakery-cms-api/packages/api/src/modules/auth/services/oauth.service.ts
- [X] T098 [P] [OAUTH] Implement OAuth user mapping functions

Frontend Components:
- [X] T099 [P] [OAUTH] Create Core OAuthButton component in bakery-cms-web/src/components/core/OAuthButton/OAuthButton.tsx
- [X] T100 [OAUTH] Update Shared LoginForm to include OAuth buttons
- [X] T101 [OAUTH] Create OAuth callback handler component in bakery-cms-web/src/components/features/auth/OAuthCallback/OAuthCallback.tsx

### Step 7: Create/Update Logic

Backend Logic:
- [X] T102 [OAUTH] Implement OAuth controllers for auth URL generation and callback handling in bakery-cms-api/packages/api/src/modules/auth/controllers/oauth.controller.ts
- [X] T103 [OAUTH] Implement OAuth middleware for state validation in bakery-cms-api/packages/api/src/middleware/oauth.middleware.ts
- [X] T104 [OAUTH] Register OAuth routes in authentication router
- [X] T105 [OAUTH] Implement OAuth error handling and security validation

Frontend Logic:
- [X] T106 [OAUTH] Create OAuth service in bakery-cms-web/src/services/oauth.service.ts
- [X] T107 [OAUTH] Implement useOAuth custom hook in bakery-cms-web/src/hooks/useOAuth.ts
- [X] T108 [OAUTH] Add OAuth methods to authentication store
- [X] T109 [OAUTH] Implement OAuth state management and PKCE flow
- [X] T110 [OAUTH] Create OAuth callback page routing and token exchange

### Step 8: Create/Update Unit Tests

Backend Tests:
- [ ] T111 [P] [OAUTH] Write OAuth utility tests (PKCE) in bakery-cms-api/packages/api/src/modules/auth/tests/oauth.utils.test.ts
- [ ] T112 [P] [OAUTH] Write OAuth service tests in bakery-cms-api/packages/api/src/modules/auth/tests/oauth.service.test.ts
- [ ] T113 [P] [OAUTH] Write OAuth controller tests in bakery-cms-api/packages/api/src/modules/auth/tests/oauth.controller.test.ts
- [ ] T114 [OAUTH] Run OAuth integration tests: `npm test -- oauth`

Frontend Tests:
- [ ] T115 [P] [OAUTH] Write OAuth button component tests in bakery-cms-web/src/components/core/OAuthButton/OAuthButton.test.tsx
- [ ] T116 [P] [OAUTH] Write OAuth service tests in bakery-cms-web/src/services/oauth.service.test.ts
- [ ] T117 [P] [OAUTH] Write OAuth hook tests in bakery-cms-web/src/hooks/useOAuth.test.ts
- [ ] T118 [OAUTH] Run OAuth frontend tests: `npm test -- oauth`

**Checkpoint**: OAuth authentication fully functional - users can login via Google/Facebook with PKCE security

---

## Phase 4: Role-Based Access Control (BR-003)

**Goal**: Implement RBAC with Admin, Seller, Customer, Viewer roles  
**Business Rules**: BR-003 (Role-Based Access Control)  
**Independent Test**: Users with different roles can only access appropriate API endpoints and UI sections

### Step 1: Create/Update Code Structure

- [X] T119 [P] [RBAC] Create RBAC middleware directory in bakery-cms-api/packages/api/src/middleware/rbac.middleware.ts
- [X] T120 [P] [RBAC] Create permission management utilities in bakery-cms-api/packages/api/src/modules/auth/utils/permissions.utils.ts
- [X] T121 [P] [RBAC] Create role management components in bakery-cms-web/src/components/features/rbac/

### Step 2: Create/Update Data Types

Backend RBAC Types:
- [X] T122 [P] [RBAC] Define permission types in bakery-cms-api/packages/common/src/types/permissions.types.ts
- [X] T123 [P] [RBAC] Define RBAC service function types in bakery-cms-api/packages/common/src/types/rbac.types.ts
- [X] T124 [P] [RBAC] Create role-based DTOs for API access control

Frontend RBAC Types:
- [X] T125 [P] [RBAC] Create role-based component prop types
- [X] T126 [P] [RBAC] Define permission check function types

### Step 3: Create/Update Data Models

- [X] T127 [P] [RBAC] Update User model with role validation and default values
- [X] T128 [P] [RBAC] Create permission mapping constants for each role
- [X] T129 [P] [RBAC] Update user repository with role-based queries

### Step 4: Create/Update Migration Files

- [X] T130 [RBAC] Create role configuration migration (if needed) in bakery-cms-api/packages/database/src/migrations/007-configure-user-roles.ts
- [X] T131 [RBAC] Add role-based database indexes for performance
- [X] T132 [RBAC] Run RBAC migration: `npm run migrate:up`

### Step 5: Create/Update Seed Data

- [X] T133 [P] [RBAC] Add users with different roles to development seeders
- [X] T134 [RBAC] Verify role-based seeding works correctly

### Step 6: Create/Update Business Functions/Components

Backend Functions:
- [X] T135 [P] [RBAC] Implement permission check functions in bakery-cms-api/packages/api/src/modules/auth/utils/permissions.utils.ts
- [X] T136 [P] [RBAC] Implement role-based service functions in bakery-cms-api/packages/api/src/modules/auth/services/rbac.service.ts
- [X] T137 [P] [RBAC] Create role validation functions

Frontend Components:
- [X] T138 [P] [RBAC] Create Core RoleGate component in bakery-cms-web/src/components/core/RoleGate/RoleGate.tsx
- [X] T139 [P] [RBAC] Create Shared ProtectedRoute component in bakery-cms-web/src/components/shared/ProtectedRoute/ProtectedRoute.tsx
- [X] T140 [RBAC] Update navigation components with role-based visibility

### Step 7: Create/Update Logic

Backend Logic:
- [X] T141 [RBAC] Implement RBAC middleware in bakery-cms-api/packages/api/src/middleware/rbac.middleware.ts
- [X] T142 [RBAC] Apply RBAC middleware to protected API endpoints
- [X] T143 [RBAC] Implement role-based authorization checks in controllers
- [X] T144 [RBAC] Add role-based error responses and handling

Frontend Logic:
- [X] T145 [RBAC] Implement role-based service functions in bakery-cms-web/src/services/rbac.service.ts
- [X] T146 [RBAC] Create useRole custom hook in bakery-cms-web/src/hooks/useRole.ts
- [X] T147 [RBAC] Add role-based state management to auth store
- [X] T148 [RBAC] Implement role-based route protection and UI rendering

### Step 8: Create/Update Unit Tests

Backend Tests:
- [ ] T149 [P] [RBAC] Write RBAC middleware tests in bakery-cms-api/packages/api/src/modules/auth/tests/rbac.middleware.test.ts
- [ ] T150 [P] [RBAC] Write permission utility tests in bakery-cms-api/packages/api/src/modules/auth/tests/permissions.utils.test.ts
- [ ] T151 [P] [RBAC] Write role-based service tests in bakery-cms-api/packages/api/src/modules/auth/tests/rbac.service.test.ts
- [ ] T152 [RBAC] Run RBAC integration tests: `npm test -- rbac`

Frontend Tests:
- [ ] T153 [P] [RBAC] Write RoleGate component tests in bakery-cms-web/src/components/core/RoleGate/RoleGate.test.tsx
- [ ] T154 [P] [RBAC] Write ProtectedRoute tests in bakery-cms-web/src/components/shared/ProtectedRoute/ProtectedRoute.test.tsx
- [ ] T155 [P] [RBAC] Write role-based hook tests in bakery-cms-web/src/hooks/useRole.test.ts
- [ ] T156 [RBAC] Run RBAC frontend tests: `npm test -- rbac`

**Checkpoint**: RBAC fully functional - role-based access control working for all endpoints and UI

---

## Phase 5: Security Enhancements (BR-005, BR-006, BR-008)

**Goal**: Implement password security, session security, and account lockout protection  
**Business Rules**: BR-005 (Secure Password Requirements), BR-006 (Session Security), BR-008 (Account Lockout Protection)  
**Independent Test**: Password requirements enforced, secure sessions implemented, account lockout working

### Step 1: Create/Update Code Structure

- [X] T157 [P] [SECURITY] Create security utilities directory in bakery-cms-api/packages/api/src/modules/auth/utils/security.utils.ts
- [X] T158 [P] [SECURITY] Create rate limiting middleware in bakery-cms-api/packages/api/src/middleware/rate-limit.middleware.ts
- [X] T159 [P] [SECURITY] Create security validation components in bakery-cms-web/src/components/shared/PasswordStrength/

### Step 2: Create/Update Data Types

Backend Security Types:
- [X] T160 [P] [SECURITY] Define security policy types in bakery-cms-api/packages/common/src/types/security.types.ts
- [X] T161 [P] [SECURITY] Define rate limiting configuration types
- [X] T162 [P] [SECURITY] Create security validation DTOs

Frontend Security Types:
- [X] T163 [P] [SECURITY] Create password validation component types
- [X] T164 [P] [SECURITY] Define security state management types

### Step 3: Create/Update Data Models

- [X] T165 [P] [SECURITY] Update User model with login attempts and lockout fields
- [X] T166 [P] [SECURITY] Add security audit fields to AuthSession model
- [X] T167 [P] [SECURITY] Create security event logging model (optional)

### Step 4: Create/Update Migration Files

- [X] T168 [SECURITY] Create migration for account lockout fields in bakery-cms-api/packages/database/src/migrations/008-add-security-fields-to-users.ts
- [X] T169 [SECURITY] Add security-related indexes for login attempts tracking
- [X] T170 [SECURITY] Run security migration: `npm run migrate:up`

### Step 5: Create/Update Seed Data

- [X] T171 [P] [SECURITY] Update admin seeder with strong password
- [X] T172 [SECURITY] Verify security seeding requirements

### Step 6: Create/Update Business Functions/Components

Backend Functions:
- [X] T173 [P] [SECURITY] Implement password strength validation in bakery-cms-api/packages/api/src/modules/auth/utils/security.utils.ts
- [X] T174 [P] [SECURITY] Implement account lockout logic in authentication service
- [X] T175 [P] [SECURITY] Implement secure session management with httpOnly cookies
- [X] T176 [P] [SECURITY] Implement CSRF protection middleware

Frontend Components:
- [X] T177 [P] [SECURITY] Create Shared PasswordStrength component in bakery-cms-web/src/components/shared/PasswordStrength/PasswordStrength.tsx
- [X] T178 [SECURITY] Update registration form with password strength indicator
- [X] T179 [SECURITY] Create secure session management in auth store

### Step 7: Create/Update Logic

Backend Logic:
- [X] T180 [SECURITY] Implement rate limiting middleware in bakery-cms-api/packages/api/src/middleware/rate-limit.middleware.ts
- [X] T181 [SECURITY] Apply security middleware to authentication endpoints
- [X] T182 [SECURITY] Implement account lockout in authentication service
- [X] T183 [SECURITY] Add security audit logging to authentication events
- [X] T184 [SECURITY] Implement secure cookie configuration and CSRF protection

Frontend Logic:
- [X] T185 [SECURITY] Implement password validation in registration form
- [X] T186 [SECURITY] Add real-time password strength feedback
- [X] T187 [SECURITY] Implement secure token storage and management
- [X] T188 [SECURITY] Add security notifications for login attempts and lockouts

### Step 8: Create/Update Unit Tests

Backend Tests:
- [ ] T189 [P] [SECURITY] Write password validation tests in bakery-cms-api/packages/api/src/modules/auth/tests/security.utils.test.ts
- [ ] T190 [P] [SECURITY] Write account lockout tests in bakery-cms-api/packages/api/src/modules/auth/tests/lockout.test.ts
- [ ] T191 [P] [SECURITY] Write rate limiting tests in bakery-cms-api/packages/api/src/modules/auth/tests/rate-limit.test.ts
- [ ] T192 [P] [SECURITY] Write secure session tests
- [ ] T193 [SECURITY] Run security integration tests: `npm test -- security`

Frontend Tests:
- [ ] T194 [P] [SECURITY] Write password strength component tests in bakery-cms-web/src/components/shared/PasswordStrength/PasswordStrength.test.tsx
- [ ] T195 [P] [SECURITY] Write password validation tests
- [ ] T196 [P] [SECURITY] Write secure session management tests
- [ ] T197 [SECURITY] Run security frontend tests: `npm test -- security`

**Checkpoint**: Security fully implemented - password requirements, secure sessions, and account lockout protection active

---

## Phase 6: Admin Management (BR-004)

**Goal**: Complete admin user seeding and management functionality  
**Business Rules**: BR-004 (Admin User Seeding)  
**Independent Test**: Admin user created via seeding, can login, and has full system access

### Step 1: Create/Update Code Structure

- [ ] T198 [P] [ADMIN] Create admin management controllers in bakery-cms-api/packages/api/src/modules/auth/controllers/admin.controller.ts
- [ ] T199 [P] [ADMIN] Create admin management components in bakery-cms-web/src/components/features/admin/
- [ ] T200 [P] [ADMIN] Create admin seeding utilities in bakery-cms-api/packages/database/src/utils/seeder.utils.ts

### Step 2: Create/Update Data Types

Backend Admin Types:
- [ ] T201 [P] [ADMIN] Define admin management types in bakery-cms-api/packages/common/src/types/admin.types.ts
- [ ] T202 [P] [ADMIN] Create admin operation DTOs
- [ ] T203 [P] [ADMIN] Define admin service function types

Frontend Admin Types:
- [ ] T204 [P] [ADMIN] Create admin component prop types
- [ ] T205 [P] [ADMIN] Define admin management form types

### Step 3: Create/Update Data Models

- [ ] T206 [P] [ADMIN] Update User model with admin-specific validation
- [ ] T207 [P] [ADMIN] Add admin audit trail fields
- [ ] T208 [P] [ADMIN] Create admin operation tracking (optional)

### Step 4: Create/Update Migration Files

- [ ] T209 [ADMIN] Update admin seeder with environment-based configuration in bakery-cms-api/packages/database/src/seeders/admin-user.seeder.ts
- [ ] T210 [ADMIN] Add admin audit fields migration (if needed)
- [ ] T211 [ADMIN] Run updated admin migration: `npm run seed:up`

### Step 5: Create/Update Seed Data

- [ ] T212 [ADMIN] Complete admin user seeder with environment variables
- [ ] T213 [ADMIN] Add development vs production admin configuration
- [ ] T214 [ADMIN] Verify admin seeding works in different environments
- [ ] T215 [ADMIN] Test admin login with seeded credentials

### Step 6: Create/Update Business Functions/Components

Backend Functions:
- [ ] T216 [P] [ADMIN] Implement admin management service in bakery-cms-api/packages/api/src/modules/auth/services/admin.service.ts
- [ ] T217 [P] [ADMIN] Implement admin user creation and management functions
- [ ] T218 [P] [ADMIN] Add admin-specific validation and authorization

Frontend Components:
- [ ] T219 [P] [ADMIN] Create admin dashboard component in bakery-cms-web/src/components/features/admin/AdminDashboard/AdminDashboard.tsx
- [ ] T220 [P] [ADMIN] Create admin user management component
- [ ] T221 [ADMIN] Update navigation with admin-only sections

### Step 7: Create/Update Logic

Backend Logic:
- [ ] T222 [ADMIN] Implement admin management endpoints in controllers
- [ ] T223 [ADMIN] Add admin-specific route protection
- [ ] T224 [ADMIN] Implement admin operation logging and audit trail
- [ ] T225 [ADMIN] Register admin routes in authentication router

Frontend Logic:
- [ ] T226 [ADMIN] Create admin service functions in bakery-cms-web/src/services/admin.service.ts
- [ ] T227 [ADMIN] Implement admin-specific hooks and state management
- [ ] T228 [ADMIN] Add admin dashboard routing and navigation
- [ ] T229 [ADMIN] Implement admin user management functionality

### Step 8: Create/Update Unit Tests

Backend Tests:
- [ ] T230 [P] [ADMIN] Write admin seeder tests in bakery-cms-api/packages/database/src/seeders/tests/admin-user.seeder.test.ts
- [ ] T231 [P] [ADMIN] Write admin service tests in bakery-cms-api/packages/api/src/modules/auth/tests/admin.service.test.ts
- [ ] T232 [P] [ADMIN] Write admin controller tests
- [ ] T233 [ADMIN] Run admin integration tests: `npm test -- admin`

Frontend Tests:
- [ ] T234 [P] [ADMIN] Write admin dashboard tests in bakery-cms-web/src/components/features/admin/AdminDashboard/AdminDashboard.test.tsx
- [ ] T235 [P] [ADMIN] Write admin management tests
- [ ] T236 [ADMIN] Run admin frontend tests: `npm test -- admin`

**Checkpoint**: Admin management complete - admin seeding, login, and full system access working

---

## Final Phase: Integration & Polish

### Cross-Cutting Improvements

- [ ] T237 [P] Update API documentation in bakery-cms-api/docs/ with authentication endpoints
- [ ] T238 [P] Update README.md files with authentication setup instructions
- [ ] T239 [P] Refactor common authentication patterns across all modules
- [ ] T240 [P] Optimize authentication performance with database query optimization
- [ ] T241 [P] Security audit of all authentication endpoints and flows
- [ ] T242 [P] Code style and linting cleanup across authentication modules
- [ ] T243 Run quickstart.md validation for all authentication scenarios
- [ ] T244 Verify 80% test coverage across all authentication modules
- [ ] T245 Run end-to-end integration testing of complete authentication flow
- [ ] T246 Performance testing of authentication under load
- [ ] T247 Security penetration testing of authentication endpoints
- [ ] T248 Documentation review and finalization

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately
- **Core Authentication (Phase 2)**: Depends on Setup - MVP functionality
- **OAuth Integration (Phase 3)**: Depends on Core Authentication - Independent feature
- **RBAC (Phase 4)**: Depends on Core Authentication - Independent feature after core auth
- **Security (Phase 5)**: Depends on Core Authentication - Can be implemented in parallel with OAuth/RBAC
- **Admin Management (Phase 6)**: Depends on Core Authentication and RBAC - Final feature
- **Integration & Polish (Final)**: Depends on all desired features

### Within Each Feature (The 8 Steps)
1. **Code Structure (Step 1)**: First, creates directories
2. **Data Types (Step 2)**: After structure, can run in parallel [P]
3. **Data Models (Step 3)**: After types defined
4. **Migrations (Step 4)**: After models created
5. **Seed Data (Step 5)**: After migrations run
6. **Business Functions (Step 6)**: After models and types, can run in parallel [P]
7. **Logic (Step 7)**: After business functions
8. **Unit Tests (Step 8)**: After logic, can run in parallel [P]

### Parallel Opportunities
- All [P] tasks in same phase can run simultaneously
- OAuth, RBAC, and Security can be developed in parallel (after Core Authentication)
- Within each feature: Types, some Functions, and some Tests can run in parallel
- Different developers can work on different features after Phase 2 completion

---

## Implementation Strategy

### MVP First (Recommended)
1. Complete Phase 1: Setup ✓
2. Complete Phase 2: Core Authentication ✓ (Email/password auth with 365-day tokens)
3. **STOP and VALIDATE**: Test core authentication independently
4. Demo/Deploy MVP if ready (basic auth functionality working)

### Incremental Delivery
1. Setup + Core Authentication → Basic authentication working
2. Add OAuth Integration → Multi-provider authentication working
3. Add RBAC → Role-based access control working
4. Add Security → Enterprise-grade security implemented
5. Add Admin Management → Full admin functionality
6. Each feature adds value without breaking previous functionality

### Parallel Team Strategy
With multiple developers after Phase 2:
- Developer A: OAuth Integration (Phase 3)
- Developer B: RBAC Implementation (Phase 4) 
- Developer C: Security Enhancements (Phase 5)
- All integrate with core authentication independently

### Business Rule Alignment
- **BR-001, BR-002**: Phases 2 & 3 (Multi-auth + 365-day tokens)
- **BR-003**: Phase 4 (RBAC implementation)
- **BR-004**: Phase 6 (Admin seeding)
- **BR-005, BR-006, BR-008**: Phase 5 (Security enhancements)
- **BR-007**: Phase 3 (OAuth PKCE security)

---

## Success Criteria

Authentication implementation is complete when:
- [ ] All 8 business rules (BR-001 through BR-008) are implemented and tested
- [ ] Users can register and login via email/password and OAuth (Google/Facebook)
- [ ] JWT tokens have 365-day expiration with refresh mechanism
- [ ] Role-based access control is working for all user types
- [ ] Admin user can be seeded and login successfully
- [ ] Password requirements, secure sessions, and account lockout are functional
- [ ] OAuth PKCE security is implemented and validated
- [ ] 80% test coverage achieved across all authentication modules
- [ ] All API endpoints from contracts/ are implemented and working
- [ ] Frontend components follow constitutional architecture (Core/Shared/Detail)
- [ ] Security audit passes with no critical vulnerabilities
- [ ] Performance goals met (<200ms API response, <2s login time)