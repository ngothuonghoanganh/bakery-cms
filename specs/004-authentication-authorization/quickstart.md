# Quickstart: Authentication and Authorization

## Prerequisites

### Backend Setup
- Backend server running on http://localhost:3000
- MySQL database running and accessible
- Database migrations applied (users and auth_sessions tables)
- Environment variables configured:
  ```bash
  # JWT Configuration
  JWT_ACCESS_SECRET=your-access-secret-here
  JWT_REFRESH_SECRET=your-refresh-secret-here
  
  # OAuth Configuration
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
  
  FACEBOOK_CLIENT_ID=your-facebook-client-id
  FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
  FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/callback
  
  # Database
  DB_HOST=localhost
  DB_PORT=3306
  DB_NAME=bakery_cms
  DB_USERNAME=root
  DB_PASSWORD=your-password
  
  # Redis (for session storage)
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```

### Frontend Setup
- Frontend development server running on http://localhost:5173
- Environment variables configured:
  ```bash
  VITE_API_BASE_URL=http://localhost:3000/api/v1
  ```

### Database Seeding
- Admin user seeded with credentials:
  - Email: `admin@bakery.com`
  - Password: `AdminPass123!`
  - Role: `admin`

## Backend API Testing

### 1. Admin Login (Traditional Authentication)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bakery.com",
    "password": "AdminPass123!"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@bakery.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "status": "active",
      "provider": "local",
      "email_verified_at": "2025-12-17T10:00:00Z",
      "created_at": "2025-12-17T10:00:00Z",
      "updated_at": "2025-12-17T10:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 31536000,
    "token_type": "Bearer"
  }
}
```

### 2. Register New User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Expected Response (201 Created)**:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "new-uuid-here",
      "email": "customer@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "customer",
      "status": "pending_verification",
      "provider": "local",
      "email_verified_at": null,
      "created_at": "2025-12-17T14:00:00Z",
      "updated_at": "2025-12-17T14:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 31536000,
    "token_type": "Bearer"
  }
}
```

### 3. Get Current User Profile
```bash
# Use the access_token from login response
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "id": "uuid-here",
    "email": "admin@bakery.com",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin",
    "status": "active",
    "provider": "local",
    "email_verified_at": "2025-12-17T10:00:00Z",
    "last_login_at": "2025-12-17T14:30:00Z",
    "created_at": "2025-12-17T10:00:00Z",
    "updated_at": "2025-12-17T14:30:00Z"
  }
}
```

### 4. Get OAuth Authorization URL
```bash
curl -X GET "http://localhost:3000/api/v1/oauth/auth-url/google?redirect_uri=http://localhost:3000/auth/callback"
```

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "auth_url": "https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=...",
    "state": "random-state-string",
    "code_verifier": "pkce-code-verifier"
  }
}
```

### 5. Refresh Access Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "data": {
    "access_token": "new-access-token-here",
    "expires_in": 31536000,
    "token_type": "Bearer"
  }
}
```

### 6. Change Password
```bash
curl -X PUT http://localhost:3000/api/v1/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "currentPassword": "AdminPass123!",
    "newPassword": "NewAdminPass123!"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Password changed successfully"
}
```

### 7. Logout
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Expected Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

## Frontend Testing

### 1. Start Development Server
```bash
cd bakery-cms-web
yarn dev
```
Frontend should be available at: http://localhost:5173

### 2. Test Login Flow
1. **Navigate to Login Page**: http://localhost:5173/login
2. **Enter Admin Credentials**:
   - Email: `admin@bakery.com`
   - Password: `AdminPass123!`
3. **Click "Login" Button**
4. **Verify Redirect**: Should redirect to dashboard/home page
5. **Check Auth State**: User info should be visible in header/nav

### 3. Test Registration Flow
1. **Navigate to Register Page**: http://localhost:5173/register
2. **Fill Registration Form**:
   - Email: `test@example.com`
   - Password: `TestPass123!`
   - First Name: `Test`
   - Last Name: `User`
3. **Submit Form**
4. **Verify Account Creation**: Should login automatically and redirect

### 4. Test OAuth Flow (Google)
1. **Click "Login with Google" Button**
2. **Browser Redirects**: Should go to Google OAuth consent screen
3. **Grant Permissions**: Accept OAuth permissions
4. **Verify Callback**: Should redirect back to app and login automatically
5. **Check User Profile**: OAuth user data should be populated

### 5. Test Protected Routes
1. **Without Authentication**: Navigate to http://localhost:5173/profile
2. **Verify Redirect**: Should redirect to login page
3. **After Login**: Same URL should show profile page
4. **Access Control**: Different content based on user role

### 6. Test Logout Flow
1. **Click Logout Button** (in header/nav)
2. **Verify Cleanup**: User state cleared, tokens removed
3. **Verify Redirect**: Should go to login page or home
4. **Test Access**: Protected routes should redirect to login

### 7. Test Token Refresh
1. **Login and Wait**: Keep app open (or manually expire token in dev tools)
2. **Make API Call**: Any authenticated action (view profile, etc.)
3. **Verify Refresh**: Should automatically refresh token if needed
4. **No Interruption**: User should not notice the refresh

## Integration Testing Scenarios

### Scenario 1: Complete Authentication Flow
1. **Register** new user via API
2. **Verify User Appears** in frontend user list (admin view)
3. **Login** with new user credentials
4. **Update Profile** via frontend forms
5. **Verify Changes** in API response
6. **Logout** and confirm session cleanup

### Scenario 2: OAuth Integration Flow
1. **Get OAuth URL** from API
2. **Simulate OAuth Callback** (may need mock/testing tools)
3. **Verify User Creation/Login**
4. **Check OAuth Provider Data** in user profile
5. **Test Linking Additional Providers**

### Scenario 3: Role-Based Access Control
1. **Login as Customer**
2. **Try Admin Actions**: Should be blocked (403 responses)
3. **Login as Admin**
4. **Perform Admin Actions**: Should succeed
5. **Update User Role** via admin panel
6. **Verify New Permissions** take effect

### Scenario 4: Security and Error Handling
1. **Invalid Login Attempts**: Test account lockout after 5 attempts
2. **Expired Token Handling**: Test automatic refresh
3. **CSRF Protection**: Test state parameter validation
4. **Rate Limiting**: Test rapid authentication attempts
5. **SQL Injection**: Test input sanitization

### Scenario 5: Multi-Session Management
1. **Login from Multiple Devices/Browsers**
2. **View Active Sessions** in user profile
3. **Revoke Specific Session**
4. **Verify Other Sessions Still Work**
5. **Logout All Sessions**
6. **Verify All Tokens Invalidated**

## Error Scenarios Testing

### Invalid Authentication
```bash
# Wrong password
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bakery.com",
    "password": "wrongpassword"
  }'
```
**Expected**: 401 Unauthorized with error details

### Account Lockout
```bash
# Make 5+ failed login attempts rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@bakery.com",
      "password": "wrongpassword"
    }'
done
```
**Expected**: 423 Locked after 5th attempt

### Expired/Invalid Token
```bash
# Use expired or invalid token
curl -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer invalid-token"
```
**Expected**: 401 Unauthorized

### Missing Required Fields
```bash
# Registration with missing fields
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```
**Expected**: 400 Bad Request with validation errors

## Performance Testing

### Load Testing (Optional)
```bash
# Install artillery (load testing tool)
npm install -g artillery

# Create load test config
cat > auth-load-test.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Login Load Test"
    requests:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "admin@bakery.com"
            password: "AdminPass123!"
EOF

# Run load test
artillery run auth-load-test.yml
```

**Expected**: API should handle load without significant degradation

## Database Verification

### Check Data Integrity
```sql
-- Connect to MySQL database
mysql -u root -p bakery_cms

-- Check users table
SELECT id, email, first_name, last_name, role, status, provider, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Check auth_sessions table
SELECT id, user_id, device_info, ip_address, is_active, expires_at, created_at 
FROM auth_sessions 
WHERE is_active = true 
ORDER BY created_at DESC;

-- Check login attempts and lockouts
SELECT id, email, login_attempts, locked_until 
FROM users 
WHERE login_attempts > 0 OR locked_until IS NOT NULL;

-- Verify foreign key relationships
SELECT u.email, COUNT(s.id) as active_sessions 
FROM users u 
LEFT JOIN auth_sessions s ON u.id = s.user_id AND s.is_active = true 
GROUP BY u.id, u.email;
```

## Monitoring and Logs

### Application Logs
- Check authentication events in application logs
- Monitor failed login attempts
- Track token refresh operations
- Watch for OAuth callback errors

### Key Metrics to Monitor
- Login success/failure rates
- Token refresh frequency
- Account lockout incidents
- OAuth callback success rates
- API response times for auth endpoints
- Active session counts

## Troubleshooting Common Issues

### OAuth Setup Issues
1. **Invalid Client ID/Secret**: Check environment variables
2. **Redirect URI Mismatch**: Verify OAuth provider settings
3. **PKCE Verification Failed**: Check code_verifier generation

### Token Issues
1. **Tokens Not Working**: Check JWT secret configuration
2. **Tokens Expire Too Soon**: Verify expiration settings
3. **Refresh Fails**: Check refresh token storage/retrieval

### Database Issues
1. **User Not Found**: Check database seeding
2. **Duplicate Email**: Check unique constraints
3. **Sessions Not Cleaned**: Run cleanup job manually

### Frontend Issues
1. **CORS Errors**: Check CORS configuration in backend
2. **Auth State Not Persisting**: Check localStorage/Zustand persistence
3. **Redirect Loops**: Check protected route logic