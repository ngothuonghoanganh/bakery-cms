/**
 * OAuth Data Transfer Objects
 * DTOs for OAuth authentication requests and responses
 */

import { OAuthProvider } from '@bakery-cms/common';

/**
 * OAuth authorization URL request DTO
 */
export interface OAuthAuthorizationRequestDto {
  provider: OAuthProvider;
  redirectUri?: string;
}

/**
 * OAuth authorization URL response DTO
 */
export interface OAuthAuthorizationResponseDto {
  authorizationUrl: string;
  state: string;
}

/**
 * OAuth callback request DTO
 */
export interface OAuthCallbackRequestDto {
  code: string;
  state: string;
  error?: string;
  error_description?: string;
}

/**
 * OAuth login response DTO
 * Returned after successful OAuth authentication
 */
export interface OAuthLoginResponseDto {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    provider: string;
    emailVerified: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
  isNewUser: boolean;
}

/**
 * OAuth link provider request DTO
 */
export interface OAuthLinkProviderRequestDto {
  provider: OAuthProvider;
  code: string;
  state: string;
}

/**
 * OAuth unlink provider request DTO
 */
export interface OAuthUnlinkProviderRequestDto {
  provider: OAuthProvider;
}

/**
 * OAuth linked providers response DTO
 */
export interface OAuthLinkedProvidersResponseDto {
  providers: Array<{
    provider: OAuthProvider;
    providerId: string;
    email: string;
    linkedAt: Date;
  }>;
}

/**
 * OAuth provider status DTO
 */
export interface OAuthProviderStatusDto {
  provider: OAuthProvider;
  enabled: boolean;
  configured: boolean;
}

/**
 * OAuth available providers response DTO
 */
export interface OAuthAvailableProvidersResponseDto {
  providers: OAuthProviderStatusDto[];
}
