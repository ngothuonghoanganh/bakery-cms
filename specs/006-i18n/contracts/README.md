# API Contracts: i18n Feature

**Status**: Minimal - Frontend-focused feature

## Overview

The i18n feature is primarily frontend-based. API contracts are minimal and optional.

## Current Implementation (Phase 1)

No API endpoints required. Language preference stored in:
- **localStorage**: `bakery-cms-language`

## Future Enhancement (Phase 2+)

### User Preference Sync

When authenticated user preference sync is implemented (FR-005):

#### GET /api/v1/users/me/preferences

Returns user preferences including language.

**Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "language": "vi",
    "timezone": "Asia/Ho_Chi_Minh"
  }
}
```

#### PATCH /api/v1/users/me/preferences

Updates user preferences.

**Request**:
```json
{
  "language": "en"
}
```

**Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "language": "en",
    "updatedAt": "2025-12-26T10:00:00.000Z"
  }
}
```

**Validation**:
- `language`: Must be `"vi"` or `"en"`

**Errors**:
- 400 Bad Request: Invalid language value
- 401 Unauthorized: Not authenticated

## TypeScript Types

```typescript
// Request/Response types for future API integration
type UserPreferences = {
  language: 'vi' | 'en';
  timezone?: string;
};

type UpdatePreferencesRequest = Partial<UserPreferences>;

type UpdatePreferencesResponse = {
  status: 'success';
  data: UserPreferences & {
    updatedAt: string;
  };
};
```
