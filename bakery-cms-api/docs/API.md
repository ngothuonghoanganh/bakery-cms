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
