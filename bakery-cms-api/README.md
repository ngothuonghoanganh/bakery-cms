# Bakery CMS Backend API

> Cookie Sales Management System - Backend API

A scalable, type-safe backend API for managing cookie sales operations, built with functional programming principles and modern TypeScript.

## 🏗️ Architecture Overview

### Technology Stack

- **Runtime**: Node.js 16+
- **Language**: TypeScript 5.3+ (strict mode)
- **Framework**: Express.js 4.18
- **Database**: MySQL 8.0 (Sequelize ORM)
- **Testing**: Jest 29
- **Validation**: Joi
- **Logging**: Winston
- **Package Manager**: Yarn 1.22+

### Project Structure

```
bakery-cms-api/
├── packages/
│   ├── common/          # Shared types, enums, constants
│   ├── database/        # Database models, migrations, seeders
│   └── api/             # REST API application
│       ├── src/
│       │   ├── config/       # Configuration management
│       │   ├── middleware/   # Express middleware
│       │   ├── modules/      # Feature modules
│       │   │   ├── products/ # Products CRUD
│       │   │   ├── orders/   # Orders management
│       │   │   └── payments/ # Payments & VietQR
│       │   └── utils/        # Utilities & helpers
│       └── tests/       # Integration tests
├── .github/
│   └── workflows/       # CI/CD pipelines
└── docs/                # Documentation
```

### Design Principles

- **Functional Programming**: Pure functions, immutability, composition
- **SOLID Principles**: SRP, OCP, DIP throughout codebase
- **Result Type**: Explicit error handling with neverthrow
- **Dependency Injection**: All layers use DI for testability
- **Type Safety**: Strict TypeScript with no `any` types

### Key Features

- ✅ **RESTful API** with Express.js
- ✅ **Type-safe Database** with Sequelize ORM and TypeScript
- ✅ **Soft Delete** on all entities (Products, Orders, Payments)
- ✅ **Cascade Operations** for Order deletion (Order → Items → Payment)
- ✅ **VietQR Integration** for Vietnamese payment QR codes
- ✅ **Comprehensive Logging** with Winston
- ✅ **Input Validation** with Joi schemas
- ✅ **Error Handling** with Result type pattern
- ✅ **Test Coverage** with Jest (80% threshold)
- ✅ **CI/CD Pipeline** with GitHub Actions

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher (required for latest dependencies)
- Yarn 1.22.0 or higher
- MySQL 8.0 or higher
- Git

> **Note**: Node.js 16 may work but some optional dependencies (like Swagger) require Node 18+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/bakery-cms-api.git
cd bakery-cms-api
```

2. Install dependencies:
```bash
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up database:
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE bakery_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
yarn migrate

# Seed sample data (optional)
yarn seed
```

5. Start development server:
```bash
yarn dev
```

The API will be available at `http://localhost:3000`

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bakery_db
DB_USER=root
DB_PASSWORD=your_password
DB_SSL=false

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# API
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## 🧪 Testing

### Run all tests
```bash
yarn test
```

### Run tests with coverage
```bash
yarn test:coverage
```

### Run tests in watch mode
```bash
yarn test --watch
```

### Coverage requirements
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## 📦 Available Scripts

```bash
# Development
yarn dev              # Start development server with hot-reload

# Building
yarn build            # Build all packages for production
yarn clean            # Remove build artifacts

# Code Quality
yarn lint             # Run ESLint
yarn format           # Format code with Prettier
yarn type-check       # Run TypeScript compiler check

# Database
yarn migrate          # Run database migrations
yarn migrate:undo     # Rollback last migration
yarn seed             # Seed database with sample data
yarn seed:undo        # Undo all seeders

# Testing
yarn test             # Run all tests
yarn test:coverage    # Run tests with coverage report
```

## 🌐 API Endpoints

### Products Module

```
GET    /api/products           # List products (with pagination & filters)
GET    /api/products/:id       # Get product by ID
POST   /api/products           # Create new product
PATCH  /api/products/:id       # Update product
DELETE /api/products/:id       # Delete product
```

### Orders Module

```
GET    /api/orders             # List orders (with pagination & filters)
GET    /api/orders/:id         # Get order by ID with items
POST   /api/orders             # Create new order
PATCH  /api/orders/:id         # Update order
POST   /api/orders/:id/confirm # Confirm order
POST   /api/orders/:id/cancel  # Cancel order
DELETE /api/orders/:id         # Delete draft order (soft delete + cascade)
```

**Soft Delete Behavior:**
- DELETE operations mark records as deleted (not permanent)
- Deleting an Order cascades to OrderItems and Payment
- Only DRAFT orders can be deleted
- Deleted records can be restored via admin operations

### Payments Module

```
GET    /api/payments                   # List payments (with filters)
GET    /api/payments/:id               # Get payment by ID
GET    /api/payments/order/:orderId    # Get payment by order ID
GET    /api/payments/order/:orderId/vietqr  # Generate VietQR
POST   /api/payments                   # Create payment
POST   /api/payments/:id/mark-paid     # Mark payment as paid
```

### System

```
GET    /health                 # Health check endpoint
```

## 📊 Database Schema

### Products
- Product catalog with pricing
- Business types: Made-to-Order, Ready-to-Sell, Both
- Status tracking: Available, Out of Stock
- **Soft delete enabled** with deletedAt timestamp

### Orders
- Order management with items
- Order number format: ORD-YYYYMMDD-XXXX
- Status flow: Draft → Confirmed → Paid → Cancelled
- Automatic total calculation
- **Soft delete with cascade** to OrderItems and Payment

### OrderItems
- Line items for each order
- Tracks product, quantity, price, subtotal
- **Soft delete enabled** (cascades from Order)

### Payments
- Payment tracking per order
- **Soft delete enabled** with recovery capability
- Methods: VietQR, Cash, Bank Transfer
- VietQR code generation
- Status flow: Pending → Paid/Failed/Cancelled

## 🔐 Authentication & Authorization

> **Note**: Authentication is planned for future implementation.

The current version focuses on core business logic. JWT-based authentication will be added in a future release.

## 🛡️ Security

- Helmet.js for security headers
- Rate limiting on all endpoints
- Input validation with Joi
- SQL injection prevention via Sequelize
- CORS configuration
- Environment-based secrets

## 🚀 Deployment

### Using Docker

```bash
# Build image
docker build -t bakery-cms-api .

# Run container
docker run -p 3000:3000 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  bakery-cms-api
```

### Using PM2

```bash
# Build application
yarn build

# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 logs bakery-cms-api
```

### CI/CD

GitHub Actions workflows are configured for:
- **CI**: Lint, type-check, test, build on every push
- **CD**: Deploy to staging/production on main branch

See `.github/workflows/` for details.

## 🧩 Module Architecture

Each feature module follows a layered architecture:

```
modules/[feature]/
├── dto/              # Data Transfer Objects
├── validators/       # Joi validation schemas
├── mappers/          # Entity ↔ DTO transformations
├── repositories/     # Data access layer
├── services/         # Business logic layer
├── handlers/         # HTTP request handlers
├── routes.ts         # Express router
└── tests/            # Unit & integration tests
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow functional programming principles
- Use pure functions wherever possible
- No `any` types - strict TypeScript
- Write tests for all new features
- Maintain 80%+ code coverage

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 👥 Authors

- Bakery CMS Team

## 🙏 Acknowledgments

- Express.js community
- Sequelize ORM
- TypeScript team
- All contributors

## 📞 Support

For support, email support@bakery-cms.com or open an issue on GitHub.

---

**Built with ❤️ using TypeScript and Functional Programming**
