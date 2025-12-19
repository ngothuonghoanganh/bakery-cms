# Frontend Authentication Integration Checklist

## ✅ Phase 1: Core Integration (COMPLETED)

### Files Created
- [x] `src/services/auth.service.ts` - Authentication API service
- [x] `src/components/auth/ProtectedRoute.tsx` - Protected route wrapper
- [x] `src/components/auth/RoleRoute.tsx` - Role-based route wrapper
- [x] `docs/AUTHENTICATION_INTEGRATION.md` - Complete integration guide
- [x] `docs/AUTH_INTEGRATION_SUMMARY.md` - Quick reference summary

### Files Updated
- [x] `src/stores/authStore.ts` - Real API integration (removed mock)
- [x] `src/services/api/client.ts` - Fixed token injection, added auto-refresh

### Verified
- [x] TypeScript compilation passes
- [x] Token injection uses correct field (`authState.token`)
- [x] Automatic token refresh on 401 errors
- [x] Store persists to localStorage
- [x] All auth methods available (login, register, logout, etc.)

---

## 📋 Phase 2: Update Existing Pages (TODO)

### Login Page
- [ ] Update `src/pages/LoginPage/` to use `useAuthStore().login()`
- [ ] Remove any mock authentication logic
- [ ] Add password validation UI
- [ ] Add "Forgot Password" link
- [ ] Add loading state handling
- [ ] Add error message display
- [ ] Test login flow end-to-end

**Example Update:**
```typescript
const { login, isLoading } = useAuthStore();

const handleSubmit = async (values) => {
  try {
    await login({ email: values.email, password: values.password });
    navigate('/dashboard');
  } catch (error) {
    // Error already shown via notification
  }
};
```

### Registration Page (if exists)
- [ ] Create or update registration page
- [ ] Use `useAuthStore().register()`
- [ ] Add password strength indicator
- [ ] Add client-side validation using `validatePassword()`
- [ ] Test registration flow

### OAuth Callback Page
- [ ] Verify OAuth callback page exists at `/oauth/callback`
- [ ] Update to use auth store
- [ ] Handle OAuth tokens and user data
- [ ] Redirect to dashboard after successful OAuth

---

## 🛡️ Phase 3: Add Route Protection (TODO)

### Update Routing Configuration
- [ ] Import `ProtectedRoute` and `RoleRoute`
- [ ] Wrap authenticated routes with `ProtectedRoute`
- [ ] Wrap role-specific routes with `RoleRoute`
- [ ] Add unauthorized page (`/unauthorized`)
- [ ] Test route protection

**Location:** `src/config/routes.config.ts` or main routing file

**Example:**
```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleRoute } from '@/components/auth/RoleRoute';
import { UserRole } from '@/services/auth.service';

// Protected route
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />

// Admin only
<Route path="/admin/*" element={
  <RoleRoute allowedRoles={[UserRole.ADMIN]}>
    <AdminPanel />
  </RoleRoute>
} />

// Admin or Manager
<Route path="/management/*" element={
  <RoleRoute allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
    <ManagementPanel />
  </RoleRoute>
} />
```

### Routes to Protect

#### Everyone (No Protection Needed)
- [ ] `/login` - Public
- [ ] `/register` - Public
- [ ] `/forgot-password` - Public
- [ ] `/reset-password` - Public
- [ ] `/verify-email` - Public

#### Authenticated Users (Use ProtectedRoute)
- [ ] `/dashboard` - Any authenticated user
- [ ] `/profile` - Any authenticated user
- [ ] `/orders` - Authenticated users
- [ ] `/payments` - Authenticated users

#### Role-Based (Use RoleRoute)
- [ ] `/admin/*` - Admin only
- [ ] `/products` - Admin, Manager, Staff, Seller
- [ ] `/management/*` - Admin, Manager
- [ ] `/reports/*` - Admin, Manager, Staff

---

## 🎨 Phase 4: Update UI Components (TODO)

### Header/Navigation
- [ ] Add user profile dropdown
- [ ] Show user name and role
- [ ] Add logout button
- [ ] Add "Logout All Devices" option
- [ ] Conditionally show admin menu for admins

**Example:**
```typescript
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/services/auth.service';

const Header = () => {
  const { user, logout } = useAuthStore();
  
  return (
    <header>
      <Dropdown menu={{ items: [
        { label: 'Profile', onClick: () => navigate('/profile') },
        { label: 'Logout', onClick: logout },
      ]}}>
        <Avatar>{user?.firstName[0]}</Avatar>
      </Dropdown>
      
      {isAdmin(user) && <Link to="/admin">Admin Panel</Link>}
    </header>
  );
};
```

### Profile/Settings Page
- [ ] Create or update profile page
- [ ] Display user information
- [ ] Add change password form
- [ ] Use `useAuthStore().changePassword()`
- [ ] Test password change

### Loading States
- [ ] Replace placeholder loading divs in route guards
- [ ] Add loading spinners to login/register forms
- [ ] Use `isLoading` state from auth store
- [ ] Add skeleton screens for protected pages

---

## 🔐 Phase 5: Password Management (TODO)

### Forgot Password Page
- [ ] Create forgot password page at `/forgot-password`
- [ ] Use `authService.forgotPassword()`
- [ ] Show success message
- [ ] Add link to login page

### Reset Password Page
- [ ] Create reset password page at `/reset-password`
- [ ] Extract token from URL query params
- [ ] Use `authService.resetPassword()`
- [ ] Add password strength indicator
- [ ] Redirect to login after success

### Email Verification Page
- [ ] Create email verification page at `/verify-email`
- [ ] Extract token from URL query params
- [ ] Use `authService.verifyEmail()`
- [ ] Show verification status
- [ ] Redirect to dashboard or login

---

## 🧪 Phase 6: Testing (TODO)

### Manual Testing
- [ ] **Registration Flow**
  - [ ] Register new user
  - [ ] Verify email (if implemented)
  - [ ] Login with new credentials

- [ ] **Login Flow**
  - [ ] Login with valid credentials
  - [ ] Verify redirect to dashboard
  - [ ] Check user data displayed correctly
  - [ ] Verify token stored in localStorage

- [ ] **Protected Routes**
  - [ ] Access protected route without login → should redirect
  - [ ] Login then access protected route → should work
  - [ ] Check page refresh maintains authentication

- [ ] **Role-Based Access**
  - [ ] Login as different roles (admin, manager, staff, etc.)
  - [ ] Try accessing admin-only pages
  - [ ] Verify unauthorized redirect for insufficient permissions

- [ ] **Logout**
  - [ ] Logout from one session
  - [ ] Verify token cleared from localStorage
  - [ ] Verify redirect to login
  - [ ] Try accessing protected route → should redirect

- [ ] **Logout All Devices**
  - [ ] Login from multiple devices/browsers
  - [ ] Logout all from one device
  - [ ] Verify all sessions invalidated

- [ ] **Token Refresh**
  - [ ] Make API call near token expiration
  - [ ] Verify automatic token refresh
  - [ ] Verify request succeeds after refresh

- [ ] **Password Change**
  - [ ] Change password
  - [ ] Verify can login with new password
  - [ ] Verify cannot login with old password

- [ ] **Password Reset**
  - [ ] Request password reset
  - [ ] Check email for reset link
  - [ ] Reset password via link
  - [ ] Login with new password

### Error Handling
- [ ] Invalid login credentials → show error
- [ ] Network error → show notification
- [ ] Expired token → auto-refresh or logout
- [ ] Failed token refresh → logout and redirect
- [ ] API 500 error → show server error message
- [ ] API 403 error → show unauthorized message

### Edge Cases
- [ ] Logout while making API request
- [ ] Token expiration during form submission
- [ ] Multiple tabs open, logout from one
- [ ] Page refresh during authentication
- [ ] Back button after logout
- [ ] Direct URL access to protected routes

---

## 📊 Phase 7: Optional Enhancements (TODO)

### Session Management UI
- [ ] Create session management page
- [ ] Show list of active sessions (device, location, last active)
- [ ] Allow revoking individual sessions
- [ ] Show current session indicator

### OAuth Integration
- [ ] Add Google login button
- [ ] Add Facebook login button
- [ ] Use existing `oauth.service.ts`
- [ ] Handle OAuth callback
- [ ] Link OAuth accounts to existing users

### Admin Panel (if not exists)
- [ ] Create admin user management page
- [ ] List all users with filters
- [ ] View user details
- [ ] Create new users
- [ ] Edit user roles
- [ ] Soft delete users
- [ ] Restore deleted users
- [ ] Unlock locked accounts
- [ ] Reset user passwords
- [ ] Revoke user sessions
- [ ] View statistics dashboard

### Security Enhancements
- [ ] Add 2FA setup page
- [ ] Add security audit log viewer
- [ ] Add password expiration warnings
- [ ] Add session timeout warnings
- [ ] Add suspicious activity alerts

### UX Improvements
- [ ] Add remember me checkbox
- [ ] Add stay logged in option
- [ ] Add login with email verification requirement toggle
- [ ] Add profile picture upload
- [ ] Add user preferences

---

## 🔧 Phase 8: Environment Configuration (TODO)

### Environment Variables
- [ ] Create `.env.development` file
- [ ] Create `.env.production` file
- [ ] Document all required variables
- [ ] Add `.env.example` file

**Required Variables:**
```bash
# Development (.env.development)
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000

# Production (.env.production)
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_API_TIMEOUT=30000

# OAuth (if using)
VITE_OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
VITE_OAUTH_FACEBOOK_CLIENT_ID=your-facebook-client-id
VITE_OAUTH_REDIRECT_URI=http://localhost:5173/oauth/callback
```

### Build Configuration
- [ ] Verify production build works
- [ ] Check bundle size
- [ ] Enable source maps for debugging
- [ ] Configure API URL for different environments

---

## 📝 Phase 9: Documentation Updates (TODO)

### Update README.md
- [ ] Add authentication section
- [ ] Document environment variables
- [ ] Add testing instructions
- [ ] Add troubleshooting section

### Update Project Documentation
- [ ] Link to authentication integration guide
- [ ] Document user roles and permissions
- [ ] Add API endpoints reference
- [ ] Document OAuth setup (if implemented)

---

## 🚀 Phase 10: Deployment Preparation (TODO)

### Pre-Deployment Checklist
- [ ] All TypeScript errors resolved
- [ ] All tests passing (if tests exist)
- [ ] Production build successful
- [ ] Environment variables configured
- [ ] API endpoints tested in production
- [ ] SSL/TLS configured
- [ ] CORS configured on backend
- [ ] Rate limiting tested
- [ ] Security audit completed

### Production Configuration
- [ ] Update API base URL to production
- [ ] Enable production optimizations
- [ ] Configure CDN (if using)
- [ ] Setup error tracking (Sentry, etc.)
- [ ] Setup analytics (if needed)
- [ ] Configure monitoring

---

## 📚 Resources

- **Integration Guide**: `bakery-cms-web/docs/AUTHENTICATION_INTEGRATION.md`
- **Quick Summary**: `bakery-cms-web/docs/AUTH_INTEGRATION_SUMMARY.md`
- **Backend API Docs**: `bakery-cms-api/docs/API.md`
- **Backend Quickstart**: `bakery-cms-api/docs/QUICKSTART.md`

---

## ✅ Current Status

**Completed**: Phase 1 - Core Integration  
**Next Step**: Phase 2 - Update Existing Pages  
**Priority**: Update login page with real authentication

---

## 🆘 Need Help?

Refer to:
1. `AUTHENTICATION_INTEGRATION.md` for detailed examples
2. `AUTH_INTEGRATION_SUMMARY.md` for quick reference
3. Backend API documentation for endpoint details
4. TypeScript errors: Check import paths and type definitions
