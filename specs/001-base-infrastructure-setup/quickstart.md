# Quickstart Guide: Base Infrastructure Setup

This guide provides step-by-step instructions for setting up both repositories (backend and frontend), running the development environment, and testing the infrastructure.

---

## Prerequisites

### Required Software
- **Node.js**: 18.x or higher
- **Yarn**: 3.x or higher (Berry)
- **MySQL**: 8.0 or higher
- **Git**: Latest version

### Verify Installations
```bash
node --version  # Should be 18.x+
yarn --version  # Should be 3.x+
mysql --version # Should be 8.0+
```

---

## Part 1: Backend Setup (bakery-cms-api)

### Step 1: Clone Repository
```bash
git clone <backend-repo-url> bakery-cms-api
cd bakery-cms-api
```

### Step 2: Install Dependencies
```bash
# Install dependencies for all packages
yarn install
```

### Step 3: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
```

**Example .env file**:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bakery_cms
DB_USER=root
DB_PASSWORD=your_password

# Server
PORT=3000
NODE_ENV=development

# JWT (for future authentication)
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1
```

### Step 4: Create Database
```bash
# Create MySQL database
mysql -u root -p

# In MySQL shell:
CREATE DATABASE bakery_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### Step 5: Run Migrations
```bash
# Run database migrations
yarn workspace @bakery-cms/database migrate

# Or using Sequelize CLI
npx sequelize-cli db:migrate
```

### Step 6: Seed Database (Optional)
```bash
# Seed initial product data
yarn workspace @bakery-cms/database seed

# Or using Sequelize CLI
npx sequelize-cli db:seed:all
```

### Step 7: Build Packages
```bash
# Build all packages
yarn build

# Or build specific package
yarn workspace @bakery-cms/common build
yarn workspace @bakery-cms/database build
yarn workspace @bakery-cms/api build
```

### Step 8: Start Development Server
```bash
# Start API server in development mode
yarn workspace @bakery-cms/api dev

# Or from root
yarn dev:api
```

**Expected Output**:
```
[API] Server running on http://localhost:3000
[API] Environment: development
[API] Database connected successfully
```

### Step 9: Verify Backend is Running
```bash
# Health check
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-12-16T10:00:00.000Z"}

# API version check
curl http://localhost:3000/api/v1

# Expected response:
# {"version":"v1","status":"running"}
```

---

## Part 2: Frontend Setup (bakery-cms-web)

### Step 1: Clone Repository
```bash
# In a new terminal, navigate to your projects directory
git clone <frontend-repo-url> bakery-cms-web
cd bakery-cms-web
```

### Step 2: Install Dependencies
```bash
yarn install
```

### Step 3: Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file
```

**Example .env file**:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=Bakery CMS
VITE_APP_ENV=development
```

### Step 4: Start Development Server
```bash
# Start Vite development server
yarn dev
```

**Expected Output**:
```
VITE v5.0.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

### Step 5: Open Application
```bash
# Open in default browser
open http://localhost:5173

# Or manually navigate to http://localhost:5173
```

---

## Part 3: Testing the Infrastructure

### Backend API Testing

#### 1. Test Product Endpoints

**Create Product**
```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cookie",
    "description": "A delicious test cookie",
    "price": 5000,
    "category": "Test",
    "businessType": "both"
  }'
```

**Expected**: 201 Created
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Cookie",
  "description": "A delicious test cookie",
  "price": 5000,
  "category": "Test",
  "businessType": "both",
  "status": "available",
  "imageUrl": null,
  "createdAt": "2025-12-16T10:00:00.000Z",
  "updatedAt": "2025-12-16T10:00:00.000Z"
}
```

**List Products**
```bash
curl http://localhost:3000/api/v1/products
```

**Expected**: 200 OK
```json
{
  "products": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Test Cookie",
      ...
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

**Get Product by ID**
```bash
curl http://localhost:3000/api/v1/products/{product-id}
```

**Expected**: 200 OK with product details

**Update Product**
```bash
curl -X PUT http://localhost:3000/api/v1/products/{product-id} \
  -H "Content-Type: application/json" \
  -d '{
    "price": 5500,
    "status": "available"
  }'
```

**Expected**: 200 OK with updated product

**Delete Product**
```bash
curl -X DELETE http://localhost:3000/api/v1/products/{product-id}
```

**Expected**: 204 No Content

#### 2. Test Order Endpoints

**Create Order**
```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "official",
    "businessModel": "made-to-order",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 10
      }
    ],
    "customerName": "John Doe",
    "customerPhone": "+84901234567",
    "notes": "Please deliver before 5pm"
  }'
```

**Expected**: 201 Created with order details

**List Orders**
```bash
curl http://localhost:3000/api/v1/orders
```

**Get Order by ID**
```bash
curl http://localhost:3000/api/v1/orders/{order-id}
```

**Confirm Order**
```bash
curl -X POST http://localhost:3000/api/v1/orders/{order-id}/confirm
```

**Expected**: Status changes from draft to confirmed

#### 3. Test Payment Endpoints

**Create Payment**
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "{order-id}",
    "paymentMethod": "vietqr",
    "amount": 50000
  }'
```

**Expected**: 201 Created with QR code data

**Mark Payment as Paid**
```bash
curl -X POST http://localhost:3000/api/v1/payments/{payment-id}/paid \
  -H "Content-Type: application/json" \
  -d '{
    "transactionRef": "PAY-20251216-0001"
  }'
```

**Expected**: Payment status changes to paid

### Frontend Testing

#### 1. Product Management
1. Navigate to http://localhost:5173/products
2. Should see list of products (or empty state if no products)
3. Click "Add Product" button
4. Fill form with product details
5. Submit form
6. Verify product appears in list
7. Click on product to view details
8. Edit product
9. Delete product

#### 2. Order Management
1. Navigate to http://localhost:5173/orders
2. Click "Create Order" button
3. Select products and quantities
4. Fill customer information
5. Submit order (draft)
6. Verify order appears in list
7. Click "Confirm Order"
8. Verify status changes to confirmed

#### 3. Payment Processing
1. From order detail page, click "Create Payment"
2. Select payment method (VietQR)
3. Verify QR code is displayed
4. Mark payment as paid
5. Verify order status changes to paid

### Integration Testing

#### Complete Order Flow
1. **Create Product** (Backend API)
   ```bash
   curl -X POST http://localhost:3000/api/v1/products \
     -H "Content-Type: application/json" \
     -d '{"name": "Integration Test Cookie", "price": 5000, "businessType": "both"}'
   ```

2. **Verify in Frontend**
   - Open http://localhost:5173/products
   - See "Integration Test Cookie" in list

3. **Create Order** (Frontend)
   - Click "Create Order"
   - Add "Integration Test Cookie" with quantity 10
   - Fill customer info
   - Submit

4. **Verify via API**
   ```bash
   curl http://localhost:3000/api/v1/orders
   ```

5. **Confirm Order** (Frontend)
   - Open order detail
   - Click "Confirm Order"
   - Verify status is "confirmed"

6. **Create Payment** (Frontend)
   - Click "Create Payment"
   - Select VietQR
   - Verify QR code displayed

7. **Complete Payment** (API)
   ```bash
   curl -X POST http://localhost:3000/api/v1/payments/{payment-id}/paid
   ```

8. **Verify Final State** (Frontend)
   - Refresh order detail
   - Verify status is "paid"

---

## Part 4: Running Tests

### Backend Tests

**Run All Tests**
```bash
# From backend root
yarn test

# With coverage
yarn test:coverage
```

**Run Specific Package Tests**
```bash
# Test API package
yarn workspace @bakery-cms/api test

# Test database package
yarn workspace @bakery-cms/database test

# Test common package
yarn workspace @bakery-cms/common test
```

**Run Integration Tests**
```bash
yarn test:integration
```

**Expected Output**:
```
PASS packages/api/src/modules/products/tests/products.services.test.ts
PASS packages/api/src/modules/orders/tests/orders.services.test.ts
PASS packages/api/tests/integration/products.test.ts

Test Suites: 10 passed, 10 total
Tests:       50 passed, 50 total
Coverage:    82.5% statements, 80.1% branches, 85.3% functions, 81.9% lines
```

### Frontend Tests

**Run All Tests**
```bash
# From frontend root
yarn test

# With coverage
yarn test:coverage
```

**Run in Watch Mode**
```bash
yarn test:watch
```

**Run Specific Test File**
```bash
yarn test ProductList.test.tsx
```

**Expected Output**:
```
PASS src/components/features/products/ProductList/ProductList.test.tsx
PASS src/services/product.service.test.ts
PASS src/components/shared/ProductCard/ProductCard.test.tsx

Test Suites: 15 passed, 15 total
Tests:       75 passed, 75 total
Coverage:    83.2% statements, 81.5% branches, 84.7% functions, 82.8% lines
```

---

## Part 5: Linting and Formatting

### Backend

**Lint Code**
```bash
yarn lint

# Auto-fix
yarn lint:fix
```

**Format Code**
```bash
yarn format

# Check formatting
yarn format:check
```

### Frontend

**Lint Code**
```bash
yarn lint

# Auto-fix
yarn lint:fix
```

**Format Code**
```bash
yarn format
```

---

## Part 6: Building for Production

### Backend

**Build All Packages**
```bash
yarn build
```

**Build Output**:
```
packages/common/dist/
packages/database/dist/
packages/api/dist/
```

**Test Production Build**
```bash
NODE_ENV=production yarn workspace @bakery-cms/api start
```

### Frontend

**Build for Production**
```bash
yarn build
```

**Build Output**:
```
dist/
├── assets/
├── index.html
└── ...
```

**Preview Production Build**
```bash
yarn preview
```

---

## Troubleshooting

### Backend Issues

**Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution**: Ensure MySQL is running and credentials in `.env` are correct

**Port Already in Use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change `PORT` in `.env` or kill process using port 3000

**Migration Errors**
```
ERROR: Table 'products' already exists
```
**Solution**: Rollback migrations and run again
```bash
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
```

### Frontend Issues

**API Connection Error**
```
Network Error: Failed to fetch
```
**Solution**: Verify backend is running and `VITE_API_BASE_URL` is correct in `.env`

**Module Not Found**
```
Cannot find module '@/components/...'
```
**Solution**: Check import paths and ensure Vite aliases are configured correctly

**Build Errors**
```
TypeScript error in src/...
```
**Solution**: Run `yarn type-check` to see all TypeScript errors

---

## Quick Reference

### Backend Commands
```bash
yarn dev:api           # Start API dev server
yarn build            # Build all packages
yarn test             # Run all tests
yarn test:coverage    # Run tests with coverage
yarn lint             # Lint code
yarn format           # Format code
yarn migrate          # Run database migrations
yarn seed             # Seed database
```

### Frontend Commands
```bash
yarn dev              # Start Vite dev server
yarn build            # Build for production
yarn preview          # Preview production build
yarn test             # Run tests
yarn test:coverage    # Run tests with coverage
yarn lint             # Lint code
yarn format           # Format code
yarn type-check       # Check TypeScript types
```

### Database Commands
```bash
npx sequelize-cli db:create            # Create database
npx sequelize-cli db:migrate           # Run migrations
npx sequelize-cli db:migrate:undo      # Undo last migration
npx sequelize-cli db:migrate:undo:all  # Undo all migrations
npx sequelize-cli db:seed:all          # Run all seeders
npx sequelize-cli db:seed:undo:all     # Undo all seeders
```

---

## Next Steps

After successfully setting up the infrastructure:

1. **Familiarize with Code Structure**: Explore both repositories
2. **Read Constitution**: Understand project principles in `.specify/memory/constitution.md`
3. **Run Task Generation**: Use `/speckit.tasks` to break down implementation into tasks
4. **Start Implementation**: Begin with core features (products, orders, payments)
5. **Write Tests**: Maintain 80% test coverage as you develop
6. **Review PRs**: Ensure all code follows constitution requirements

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review constitution requirements
3. Consult plan.md for implementation details
4. Check data-model.md for entity specifications

**Development Workflow Reference**: `.specify/memory/constitution.md` Section 15
