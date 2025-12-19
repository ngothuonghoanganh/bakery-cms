# OAuth Integration Guide

This document explains how to use the OAuth integration (Google & Facebook) in the Bakery CMS application.

## Overview

The OAuth integration implements OAuth 2.0 with PKCE (Proof Key for Code Exchange) for enhanced security. It supports:

- **Google OAuth 2.0**
- **Facebook Login**
- PKCE security flow (BR-007)
- Client-side and server-side token exchange
- Automatic user creation/linking

## Architecture

```
Frontend (React)          Backend (Node.js)         OAuth Provider
     |                          |                         |
     |--1. Get Auth URL-------->|                         |
     |<--2. Return URL---------|                         |
     |                          |                         |
     |--3. Redirect User--------------------------------->|
     |                          |                         |
     |<--4. Callback with code----------------------------|
     |                          |                         |
     |--5. Exchange Code------->|                         |
     |                          |--6. Verify & Get Tokens->|
     |                          |<-7. User Profile--------|
     |<--8. JWT Tokens---------|                         |
```

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Backend (bakery-cms-api)
BASE_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_CLIENT_ID=your_facebook_client_id
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret
OAUTH_ALLOWED_REDIRECT_DOMAINS=localhost,yourdomain.com

# Frontend (bakery-cms-web)
VITE_API_URL=http://localhost:3001/api
```

### 2. OAuth Provider Configuration

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/oauth/google/callback`
   - `https://yourdomain.com/api/auth/oauth/google/callback`

#### Facebook Login Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URIs:
   - `http://localhost:3001/api/auth/oauth/facebook/callback`
   - `https://yourdomain.com/api/auth/oauth/facebook/callback`

## Usage

### Frontend Implementation

#### 1. Using OAuth Button Component

```tsx
import { OAuthButton } from '@/components/shared/OAuthButton/OAuthButton';
import { OAuthProvider } from '@/types/api/oauth.api';
import { useOAuth } from '@/hooks/useOAuth';

function LoginPage() {
  const { loginWithOAuth, isLoading } = useOAuth();

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    await loginWithOAuth(provider, false); // false = redirect, true = popup
  };

  return (
    <div>
      <OAuthButton
        provider={OAuthProvider.GOOGLE}
        onClick={handleOAuthLogin}
        loading={isLoading}
        block
      />
      <OAuthButton
        provider={OAuthProvider.FACEBOOK}
        onClick={handleOAuthLogin}
        loading={isLoading}
        block
      />
    </div>
  );
}
```

#### 2. OAuth Callback Route

Add the OAuth callback route to your router:

```tsx
import { OAuthCallback } from '@/pages/OAuthCallback/OAuthCallback';

<Route path="/auth/oauth/callback" element={<OAuthCallback />} />
```

The callback is automatically handled by the `useOAuth` hook.

### Backend API Endpoints

#### Get Authorization URL

```
GET /api/auth/oauth/:provider/authorize?redirect_uri={uri}
```

Response:
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
    "state": "a1b2c3d4..."
  }
}
```

#### Handle Callback

```
GET /api/auth/oauth/:provider/callback?code={code}&state={state}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "provider": "google"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "tokenType": "Bearer",
      "expiresIn": 31536000
    },
    "isNewUser": true
  }
}
```

#### Direct Code Exchange (for client-side flows)

```
POST /api/auth/oauth/:provider/exchange
Content-Type: application/json

{
  "code": "authorization_code",
  "codeVerifier": "pkce_verifier",
  "redirectUri": "http://localhost:3000/auth/callback"
}
```

## Security Features

1. **PKCE Flow**: Implements Proof Key for Code Exchange (RFC 7636)
2. **State Parameter**: CSRF protection with 10-minute expiration
3. **Secure Token Storage**: JWT tokens stored securely
4. **Domain Whitelist**: Redirect URI domain validation
5. **Session Cleanup**: Automatic cleanup of expired OAuth states

## User Flow

### New User

1. User clicks "Continue with Google/Facebook"
2. Redirected to OAuth provider
3. User authorizes the application
4. Backend receives authorization code
5. Backend exchanges code for tokens
6. Backend fetches user profile
7. **New user account created** with OAuth profile data
8. JWT tokens issued
9. User redirected to dashboard

### Existing User

1. Same steps 1-6 as new user
2. **Existing account found** by email or provider ID
3. OAuth provider linked/updated
4. JWT tokens issued
5. User redirected to dashboard

## Testing

### Development Test Users

Run the seeder to create OAuth test users:

```bash
cd bakery-cms-api/packages/database
npm run seed
```

This creates:
- `google.test@example.com` (Google OAuth)
- `facebook.test@example.com` (Facebook OAuth)

### Manual Testing

1. Start backend: `cd bakery-cms-api && npm run dev`
2. Start frontend: `cd bakery-cms-web && npm run dev`
3. Navigate to login page
4. Click OAuth button
5. Complete OAuth flow
6. Verify JWT token and user data

## Troubleshooting

### Common Issues

**"OAuth state has expired"**
- The OAuth flow took longer than 10 minutes
- Clear browser cache and try again

**"Redirect URI domain not allowed"**
- Add your domain to `OAUTH_ALLOWED_REDIRECT_DOMAINS`
- Check redirect URI matches exactly

**"Failed to fetch user profile"**
- Check OAuth provider credentials
- Verify API scopes are correct

**"Failed to create user"**
- Check database connection
- Verify required fields in OAuth profile

### Debug Mode

Enable debug logging:

```typescript
// In oauth.service.ts
console.log('OAuth State:', state);
console.log('OAuth Response:', response);
```

## Best Practices

1. **Use HTTPS in production** - OAuth requires secure connections
2. **Validate redirect URIs** - Only allow whitelisted domains
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Test both flows** - New user creation and existing user login
5. **Monitor OAuth usage** - Track successful/failed attempts
6. **Keep secrets secure** - Never expose client secrets in frontend

## References

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
