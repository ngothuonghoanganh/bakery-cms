# Bakery CMS API Documentation

## Base URL
```
Development: http://localhost:3000/api
Staging:     https://api-staging.bakery-cms.com/api
Production:  https://api.bakery-cms.com/api
```

## Soft Delete Behavior

**All entities support soft delete functionality:**

- **Products**, **Orders**, **Order Items**, and **Payments** are soft-deleted by default
- Soft-deleted records are marked with a `deletedAt` timestamp instead of being permanently removed
- Soft-deleted records are automatically filtered from all query results
- Deleted records can be recovered/restored (admin feature)
- This ensures data recoverability and audit trail compliance

**Key Points:**
- DELETE endpoints return the same response (204 No Content or success message)
- Deleted records won't appear in list queries or GET requests
- Deleting an Order cascades to its Order Items and Payment
- All deletions are logged with metadata for audit purposes

## Response Format

### Success Response
```json
{
  "status": "success",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error message",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

---

## Authentication API

### Register
```http
POST /api/auth/register
```

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Password Requirements (BR-005):**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "status": "ACTIVE",
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 31536000
    }
  }
}
```

### Login
```http
POST /api/auth/login
```

**Rate Limit:** 5 requests per 15 minutes (30-minute block on limit)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Account Lockout (BR-008):**
- 5 failed login attempts → Account locked for 30 minutes
- Login attempts reset after 15 minutes of inactivity
- Locked accounts receive remaining time in error response

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "status": "ACTIVE"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 31536000
    }
  }
}
```

**Error Response (Account Locked):**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_LOCKED",
    "message": "Account locked due to too many failed login attempts",
    "statusCode": 403,
    "details": {
      "lockedUntil": "2024-01-01T12:30:00.000Z",
      "remainingMinutes": 25
    }
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 31536000
  }
}
```

### Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Logout All Devices
```http
POST /api/auth/logout/all
```

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "All sessions terminated"
}
```

### Change Password
```http
PATCH /api/auth/password
```

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "currentPassword": "OldP@ss123",
  "newPassword": "NewP@ss456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Forgot Password
```http
POST /api/auth/forgot-password
```

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### Reset Password
```http
POST /api/auth/reset-password
```

**Rate Limit:** 3 requests per hour

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewP@ss456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Verify Email
```http
GET /api/auth/verify-email?token=verification-token
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

## OAuth Authentication

### Google OAuth Login
```http
GET /api/auth/google
```

**Rate Limit:** 10 requests per 15 minutes

**Description:** Redirects to Google OAuth consent screen

**OAuth Implementation:** PKCE (Proof Key for Code Exchange) for enhanced security (BR-007)

### Google OAuth Callback
```http
GET /api/auth/google/callback?code=auth-code&state=state-token
```

**Response:** Redirects to frontend with tokens in URL parameters

### Facebook OAuth Login
```http
GET /api/auth/facebook
```

**Rate Limit:** 10 requests per 15 minutes

**Description:** Redirects to Facebook OAuth consent screen

### Facebook OAuth Callback
```http
GET /api/auth/facebook/callback?code=auth-code&state=state-token
```

**Response:** Redirects to frontend with tokens in URL parameters

---

## Admin Management API

**All admin endpoints require Admin role authentication**

### List Users
```http
GET /api/auth/admin/users?page=1&limit=10&role=CUSTOMER&status=ACTIVE&search=john
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `role` (UserRole, optional): Filter by role (ADMIN, MANAGER, STAFF, SELLER, CUSTOMER, VIEWER)
- `status` (UserStatus, optional): Filter by status (ACTIVE, INACTIVE, SUSPENDED, PENDING)
- `search` (string, optional): Search by email, firstName, or lastName
- `sortBy` (string, optional): Sort field (createdAt, email, role)
- `sortOrder` (string, optional): Sort direction (ASC, DESC)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "CUSTOMER",
        "status": "ACTIVE",
        "provider": "email",
        "isEmailVerified": true,
        "loginAttempts": 0,
        "lastLoginAt": "2024-01-01T12:00:00.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### Get User by ID
```http
GET /api/auth/admin/users/:id
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "provider": "email",
    "isEmailVerified": true,
    "loginAttempts": 0,
    "lockedUntil": null,
    "lastLoginAt": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Create User
```http
POST /api/auth/admin/users
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecureP@ss123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "STAFF"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "STAFF",
    "status": "ACTIVE",
    "isEmailVerified": true,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Update User
```http
PATCH /api/auth/admin/users/:id
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Request Body (all fields optional):**
```json
{
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "MANAGER",
  "status": "SUSPENDED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "updated@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "MANAGER",
    "status": "SUSPENDED",
    "updatedAt": "2024-01-01T13:00:00.000Z"
  }
}
```

### Delete User (Soft Delete)
```http
DELETE /api/auth/admin/users/:id
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Response:**
```http
204 No Content
```

### Restore User
```http
POST /api/auth/admin/users/:id/restore
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "deletedAt": null,
    "restoredAt": "2024-01-01T14:00:00.000Z"
  }
}
```

### Unlock User Account
```http
POST /api/auth/admin/users/:id/unlock
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Request Body:**
```json
{
  "reason": "Customer support request"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account unlocked successfully"
}
```

### Reset User Password
```http
POST /api/auth/admin/users/:id/reset-password
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Request Body:**
```json
{
  "newPassword": "NewP@ss456",
  "requirePasswordChange": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### Revoke User Sessions
```http
POST /api/auth/admin/users/:id/revoke-sessions
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Request Body:**
```json
{
  "reason": "Security breach suspected"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sessions revoked successfully"
}
```

### Get Admin Statistics
```http
GET /api/auth/admin/statistics
```

**Headers:**
```
Authorization: Bearer <admin-access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 120,
    "usersByRole": {
      "ADMIN": 2,
      "MANAGER": 5,
      "STAFF": 10,
      "SELLER": 20,
      "CUSTOMER": 110,
      "VIEWER": 3
    },
    "usersByStatus": {
      "ACTIVE": 120,
      "INACTIVE": 10,
      "SUSPENDED": 5,
      "PENDING": 15
    },
    "recentRegistrations": 25,
    "lockedAccounts": 3
  }
}
```

---

## Role-Based Access Control (RBAC)

**User Roles (BR-003):**
1. **ADMIN** - Full system access, can manage all users and data
2. **MANAGER** - Can manage products, orders, and payments
3. **STAFF** - Can view and update orders and payments
4. **SELLER** - Can create and manage own products
5. **CUSTOMER** - Can create orders and view own data
6. **VIEWER** - Read-only access to public data

**Role Hierarchy:** Admin > Manager > Staff > Seller > Customer > Viewer

**Protected Endpoints:**
- Admin endpoints (`/api/auth/admin/*`): Require ADMIN role
- Product creation/update: Require SELLER role or higher
- Order management: Require STAFF role or higher  
- Payment processing: Require STAFF role or higher
- User can only access their own data unless they have STAFF role or higher

---

## Security Features

### Rate Limiting
All authentication endpoints are rate-limited to prevent brute force attacks:
- **Login**: 5 requests per 15 minutes (30-minute block)
- **Register**: 3 requests per hour (1-hour block)
- **Password Reset**: 3 requests per hour (1-hour block)
- **OAuth**: 10 requests per 15 minutes (15-minute block)
- **API endpoints**: 100 requests per 15 minutes

### JWT Tokens
- **Access Token**: 365-day expiration (BR-001)
- **Refresh Token**: Used to obtain new access tokens
- **Token Storage**: HttpOnly cookies (secure in production)
- **Token Validation**: Every request validates token signature and expiration

### Password Security (BR-005, BR-006)
- Hashed with bcrypt (12 rounds)
- Minimum 8 characters with complexity requirements
- Password strength indicator in frontend
- Secure password reset flow with time-limited tokens

### Session Management
- Multiple device support with session tracking
- Logout from single device or all devices
- Admin can revoke user sessions remotely
- Session cleanup on password change

---

## Products API

### List Products
```http
GET /api/products?page=1&limit=10&search=cookie&status=AVAILABLE
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search by product name
- `status` (string, optional): Filter by status (AVAILABLE, OUT_OF_STOCK)
- `businessType` (string, optional): Filter by type (MADE_TO_ORDER, READY_TO_SELL, BOTH)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Chocolate Chip Cookie",
      "description": "Delicious chocolate chip cookies",
      "businessType": "BOTH",
      "pricePerDozenMade": 50000,
      "pricePerDozenReady": 45000,
      "status": "AVAILABLE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Product by ID
```http
GET /api/products/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Chocolate Chip Cookie",
    "description": "Delicious chocolate chip cookies",
    "businessType": "BOTH",
    "pricePerDozenMade": 50000,
    "pricePerDozenReady": 45000,
    "status": "AVAILABLE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create Product
```http
POST /api/products
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Chocolate Chip Cookie",
  "description": "Delicious chocolate chip cookies",
  "businessType": "BOTH",
  "pricePerDozenMade": 50000,
  "pricePerDozenReady": 45000,
  "status": "AVAILABLE"
}
```

**Validation Rules:**
- `name`: Required, 1-255 characters
- `description`: Optional, max 1000 characters
- `businessType`: Required, one of: MADE_TO_ORDER, READY_TO_SELL, BOTH
- `pricePerDozenMade`: Optional (required if businessType includes MADE_TO_ORDER), positive number
- `pricePerDozenReady`: Optional (required if businessType includes READY_TO_SELL), positive number
- `status`: Optional, one of: AVAILABLE, OUT_OF_STOCK (default: AVAILABLE)

**Response:** (Same as Get Product)

### Update Product
```http
PATCH /api/products/:id
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Cookie Name",
  "status": "OUT_OF_STOCK"
}
```

**Response:** (Same as Get Product)

### Delete Product
```http
DELETE /api/products/:id
```

**Behavior:**
- Soft deletes the product (marks with `deletedAt` timestamp)
- Product is hidden from all queries but remains in database
- Can be restored by admin operations
- All deletions are logged for audit purposes

**Response:**
```json
{
  "status": "success",
  "message": "Product deleted successfully"
}
```

---

## Orders API

### List Orders
```http
GET /api/orders?page=1&limit=10&status=CONFIRMED&fromDate=2024-01-01
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `status` (string, optional): Filter by status (DRAFT, CONFIRMED, PAID, CANCELLED)
- `fromDate` (date, optional): Filter orders from date (YYYY-MM-DD)
- `toDate` (date, optional): Filter orders to date (YYYY-MM-DD)
- `customerPhone` (string, optional): Filter by customer phone

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-20240101-0001",
      "customerName": "John Doe",
      "customerPhone": "0901234567",
      "deliveryAddress": "123 Main St",
      "deliveryDate": "2024-01-15T00:00:00.000Z",
      "status": "CONFIRMED",
      "totalAmount": 150000,
      "notes": "Please call before delivery",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Order by ID (with items)
```http
GET /api/orders/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-0001",
    "customerName": "John Doe",
    "customerPhone": "0901234567",
    "deliveryAddress": "123 Main St",
    "deliveryDate": "2024-01-15T00:00:00.000Z",
    "status": "CONFIRMED",
    "totalAmount": 150000,
    "notes": "Please call before delivery",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Chocolate Chip Cookie",
        "quantity": 3,
        "unitPrice": 50000,
        "subtotal": 150000
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create Order
```http
POST /api/orders
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerName": "John Doe",
  "customerPhone": "0901234567",
  "deliveryAddress": "123 Main St",
  "deliveryDate": "2024-01-15T00:00:00.000Z",
  "notes": "Please call before delivery",
  "items": [
    {
      "productId": 1,
      "quantity": 3,
      "unitPrice": 50000
    }
  ]
}
```

**Validation Rules:**
- `customerName`: Required, 1-255 characters
- `customerPhone`: Required, Vietnamese phone format (10-11 digits starting with 0)
- `deliveryAddress`: Optional, max 500 characters
- `deliveryDate`: Optional, must be future date
- `notes`: Optional, max 1000 characters
- `items`: Required, array with at least 1 item
  - `productId`: Required, positive integer
  - `quantity`: Required, positive integer
  - `unitPrice`: Required, positive number

**Business Rules:**
- Order number is auto-generated: ORD-YYYYMMDD-XXXX
- Total amount is calculated from items
- Initial status is DRAFT

**Response:** (Same as Get Order with items)

### Update Order
```http
PATCH /api/orders/:id
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "customerName": "Jane Doe",
  "deliveryDate": "2024-01-20T00:00:00.000Z"
}
```

**Business Rules:**
- Cannot update orders with status PAID or CANCELLED
- Updating items requires full replacement

**Response:** (Same as Get Order with items)

### Confirm Order
```http
POST /api/orders/:id/confirm
```

**Business Rules:**
- Only DRAFT orders can be confirmed
- Changes status from DRAFT to CONFIRMED

**Response:**
```json
{
  "status": "success",
  "message": "Order confirmed successfully",
  "data": { ... }
}
```

### Cancel Order
```http
POST /api/orders/:id/cancel
```

**Business Rules:**
- Cannot cancel PAID orders
- Changes status to CANCELLED

**Response:**
```json
{
  "status": "success",
  "message": "Order cancelled successfully",
  "data": { ... }
}
```

### Delete Order
```http
DELETE /api/orders/:id
```

**Business Rules:**
- Only DRAFT orders can be deleted
- Soft deletes the order (marks with `deletedAt` timestamp)
- **Cascades soft delete to:**
  - All associated Order Items
  - Associated Payment record
- All entities remain in database but are hidden from queries
- Can be restored by admin operations
- Deletion is transactional (all-or-nothing)

**Response:**
```json
{
  "status": "success",
  "message": "Order deleted successfully"
}
```

---

## Payments API

### List Payments
```http
GET /api/payments?page=1&limit=10&status=PENDING&method=VIETQR
```

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `status` (string, optional): Filter by status (PENDING, PAID, FAILED, CANCELLED)
- `method` (string, optional): Filter by method (VIETQR, CASH, BANK_TRANSFER)
- `orderId` (number, optional): Filter by order ID

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "orderId": 1,
      "amount": 150000,
      "method": "VIETQR",
      "status": "PENDING",
      "transactionId": null,
      "paidAt": null,
      "vietqrData": {
        "bankId": "970436",
        "accountNo": "1234567890",
        "amount": 150000,
        "addInfo": "Thanh toan don hang ORD-20240101-0001"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Payment by ID
```http
GET /api/payments/:id
```

**Response:** (Same as List Payments item)

### Get Payment by Order ID
```http
GET /api/payments/order/:orderId
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderId": 1,
    "amount": 150000,
    "method": "VIETQR",
    "status": "PENDING",
    "transactionId": null,
    "paidAt": null,
    "vietqrData": { ... },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create Payment
```http
POST /api/payments
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": 1,
  "method": "VIETQR"
}
```

**Validation Rules:**
- `orderId`: Required, positive integer
- `method`: Required, one of: VIETQR, CASH, BANK_TRANSFER

**Business Rules:**
- Amount is taken from order total
- One payment per order
- VietQR data is auto-generated for VIETQR method
- Initial status is PENDING

**Response:** (Same as Get Payment)

### Mark Payment as Paid
```http
POST /api/payments/:id/mark-paid
Content-Type: application/json
```

**Request Body:**
```json
{
  "transactionId": "TXN123456789"
}
```

**Validation Rules:**
- `transactionId`: Optional, 1-255 characters

**Business Rules:**
- Only PENDING payments can be marked as paid
- Updates status to PAID
- Sets paidAt timestamp
- Updates related order status to PAID

**Response:**
```json
{
  "status": "success",
  "message": "Payment marked as paid successfully",
  "data": { ... }
}
```

### Generate VietQR Code
```http
GET /api/payments/order/:orderId/vietqr
```

**Business Rules:**
- Order must exist
- Payment must exist with VIETQR method
- Generates QR code via QuickChart.io API

**Response:**
```json
{
  "status": "success",
  "data": {
    "qrCodeUrl": "https://quickchart.io/qr?text=970436|1234567890|150000|Thanh%20toan%20don%20hang%20ORD-20240101-0001&size=300",
    "qrContent": "970436|1234567890|150000|Thanh toan don hang ORD-20240101-0001"
  }
}
```

**VietQR Format:**
```
{bankId}|{accountNo}|{amount}|{addInfo}
```

---

## System API

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "service": "Bakery CMS API",
    "version": "1.0.0",
    "uptime": 3600,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable Entity (business rule violation) |
| 429 | Too Many Requests (rate limit exceeded) |
| 500 | Internal Server Error |

---

## Rate Limiting

- Window: 15 minutes
- Max Requests: 100 per window
- Response Header: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Testing with cURL

### Create a Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chocolate Chip Cookie",
    "description": "Delicious chocolate chip cookies",
    "businessType": "BOTH",
    "pricePerDozenMade": 50000,
    "pricePerDozenReady": 45000
  }'
```

### Create an Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "0901234567",
    "deliveryAddress": "123 Main St",
    "items": [
      {
        "productId": 1,
        "quantity": 3,
        "unitPrice": 50000
      }
    ]
  }'
```

### Create Payment and Get VietQR
```bash
# Create payment
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "method": "VIETQR"
  }'

# Get VietQR code
curl http://localhost:3000/api/payments/order/1/vietqr
```

---

## Postman Collection

Import the Postman collection from `docs/Bakery-CMS-API.postman_collection.json` for easy testing.

---

**Last Updated**: 2024-01-01
**API Version**: 1.0.0
