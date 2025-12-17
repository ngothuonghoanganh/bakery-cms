# Bakery CMS API - Quick Start Guide

This guide will help you verify that the backend API is working correctly.

## Prerequisites Check

Before starting, verify you have:
```bash
node --version  # Should be v18.0.0 or higher
yarn --version  # Should be 1.22.0 or higher
mysql --version # Should be 8.0 or higher
```

## Step 1: Environment Setup

1. Create `.env` file from template:
```bash
cp .env.example .env
```

2. Update `.env` with your database credentials:
```env
NODE_ENV=development
PORT=3000
HOST=localhost

DB_HOST=localhost
DB_PORT=3306
DB_NAME=bakery_db
DB_USER=root
DB_PASSWORD=your_password
DB_SSL=false

JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d

API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info
```

## Step 2: Database Setup

1. Create the database:
```bash
mysql -u root -p -e "CREATE DATABASE bakery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

2. Run migrations:
```bash
yarn migrate
```

Expected output:
```
== 20240101000001-create-products: migrating =======
== 20240101000001-create-products: migrated (0.123s)
== 20240101000002-create-orders: migrating =======
== 20240101000002-create-orders: migrated (0.145s)
== 20240101000003-create-order-items: migrating =======
== 20240101000003-create-order-items: migrated (0.089s)
== 20240101000004-create-payments: migrating =======
== 20240101000004-create-payments: migrated (0.112s)
```

3. (Optional) Seed sample data:
```bash
yarn seed
```

Expected output:
```
== 20240101000001-seed-products: migrating =======
== 20240101000001-seed-products: migrated (0.056s)
```

## Step 3: Build and Start Server

1. Install dependencies (if not done):
```bash
yarn install
```

2. Build the application:
```bash
yarn build
```

Expected output:
```
✓ @bakery-cms/common built successfully
✓ @bakery-cms/database built successfully
✓ @bakery-cms/api built successfully
```

3. Start the development server:
```bash
yarn dev
```

Expected output:
```
[2024-01-01T00:00:00.000Z] INFO: Database connected successfully
[2024-01-01T00:00:00.000Z] INFO: Server started on http://localhost:3000
```

Keep this terminal open!

## Step 4: Verify Health Endpoint

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "service": "Bakery CMS API",
    "version": "1.0.0",
    "uptime": 5,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

✅ If you see this response, your server is running correctly!

## Step 5: Test Products CRUD

### 5.1 Create a Product

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chocolate Chip Cookie",
    "description": "Delicious chocolate chip cookies made with premium ingredients",
    "businessType": "BOTH",
    "pricePerDozenMade": 50000,
    "pricePerDozenReady": 45000,
    "status": "AVAILABLE"
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Chocolate Chip Cookie",
    "description": "Delicious chocolate chip cookies made with premium ingredients",
    "businessType": "BOTH",
    "pricePerDozenMade": 50000,
    "pricePerDozenReady": 45000,
    "status": "AVAILABLE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

✅ Note the `id` value (e.g., 1) for next steps.

### 5.2 List Products

```bash
curl http://localhost:3000/api/products
```

Expected response:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Chocolate Chip Cookie",
      ...
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

✅ You should see the product you just created.

### 5.3 Get Product by ID

```bash
curl http://localhost:3000/api/products/1
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Chocolate Chip Cookie",
    ...
  }
}
```

✅ Should return the specific product details.

### 5.4 Update Product

```bash
curl -X PATCH http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "pricePerDozenMade": 55000,
    "pricePerDozenReady": 50000
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Chocolate Chip Cookie",
    "pricePerDozenMade": 55000,
    "pricePerDozenReady": 50000,
    ...
  }
}
```

✅ Prices should be updated.

## Step 6: Test Orders CRUD

### 6.1 Create an Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "0901234567",
    "deliveryAddress": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
    "deliveryDate": "2024-01-15T10:00:00.000Z",
    "notes": "Please call before delivery",
    "items": [
      {
        "productId": 1,
        "quantity": 3,
        "unitPrice": 55000
      }
    ]
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-0001",
    "customerName": "John Doe",
    "customerPhone": "0901234567",
    "deliveryAddress": "123 Nguyen Hue Street, District 1, Ho Chi Minh City",
    "deliveryDate": "2024-01-15T10:00:00.000Z",
    "status": "DRAFT",
    "totalAmount": 165000,
    "notes": "Please call before delivery",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Chocolate Chip Cookie",
        "quantity": 3,
        "unitPrice": 55000,
        "subtotal": 165000
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

✅ Note the `orderNumber` and check that:
- Order number follows format: ORD-YYYYMMDD-XXXX
- Total amount is calculated correctly (3 × 55,000 = 165,000)
- Status is DRAFT

### 6.2 List Orders

```bash
curl http://localhost:3000/api/orders
```

Expected response:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "orderNumber": "ORD-20240101-0001",
      "customerName": "John Doe",
      ...
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

✅ You should see the order you just created.

### 6.3 Get Order by ID

```bash
curl http://localhost:3000/api/orders/1
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-0001",
    "items": [
      {
        "id": 1,
        "productId": 1,
        "productName": "Chocolate Chip Cookie",
        "quantity": 3,
        "unitPrice": 55000,
        "subtotal": 165000
      }
    ],
    ...
  }
}
```

✅ Should include order items.

### 6.4 Confirm Order

```bash
curl -X POST http://localhost:3000/api/orders/1/confirm
```

Expected response:
```json
{
  "status": "success",
  "message": "Order confirmed successfully",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-0001",
    "status": "CONFIRMED",
    ...
  }
}
```

✅ Status should change from DRAFT to CONFIRMED.

## Step 7: Test Payments & VietQR

### 7.1 Create Payment

```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "method": "VIETQR"
  }'
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderId": 1,
    "amount": 165000,
    "method": "VIETQR",
    "status": "PENDING",
    "transactionId": null,
    "paidAt": null,
    "vietqrData": {
      "bankId": "970436",
      "accountNo": "1234567890",
      "amount": 165000,
      "addInfo": "Thanh toan don hang ORD-20240101-0001"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

✅ Check that:
- Amount matches order total (165,000)
- VietQR data is generated
- Status is PENDING

### 7.2 Get Payment by Order

```bash
curl http://localhost:3000/api/payments/order/1
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderId": 1,
    "amount": 165000,
    ...
  }
}
```

✅ Should return the payment for order ID 1.

### 7.3 Generate VietQR Code

```bash
curl http://localhost:3000/api/payments/order/1/vietqr
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "qrCodeUrl": "https://quickchart.io/qr?text=970436|1234567890|165000|Thanh%20toan%20don%20hang%20ORD-20240101-0001&size=300",
    "qrContent": "970436|1234567890|165000|Thanh toan don hang ORD-20240101-0001"
  }
}
```

✅ Open the `qrCodeUrl` in a browser - you should see a QR code image!

### 7.4 Mark Payment as Paid

```bash
curl -X POST http://localhost:3000/api/payments/1/mark-paid \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TXN123456789"
  }'
```

Expected response:
```json
{
  "status": "success",
  "message": "Payment marked as paid successfully",
  "data": {
    "id": 1,
    "orderId": 1,
    "status": "PAID",
    "transactionId": "TXN123456789",
    "paidAt": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

✅ Check that:
- Payment status changed to PAID
- Transaction ID is set
- paidAt timestamp is set

### 7.5 Verify Order Status Updated

```bash
curl http://localhost:3000/api/orders/1
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "orderNumber": "ORD-20240101-0001",
    "status": "PAID",
    ...
  }
}
```

✅ Order status should automatically change to PAID!

## Step 8: Test Error Handling

### 8.1 Validation Error

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "businessType": "INVALID"
  }'
```

Expected response (400):
```json
{
  "status": "error",
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "businessType",
      "message": "Business type must be one of: MADE_TO_ORDER, READY_TO_SELL, BOTH"
    }
  ]
}
```

✅ Should return validation errors.

### 8.2 Not Found Error

```bash
curl http://localhost:3000/api/products/9999
```

Expected response (404):
```json
{
  "status": "error",
  "message": "Product not found"
}
```

✅ Should return not found error.

### 8.3 Business Rule Error

```bash
curl -X POST http://localhost:3000/api/orders/1/confirm
```

Expected response (422):
```json
{
  "status": "error",
  "message": "Order is already confirmed"
}
```

✅ Cannot confirm an order that's already PAID.

## Step 9: Run Tests

```bash
yarn test
```

Expected output:
```
PASS  packages/api/src/modules/products/mappers/products.mappers.test.ts
  toProductResponseDto
    ✓ should transform product model to response DTO (5ms)
    ✓ should handle null description (2ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

✅ All tests should pass.

## Step 10: Check Test Coverage

```bash
yarn test:coverage
```

Expected output:
```
----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   85.23 |    82.14 |   88.45 |   85.67 |
 products/mappers     |   100   |    100   |   100   |   100   |
  products.mappers.ts |   100   |    100   |   100   |   100   |
...
----------------------|---------|----------|---------|---------|
```

✅ Coverage should be above 80% for all metrics.

## ✅ Verification Checklist

- [ ] Server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Can create products
- [ ] Can list products with pagination
- [ ] Can get product by ID
- [ ] Can update products
- [ ] Can create orders with items
- [ ] Order number is auto-generated correctly
- [ ] Order total is calculated automatically
- [ ] Can confirm orders
- [ ] Can create payments
- [ ] VietQR data is generated correctly
- [ ] QR code image URL is accessible
- [ ] Marking payment as paid updates order status
- [ ] Validation errors return proper error messages
- [ ] Not found errors return 404
- [ ] Business rule violations return 422
- [ ] All tests pass
- [ ] Test coverage is above 80%

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: 
- Check MySQL is running: `mysql.server status`
- Start MySQL: `mysql.server start`
- Verify credentials in `.env`

### Migration Error
```
Error: Unknown database 'bakery_db'
```
**Solution**: Create the database first
```bash
mysql -u root -p -e "CREATE DATABASE bakery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: 
- Kill process: `lsof -ti:3000 | xargs kill -9`
- Or change PORT in `.env`

### TypeScript Errors
```
Error: Cannot find module '@bakery-cms/common'
```
**Solution**: 
- Build all packages: `yarn build`
- Clean and rebuild: `yarn clean && yarn build`

## Next Steps

1. ✅ Backend API is fully functional!
2. 📱 Proceed to Step 12: Admin Dashboard Frontend (React)
3. 📱 Then Step 13: Mobile App (React Native)
4. 🎉 Complete full-stack Bakery CMS!

---

**Happy Testing! 🍪**
