# Frontend Authentication Integration Guide

## Overview

This guide explains how to integrate the React frontend with the backend authentication API. All authentication functionality is now fully integrated and ready to use.

## Architecture

### State Management
- **Zustand Store**: `authStore.ts` manages authentication state
- **Persistence**: State persisted to `localStorage` under key `bakery-cms-auth`
- **Auto-refresh**: API client automatically refreshes expired tokens

### API Client
- **Base URL**: Configured via `VITE_API_BASE_URL` environment variable
- **Token Injection**: Automatic Bearer token injection in request headers
- **Error Handling**: Centralized error handling with automatic retry for 401 errors
- **Token Refresh**: Automatic token refresh on 401 responses

## Files Created/Updated

### 1. Authentication Service (`src/services/auth.service.ts`)
Core authentication API calls:

```typescript
// Registration
await authService.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe'
});

// Login
await authService.login({
  email: 'user@example.com',
  password: 'SecurePass123!'
});

// Logout (current session)
await authService.logout(refreshToken);

// Logout all sessions/devices
await authService.logoutAll();

// Change password
await authService.changePassword({
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass123!'
});

// Forgot password
await authService.forgotPassword({
  email: 'user@example.com'
});

// Reset password
await authService.resetPassword({
  token: 'reset-token-from-email',
  newPassword: 'NewPass123!'
});

// Verify email
await authService.verifyEmail('verification-token');

// Get current user profile
const user = await authService.getCurrentUser();

// Client-side password validation
const validation = authService.validatePassword('MyPass123!');
// Returns: { isValid, strength, errors, score }
```

**Role Helpers:**
```typescript
import { UserRole, hasRole, isAdmin, isStaff, isSeller } from '@/services/auth.service';

// Check specific roles
if (hasRole(user, [UserRole.ADMIN, UserRole.MANAGER])) {
  // User is admin or manager
}

// Convenience helpers
if (isAdmin(user)) { /* Admin only */ }
if (isStaff(user)) { /* Admin, Manager, or Staff */ }
if (isSeller(user)) { /* Admin, Manager, or Seller */ }
```

### 2. Updated Auth Store (`src/stores/authStore.ts`)
Zustand store with full API integration:

```typescript
import { useAuthStore } from '@/stores/authStore';

// In a React component
function LoginPage() {
  const { login, isLoading, isAuthenticated, user } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login({ 
        email: 'user@example.com', 
        password: 'SecurePass123!' 
      });
      // User is now logged in, navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      // Handle error (already shown via notification)
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isLoading && <Spinner />}
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

**Store Methods:**
```typescript
const {
  // State
  user,                    // Current user or null
  token,                   // Access token
  refreshToken,            // Refresh token
  isAuthenticated,         // Boolean authentication status
  isLoading,              // Loading state for async operations

  // Actions
  login,                  // Login with email/password
  register,               // Register new user
  logout,                 // Logout current session
  logoutAll,              // Logout all sessions/devices
  setUser,                // Manually set user and tokens
  refreshAuth,            // Refresh access token
  changePassword,         // Change user password
  fetchCurrentUser,       // Fetch current user profile
  clearAuth,              // Clear authentication state
} = useAuthStore();
```

### 3. Updated API Client (`src/services/api/client.ts`)

**Fixed Issues:**
- ✅ Token injection now uses `authState.token` instead of `authState.user.id`
- ✅ Automatic token refresh on 401 errors
- ✅ Retry original request after token refresh
- ✅ Automatic logout if refresh fails

**How it works:**
1. Every API request includes `Authorization: Bearer <token>` header
2. If server returns 401, client attempts to refresh token
3. If refresh succeeds, original request is retried with new token
4. If refresh fails, user is logged out and redirected to login

### 4. Route Guards

#### Protected Route (`src/components/auth/ProtectedRoute.tsx`)
Wraps routes that require authentication:

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

#### Role-Based Route (`src/components/auth/RoleRoute.tsx`)
Wraps routes that require specific roles:

```typescript
import { RoleRoute } from '@/components/auth/RoleRoute';
import { UserRole } from '@/services/auth.service';

// Admin only
<Route path="/admin" element={
  <RoleRoute allowedRoles={[UserRole.ADMIN]}>
    <AdminPanel />
  </RoleRoute>
} />

// Admin or Manager
<Route path="/management" element={
  <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
    <ManagementPanel />
  </RoleRoute>
} />

// Staff and above
<Route path="/reports" element={
  <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]}>
    <Reports />
  </RoleRoute>
} />
```

## Usage Examples

### 1. Login Page Component

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Form, Input, Button, Alert } from 'antd';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setError(null);
      await login(values);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  };

  return (
    <Form onFinish={handleSubmit}>
      {error && <Alert type="error" message={error} />}
      
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Email" />
      </Form.Item>
      
      <Form.Item name="password" rules={[{ required: true }]}>
        <Input.Password placeholder="Password" />
      </Form.Item>
      
      <Button type="primary" htmlType="submit" loading={isLoading}>
        Login
      </Button>
    </Form>
  );
};
```

### 2. Registration Page Component

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { validatePassword } from '@/services/auth.service';
import { Form, Input, Button, Progress } from 'antd';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validation = validatePassword(e.target.value);
    setPasswordStrength(validation.score);
  };

  const handleSubmit = async (values: any) => {
    try {
      await register({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Email" />
      </Form.Item>
      
      <Form.Item name="firstName" rules={[{ required: true }]}>
        <Input placeholder="First Name" />
      </Form.Item>
      
      <Form.Item name="lastName" rules={[{ required: true }]}>
        <Input placeholder="Last Name" />
      </Form.Item>
      
      <Form.Item name="password" rules={[{ required: true, min: 8 }]}>
        <Input.Password 
          placeholder="Password" 
          onChange={handlePasswordChange}
        />
      </Form.Item>
      
      <Progress percent={passwordStrength} />
      
      <Button type="primary" htmlType="submit" loading={isLoading}>
        Register
      </Button>
    </Form>
  );
};
```

### 3. Profile/Settings Component

```typescript
import { useAuthStore } from '@/stores/authStore';
import { Form, Input, Button, Card } from 'antd';

export const ProfileSettings = () => {
  const { user, changePassword } = useAuthStore();

  const handlePasswordChange = async (values: any) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      // Show success message
    } catch (err) {
      // Show error message
    }
  };

  return (
    <Card title="Profile">
      <p>Email: {user?.email}</p>
      <p>Name: {user?.firstName} {user?.lastName}</p>
      <p>Role: {user?.role}</p>
      
      <Form onFinish={handlePasswordChange}>
        <Form.Item name="currentPassword" rules={[{ required: true }]}>
          <Input.Password placeholder="Current Password" />
        </Form.Item>
        
        <Form.Item name="newPassword" rules={[{ required: true, min: 8 }]}>
          <Input.Password placeholder="New Password" />
        </Form.Item>
        
        <Button type="primary" htmlType="submit">
          Change Password
        </Button>
      </Form>
    </Card>
  );
};
```

### 4. Navigation Header with Logout

```typescript
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

export const Header = () => {
  const navigate = useNavigate();
  const { user, logout, logoutAll } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLogoutAll = async () => {
    await logoutAll();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
    {
      key: 'logoutAll',
      icon: <LogoutOutlined />,
      label: 'Logout All Devices',
      onClick: handleLogoutAll,
    },
  ];

  return (
    <header>
      <Dropdown menu={{ items: menuItems }}>
        <div>
          <Avatar icon={<UserOutlined />} />
          <span>{user?.firstName} {user?.lastName}</span>
        </div>
      </Dropdown>
    </header>
  );
};
```

### 5. Password Reset Flow

```typescript
// Forgot Password Page
export const ForgotPasswordPage = () => {
  const [sent, setSent] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    try {
      await authService.forgotPassword(values);
      setSent(true);
    } catch (err) {
      // Handle error
    }
  };

  if (sent) {
    return <Alert type="success" message="Password reset email sent!" />;
  }

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="Email" />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Send Reset Email
      </Button>
    </Form>
  );
};

// Reset Password Page (from email link)
export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const handleSubmit = async (values: { password: string }) => {
    try {
      await authService.resetPassword({
        token: token!,
        newPassword: values.password,
      });
      navigate('/login');
    } catch (err) {
      // Handle error
    }
  };

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item name="password" rules={[{ required: true, min: 8 }]}>
        <Input.Password placeholder="New Password" />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        Reset Password
      </Button>
    </Form>
  );
};
```

## Environment Configuration

Update your `.env` file:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000

# OAuth Configuration (if using OAuth)
VITE_OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
VITE_OAUTH_FACEBOOK_CLIENT_ID=your-facebook-client-id
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
```

## Routing Setup Example

```typescript
// App.tsx or routes.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleRoute } from '@/components/auth/RoleRoute';
import { UserRole } from '@/services/auth.service';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        } />
        
        {/* Role-based routes */}
        <Route path="/admin/*" element={
          <RoleRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminPanel />
          </RoleRoute>
        } />
        
        <Route path="/management/*" element={
          <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
            <ManagementPanel />
          </RoleRoute>
        } />
        
        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

## Security Considerations

### 1. Token Storage
- ✅ Tokens stored in `localStorage` via Zustand persist
- ✅ Tokens cleared on logout
- ✅ Auto-refresh prevents token expiration during active sessions

### 2. Protected Routes
- ✅ Use `ProtectedRoute` for all authenticated pages
- ✅ Use `RoleRoute` for role-specific pages
- ✅ Automatic redirect to login for unauthenticated users

### 3. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### 4. Account Security
- Account lockout after 5 failed login attempts (30 minutes)
- Login attempts reset after 15 minutes of inactivity
- Rate limiting on login, register, and password reset endpoints

## Testing the Integration

### 1. Start Backend Server
```bash
cd bakery-cms-api
npm run dev
```

### 2. Start Frontend Development Server
```bash
cd bakery-cms-web
npm run dev
```

### 3. Test Authentication Flow

1. **Registration:**
   - Navigate to `/register`
   - Fill in email, password, first name, last name
   - Submit form
   - Should redirect to dashboard after successful registration

2. **Login:**
   - Navigate to `/login`
   - Enter credentials
   - Should redirect to dashboard after successful login

3. **Protected Routes:**
   - Try accessing `/dashboard` without logging in
   - Should redirect to `/login`

4. **Role-Based Access:**
   - Login as different user roles
   - Try accessing admin-only pages
   - Should redirect to `/unauthorized` if insufficient permissions

5. **Token Refresh:**
   - Login and wait for token to approach expiration
   - Make an API call (e.g., fetch products)
   - Should automatically refresh token and succeed

6. **Logout:**
   - Click logout button
   - Should clear state and redirect to login
   - Subsequent API calls should fail until login again

## Troubleshooting

### Issue: 401 Unauthorized on all requests
**Solution:** Check that token is properly stored and injected in request headers

### Issue: Token not persisting after page refresh
**Solution:** Verify Zustand persist middleware is configured correctly

### Issue: Infinite redirect loop
**Solution:** Check that login page is not wrapped in `ProtectedRoute`

### Issue: Role-based routes not working
**Solution:** Verify user role matches `UserRole` enum values from backend

## Next Steps

1. **Customize Loading Components**: Replace placeholder loading divs with your loading component
2. **Add Error Boundaries**: Wrap routes with error boundaries for better error handling
3. **Implement OAuth**: Use existing `oauth.service.ts` for Google/Facebook login
4. **Add Admin UI**: Create admin management pages using backend admin API endpoints
5. **Add Session Management**: Display active sessions and allow users to revoke specific sessions

## Available Backend API Endpoints

All endpoints use base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout current session
- `POST /auth/logout/all` - Logout all sessions
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile
- `PATCH /auth/password` - Change password
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `GET /auth/verify-email` - Verify email with token

### OAuth
- `GET /auth/oauth/:provider/authorize` - Get OAuth authorization URL
- `POST /auth/oauth/:provider/callback` - Handle OAuth callback

### Admin Management (Admin only)
- `GET /auth/admin/users` - List all users
- `GET /auth/admin/users/:id` - Get user by ID
- `POST /auth/admin/users` - Create new user
- `PUT /auth/admin/users/:id` - Update user
- `DELETE /auth/admin/users/:id` - Soft delete user
- `POST /auth/admin/users/:id/restore` - Restore deleted user
- `POST /auth/admin/users/:id/unlock` - Unlock locked account
- `POST /auth/admin/users/:id/reset-password` - Admin reset user password
- `POST /auth/admin/users/:id/revoke-sessions` - Revoke all user sessions
- `GET /auth/admin/statistics` - Get user statistics

See `bakery-cms-api/docs/API.md` for complete API documentation.
