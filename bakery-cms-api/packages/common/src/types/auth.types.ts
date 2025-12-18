/**
 * Authentication Types
 * Type definitions for authentication system
 */

// User and Authentication Enums
export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
  VIEWER = 'viewer',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

// Core Domain Types
export type User = {
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

export type AuthSession = {
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

// Data Transfer Objects
export type CreateUserData = {
  readonly email: string;
  readonly passwordHash?: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly provider: AuthProvider;
  readonly providerId?: string;
  readonly emailVerifiedAt?: Date;
};

export type UpdateUserData = {
  readonly email?: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly emailVerifiedAt?: Date;
  readonly lastLoginAt?: Date;
  readonly loginAttempts?: number;
  readonly lockedUntil?: Date;
};

export type CreateAuthSessionData = {
  readonly userId: string;
  readonly refreshToken: string;
  readonly deviceInfo?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly expiresAt: Date;
  readonly isActive?: boolean;
};

// Request DTOs
export type LoginDTO = {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
};

export type RegisterUserDTO = {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role?: UserRole;
};

export type ChangePasswordDTO = {
  readonly currentPassword: string;
  readonly newPassword: string;
};

export type ForgotPasswordDTO = {
  readonly email: string;
};

export type ResetPasswordDTO = {
  readonly token: string;
  readonly newPassword: string;
};

export type RefreshTokenDTO = {
  readonly refreshToken: string;
};

export type UpdateUserDTO = {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
};

// OAuth DTOs
export type OAuthCallbackDTO = {
  readonly code: string;
  readonly state: string;
  readonly codeVerifier: string;
  readonly provider: AuthProvider;
};

export type OAuthUrlRequestDTO = {
  readonly provider: AuthProvider;
  readonly redirectUri: string;
};

// Response DTOs
export type UserResponseDTO = {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly providerId?: string;
  readonly emailVerifiedAt?: string;
  readonly lastLoginAt?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type AuthResponseDTO = {
  readonly user: UserResponseDTO;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: string;
};

export type TokenResponseDTO = {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly tokenType: string;
};

export type OAuthUrlResponseDTO = {
  readonly authUrl: string;
  readonly state: string;
  readonly codeVerifier: string;
};

// Import Result type from neverthrow and AppError
import { Result } from 'neverthrow';
import { AppError } from './error.types';

// Service Function Types
export type AuthService = {
  readonly login: (data: LoginDTO, deviceInfo?: DeviceInfo) => Promise<Result<AuthResponseDTO, AppError>>;
  readonly register: (data: RegisterUserDTO, deviceInfo?: DeviceInfo) => Promise<Result<AuthResponseDTO, AppError>>;
  readonly logout: (refreshToken: string) => Promise<Result<void, AppError>>;
  readonly refreshToken: (refreshToken: string, deviceInfo?: DeviceInfo) => Promise<Result<TokenResponseDTO, AppError>>;
  readonly changePassword: (userId: string, data: ChangePasswordDTO) => Promise<Result<void, AppError>>;
  readonly forgotPassword: (data: ForgotPasswordDTO) => Promise<Result<void, AppError>>;
  readonly resetPassword: (data: ResetPasswordDTO) => Promise<Result<void, AppError>>;
  readonly verifyEmail: (token: string) => Promise<Result<void, AppError>>;
};

export type OAuthService = {
  readonly getAuthUrl: (data: OAuthUrlRequestDTO) => Promise<Result<OAuthUrlResponseDTO, AppError>>;
  readonly handleCallback: (data: OAuthCallbackDTO, deviceInfo?: DeviceInfo) => Promise<Result<AuthResponseDTO, AppError>>;
  readonly verifyState: (state: string, storedState: string) => boolean;
  readonly generatePKCEChallenge: () => Promise<Result<{ codeVerifier: string; codeChallenge: string }, AppError>>;
};

export type UserService = {
  readonly getById: (id: string) => Promise<Result<UserResponseDTO, AppError>>;
  readonly updateProfile: (id: string, data: UpdateUserDTO) => Promise<Result<UserResponseDTO, AppError>>;
  readonly delete: (id: string) => Promise<Result<void, AppError>>;
  readonly getCurrentUser: (id: string) => Promise<Result<UserResponseDTO, AppError>>;
};

// Repository Function Types
export type UserRepository = {
  readonly findById: (id: string) => Promise<User | null>;
  readonly findByEmail: (email: string) => Promise<User | null>;
  readonly findByProvider: (provider: AuthProvider, providerId: string) => Promise<User | null>;
  readonly create: (data: CreateUserData) => Promise<User>;
  readonly update: (id: string, data: Partial<UpdateUserData>) => Promise<User>;
  readonly incrementLoginAttempts: (id: string) => Promise<User>;
  readonly resetLoginAttempts: (id: string) => Promise<User>;
  readonly lockAccount: (id: string, until: Date) => Promise<User>;
  readonly softDelete: (id: string) => Promise<void>;
  readonly findByIds: (ids: string[]) => Promise<User[]>;
  readonly findAll: (filters?: UserFilters) => Promise<User[]>;
};

export type AuthSessionRepository = {
  readonly findByRefreshToken: (token: string) => Promise<AuthSession | null>;
  readonly findActiveByUser: (userId: string) => Promise<AuthSession[]>;
  readonly create: (data: CreateAuthSessionData) => Promise<AuthSession>;
  readonly deactivate: (id: string) => Promise<AuthSession>;
  readonly deleteExpired: () => Promise<number>;
  readonly deactivateAllByUser: (userId: string) => Promise<number>;
  readonly findById: (id: string) => Promise<AuthSession | null>;
  readonly cleanup: () => Promise<number>;
};

// Utility Types
export type DeviceInfo = {
  readonly userAgent?: string;
  readonly ipAddress?: string;
  readonly deviceType?: string;
  readonly browser?: string;
  readonly os?: string;
};

export type JWTPayload = {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly provider: AuthProvider;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
};

export type RefreshJWTPayload = {
  readonly sub: string;
  readonly tokenId: string;
  readonly iat: number;
  readonly exp: number;
  readonly iss: string;
  readonly aud: string;
};

export type UserFilters = {
  readonly role?: UserRole;
  readonly status?: UserStatus;
  readonly provider?: AuthProvider;
  readonly search?: string;
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
};

export type AuthContext = {
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly permissions: string[];
};

export type PasswordValidation = {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly strength: 'weak' | 'medium' | 'strong';
};

export type LoginAttempt = {
  readonly email: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly success: boolean;
  readonly timestamp: Date;
  readonly failureReason?: string;
};

// Permission Types
export type Permission = {
  readonly resource: string;
  readonly action: string;
  readonly conditions?: Record<string, unknown>;
};

export type RolePermissions = {
  readonly [UserRole.ADMIN]: Permission[];
  readonly [UserRole.SELLER]: Permission[];
  readonly [UserRole.CUSTOMER]: Permission[];
  readonly [UserRole.VIEWER]: Permission[];
};

// OAuth Provider Types
export type GoogleUserProfile = {
  readonly id: string;
  readonly email: string;
  readonly given_name: string;
  readonly family_name: string;
  readonly picture?: string;
  readonly email_verified: boolean;
};

export type FacebookUserProfile = {
  readonly id: string;
  readonly email: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly picture?: {
    readonly data: {
      readonly url: string;
    };
  };
};

export type OAuthUserProfile = GoogleUserProfile | FacebookUserProfile;

// Type Guards
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

export function isValidUserStatus(status: string): status is UserStatus {
  return Object.values(UserStatus).includes(status as UserStatus);
}

export function isValidAuthProvider(provider: string): provider is AuthProvider {
  return Object.values(AuthProvider).includes(provider as AuthProvider);
}

export function isValidTokenType(type: string): type is TokenType {
  return Object.values(TokenType).includes(type as TokenType);
}