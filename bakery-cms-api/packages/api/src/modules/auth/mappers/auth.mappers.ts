/**
 * Authentication mappers
 * Transform between Sequelize models and DTOs
 */

import { UserModel } from '@bakery-cms/database/src/models/user.model';
import { UserRole, UserStatus, AuthProvider } from '@bakery-cms/common';
import {
  UserResponseDto,
  LoginResponseDto,
  TokenPairDto,
  RegisterRequestDto,
} from '../dto/auth.dto';
import { CreateUserAttributes } from '../repositories/user.repository';

/**
 * Map UserModel to UserResponseDto
 * Pure function that transforms database entity to API response
 */
export const toUserResponseDto = (model: UserModel): UserResponseDto => {
  return {
    id: model.id,
    email: model.email,
    firstName: model.firstName,
    lastName: model.lastName,
    fullName: `${model.firstName} ${model.lastName}`.trim(),
    role: model.role as UserRole,
    status: model.status as UserStatus,
    provider: model.provider as AuthProvider,
    emailVerifiedAt: model.emailVerifiedAt?.toISOString() || null,
    lastLoginAt: model.lastLoginAt?.toISOString() || null,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString(),
  };
};

/**
 * Map authentication result to LoginResponseDto
 * Pure function that creates authentication response
 */
export const toAuthResponseDto = (
  user: UserModel,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): LoginResponseDto => {
  return {
    user: toUserResponseDto(user),
    tokens: {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer',
    },
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  };
};

/**
 * Map tokens to TokenPairDto
 * Pure function for token pair response
 */
export const toTokenPairDto = (
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): TokenPairDto => {
  return {
    accessToken,
    refreshToken,
    expiresIn,
    tokenType: 'Bearer',
  };
};

/**
 * Map RegisterRequestDto to CreateUserAttributes
 * Pure function that prepares data for user creation
 */
export const toCreateUserAttributes = (
  dto: RegisterRequestDto,
  passwordHash?: string
): CreateUserAttributes => {
  return {
    email: dto.email.toLowerCase(),
    passwordHash,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: UserRole.CUSTOMER, // Default role for registration
    status: UserStatus.PENDING_VERIFICATION,
    provider: AuthProvider.LOCAL,
    providerId: undefined,
    emailVerifiedAt: undefined,
  };
};

/**
 * Map OAuth user data to CreateUserAttributes
 * Pure function for OAuth user creation
 */
export const toOAuthUserAttributes = (
  email: string,
  firstName: string,
  lastName: string,
  provider: AuthProvider,
  providerId: string,
  role: UserRole = UserRole.CUSTOMER
): CreateUserAttributes => {
  return {
    email: email.toLowerCase(),
    passwordHash: undefined,
    firstName,
    lastName,
    role,
    status: UserStatus.ACTIVE, // OAuth users are immediately active
    provider,
    providerId,
    emailVerifiedAt: new Date(), // OAuth users have verified emails
  };
};

/**
 * Map array of UserModel to array of UserResponseDto
 * Pure function for batch transformation
 */
export const toUserResponseDtoList = (models: UserModel[]): UserResponseDto[] => {
  return models.map(toUserResponseDto);
};