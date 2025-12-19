# Data Model: Authentication and Authorization

## Backend Data Models

### Entity: User

**Description**: Core user entity supporting both OAuth and traditional authentication with role-based access control

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | UUID format | auto-generated |
| email | string | Yes | Valid email, unique | - |
| passwordHash | string | No | bcrypt hash (for local auth) | null |
| firstName | string | Yes | 1-100 chars | - |
| lastName | string | Yes | 1-100 chars | - |
| role | enum | Yes | UserRole enum values | CUSTOMER |
| status | enum | Yes | UserStatus enum values | PENDING_VERIFICATION |
| provider | enum | Yes | AuthProvider enum values | LOCAL |
| providerId | string | No | Provider-specific user ID | null |
| emailVerifiedAt | Date | No | ISO DateTime | null |
| lastLoginAt | Date | No | ISO DateTime | null |
| loginAttempts | number | Yes | 0-100 | 0 |
| lockedUntil | Date | No | ISO DateTime | null |
| createdAt | Date | Yes | ISO DateTime | current timestamp |
| updatedAt | Date | Yes | ISO DateTime | current timestamp |
| deletedAt | Date | No | ISO DateTime (soft delete) | null |

**Relationships**:
- hasMany: AuthSession (userId)

**Validation Rules**:
- email must be unique across all non-deleted users
- passwordHash required only when provider = LOCAL
- provider + providerId combination must be unique for OAuth users
- firstName and lastName cannot be empty strings
- loginAttempts resets to 0 on successful login
- lockedUntil must be future date or null

**State Transitions**:
- PENDING_VERIFICATION → ACTIVE (on email verification)
- ACTIVE → SUSPENDED (on admin action)
- SUSPENDED → ACTIVE (on admin action)
- any → INACTIVE (on user request)

**Sequelize Model Location**: `packages/database/src/models/user.model.ts`

**TypeScript Type Location**: `packages/common/src/types/user.types.ts`

### Entity: AuthSession

**Description**: User authentication sessions with refresh token management and device tracking

**Fields**:
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| id | string (UUID) | Yes | UUID format | auto-generated |
| userId | string (UUID) | Yes | Valid User.id FK | - |
| refreshToken | string | Yes | 1-1000 chars, unique | - |
| deviceInfo | text | No | JSON string | null |
| ipAddress | string | No | IPv4/IPv6 format | null |
| userAgent | string | No | 1-500 chars | null |
| expiresAt | Date | Yes | Future ISO DateTime | 730 days from creation |
| isActive | boolean | Yes | true/false | true |
| createdAt | Date | Yes | ISO DateTime | current timestamp |
| updatedAt | Date | Yes | ISO DateTime | current timestamp |

**Relationships**:
- belongsTo: User (userId)

**Validation Rules**:
- refreshToken must be unique across all active sessions
- expiresAt must be future date
- userId must reference existing User
- ipAddress must be valid IPv4 or IPv6 format
- deviceInfo must be valid JSON if provided

**State Transitions**:
- isActive: true → false (on logout or token refresh)
- expiresAt: extended on token refresh

**Sequelize Model Location**: `packages/database/src/models/auth-session.model.ts`

**TypeScript Type Location**: `packages/common/src/types/auth.types.ts`

## Backend Type Definitions

### Domain Types (`packages/common/src/types/user.types.ts`)
```typescript
type User = {
  readonly id: string;
  readonly email: string;
  readonly passwordHash?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly providerId?: string;
  readonly emailVerifiedAt?: Date;
  readonly lastLoginAt?: Date;
  readonly loginAttempts: number;
  readonly lockedUntil?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly deletedAt?: Date;
};

type AuthSession = {
  readonly id: string;
  readonly userId: string;
  readonly refreshToken: string;
  readonly deviceInfo?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly expiresAt: Date;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
```

### Service Function Types
```typescript
type AuthService = {
  readonly login: (data: LoginDTO) => Promise<Result<AuthResponseDTO>>;
  readonly register: (data: RegisterUserDTO) => Promise<Result<AuthResponseDTO>>;
  readonly logout: (refreshToken: string) => Promise<Result<void>>;
  readonly refreshToken: (refreshToken: string) => Promise<Result<TokenResponseDTO>>;
  readonly changePassword: (userId: string, data: ChangePasswordDTO) => Promise<Result<void>>;
};

type OAuthService = {
  readonly getAuthUrl: (provider: AuthProvider, redirectUri: string) => Promise<Result<OAuthUrlResponseDTO>>;
  readonly handleCallback: (data: OAuthCallbackDTO) => Promise<Result<AuthResponseDTO>>;
  readonly verifyState: (state: string, storedState: string) => boolean;
};

type UserService = {
  readonly getById: (id: string) => Promise<Result<UserResponseDTO>>;
  readonly updateProfile: (id: string, data: UpdateUserDTO) => Promise<Result<UserResponseDTO>>;
  readonly delete: (id: string) => Promise<Result<void>>;
  readonly verifyEmail: (token: string) => Promise<Result<void>>;
};
```

### Repository Function Types
```typescript
type UserRepository = {
  readonly findById: (id: string) => Promise<User | null>;
  readonly findByEmail: (email: string) => Promise<User | null>;
  readonly findByProvider: (provider: AuthProvider, providerId: string) => Promise<User | null>;
  readonly create: (data: CreateUserData) => Promise<User>;
  readonly update: (id: string, data: Partial<UpdateUserData>) => Promise<User>;
  readonly incrementLoginAttempts: (id: string) => Promise<User>;
  readonly resetLoginAttempts: (id: string) => Promise<User>;
  readonly lockAccount: (id: string, until: Date) => Promise<User>;
  readonly softDelete: (id: string) => Promise<void>;
};

type AuthSessionRepository = {
  readonly findByRefreshToken: (token: string) => Promise<AuthSession | null>;
  readonly findActiveByUser: (userId: string) => Promise<AuthSession[]>;
  readonly create: (data: CreateAuthSessionData) => Promise<AuthSession>;
  readonly deactivate: (id: string) => Promise<AuthSession>;
  readonly deleteExpired: () => Promise<number>;
  readonly deactivateAllByUser: (userId: string) => Promise<number>;
};
```

## Frontend Data Models

### API Response Types (`src/types/api/`)

#### User API Response (`src/types/api/user.api.ts`)
```typescript
type UserAPIResponse = {
  readonly id: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly role: string;
  readonly status: string;
  readonly provider: string;
  readonly provider_id?: string;
  readonly email_verified_at?: string;
  readonly last_login_at?: string;
  readonly created_at: string;
  readonly updated_at: string;
};

type AuthAPIResponse = {
  readonly user: UserAPIResponse;
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_in: number;
  readonly token_type: string;
};

type TokenAPIResponse = {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: string;
};
```

#### OAuth API Response (`src/types/api/oauth.api.ts`)
```typescript
type OAuthUrlAPIResponse = {
  readonly auth_url: string;
  readonly state: string;
  readonly code_verifier: string;
};

type OAuthCallbackAPIResponse = {
  readonly user: UserAPIResponse;
  readonly access_token: string;
  readonly refresh_token: string;
  readonly expires_in: number;
  readonly is_new_user: boolean;
};
```

### Domain Model Types (`src/types/models/`)

#### User Domain Model (`src/types/models/user.model.ts`)
```typescript
type User = {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly providerId?: string;
  readonly emailVerifiedAt?: Date;
  readonly lastLoginAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly fullName: string; // computed property
  readonly isEmailVerified: boolean; // computed property
};

type AuthState = {
  readonly user: User | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly expiresAt: Date | null;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly error: string | null;
};

type OAuthUrlData = {
  readonly authUrl: string;
  readonly state: string;
  readonly codeVerifier: string;
};
```

### Mappers (`src/types/mappers/`)

#### User Mapper (`src/types/mappers/user.mapper.ts`)
```typescript
export const mapUserFromAPI = (response: UserAPIResponse): User => ({
  id: response.id,
  email: response.email,
  firstName: response.first_name,
  lastName: response.last_name,
  role: response.role as UserRole,
  status: response.status as UserStatus,
  provider: response.provider as AuthProvider,
  providerId: response.provider_id,
  emailVerifiedAt: response.email_verified_at ? new Date(response.email_verified_at) : undefined,
  lastLoginAt: response.last_login_at ? new Date(response.last_login_at) : undefined,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
  fullName: `${response.first_name} ${response.last_name}`,
  isEmailVerified: !!response.email_verified_at,
});

export const mapAuthFromAPI = (response: AuthAPIResponse): AuthState => ({
  user: mapUserFromAPI(response.user),
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresAt: new Date(Date.now() + (response.expires_in * 1000)),
  isAuthenticated: true,
  isLoading: false,
  error: null,
});
```

#### OAuth Mapper (`src/types/mappers/oauth.mapper.ts`)
```typescript
export const mapOAuthUrlFromAPI = (response: OAuthUrlAPIResponse): OAuthUrlData => ({
  authUrl: response.auth_url,
  state: response.state,
  codeVerifier: response.code_verifier,
});

export const mapOAuthCallbackFromAPI = (response: OAuthCallbackAPIResponse): AuthState & { isNewUser: boolean } => ({
  user: mapUserFromAPI(response.user),
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresAt: new Date(Date.now() + (response.expires_in * 1000)),
  isAuthenticated: true,
  isLoading: false,
  error: null,
  isNewUser: response.is_new_user,
});
```

## Database Indexes

### User Table Indexes
- `users.email` - Unique index for email lookups
- `users.provider_provider_id` - Composite unique index for OAuth lookups
- `users.role_status` - Composite index for access control queries
- `users.created_at` - Index for user registration analytics
- `users.deleted_at` - Index for soft delete filtering

### AuthSession Table Indexes
- `auth_sessions.refresh_token` - Unique index for token validation
- `auth_sessions.user_id_is_active` - Composite index for active user sessions
- `auth_sessions.expires_at` - Index for cleanup operations
- `auth_sessions.created_at` - Index for session analytics

## Database Constraints

### User Table Constraints
- `email` - Unique constraint on non-deleted users only
- `provider_provider_id` - Unique constraint for OAuth users
- `password_hash` - Required when provider = 'local'
- `login_attempts` - Check constraint: >= 0 AND <= 100
- `locked_until` - Check constraint: must be future date or NULL

### AuthSession Table Constraints
- `refresh_token` - Unique constraint across all sessions
- `user_id` - Foreign key constraint to users.id with CASCADE delete
- `expires_at` - Check constraint: must be future date
- `ip_address` - Check constraint: valid IPv4/IPv6 format

## Enums and Constants

### Backend Enums (`packages/common/src/enums/`)
```typescript
// user-role.enums.ts
enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
  VIEWER = 'viewer'
}

// user-status.enums.ts
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// auth-provider.enums.ts
enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}

// token-type.enums.ts
enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset'
}
```

### Frontend Enums (Re-exported from backend types)
```typescript
// Use the same enums via API response mapping
type UserRole = 'admin' | 'seller' | 'customer' | 'viewer';
type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
type AuthProvider = 'local' | 'google' | 'facebook';
```

## Migration Dependencies

### Migration Order
1. **004-create-users-table.ts** - Creates users table with all fields and constraints
2. **005-create-auth-sessions-table.ts** - Creates auth_sessions table with foreign key to users

### Rollback Strategy
- AuthSessions table can be dropped safely (no dependent tables)
- Users table requires checking for dependent data in other features before rollback
- Seed data (admin user) should be backed up before any rollback operations