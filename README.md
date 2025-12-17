# Bakery CMS

A comprehensive Content Management System for bakery businesses, built with modern TypeScript stack for both backend and frontend.

## 🏗️ Project Structure

This is a monorepo containing two main applications:

```
bakery-cms/
├── bakery-cms-api/      # Backend API (Node.js + TypeScript)
├── bakery-cms-web/      # Frontend Web App (React + TypeScript)
├── specs/               # Technical specifications
└── docs/               # Documentation
```

## 📦 Components

### Backend (bakery-cms-api)

TypeScript monorepo with Express.js REST API:

- **API Package**: Express server with products, orders, and payments modules
- **Database Package**: Sequelize models, migrations, and seeders
- **Common Package**: Shared types, enums, and constants

**Tech Stack**:
- Node.js + TypeScript
- Express.js
- Sequelize ORM
- MySQL/MariaDB
- Jest for testing

### Frontend (bakery-cms-web)

React application with TypeScript:

- Component-based architecture (core, features, shared)
- Type-safe API client with Result pattern
- React Router for navigation
- Tailwind CSS for styling

**Tech Stack**:
- React 18
- TypeScript
- Vite
- Axios
- Tailwind CSS
- Vitest for testing

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- Yarn package manager
- MySQL/MariaDB database

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd bakery-cms
```

2. **Install backend dependencies**
```bash
cd bakery-cms-api
yarn install
```

3. **Install frontend dependencies**
```bash
cd bakery-cms-web
yarn install
```

### Configuration

1. **Backend setup**
```bash
cd bakery-cms-api
cp .env.example .env
# Edit .env with your database credentials
```

2. **Frontend setup**
```bash
cd bakery-cms-web
cp .env.example .env
# Edit .env if needed (API URL defaults to http://localhost:3000/api/v1)
```

### Database Setup

```bash
cd bakery-cms-api
# Run migrations
yarn migrate

# Seed sample data (optional)
yarn seed
```

### Running the Applications

**Start Backend** (runs on http://localhost:3000):
```bash
cd bakery-cms-api
yarn dev
```

**Start Frontend** (runs on http://localhost:5173):
```bash
cd bakery-cms-web
yarn dev
```

## 📚 Documentation

- [Backend API Documentation](./bakery-cms-api/docs/API.md)
- [Backend Quickstart Guide](./bakery-cms-api/docs/QUICKSTART.md)
- [Backend Testing Guide](./bakery-cms-api/docs/TESTING_GUIDE.md)
- [Technical Specifications](./specs/001-base-infrastructure-setup/)

## 🧪 Testing

**Backend Tests**:
```bash
cd bakery-cms-api
yarn test
```

**Frontend Tests**:
```bash
cd bakery-cms-web
yarn test
```

## 🏗️ Build

**Backend**:
```bash
cd bakery-cms-api
yarn build
```

**Frontend**:
```bash
cd bakery-cms-web
yarn build
```

## 🌟 Features

### Products Management
- CRUD operations for bakery products
- Support for different business types (Ready-to-Sell, Made-to-Order, Both)
- Product categorization and status management

### Orders Management
- Create and manage customer orders
- Support for temporary and confirmed orders
- Order items with quantity and pricing
- Customer information tracking

### Payments Management
- Payment tracking and status management
- VietQR integration support
- Multiple payment methods (Cash, VietQR, Bank Transfer)

## 🛠️ Development

### Code Style

Both projects use:
- ESLint for linting
- Prettier for code formatting
- TypeScript strict mode

### Architecture Principles

- **Functional Programming**: Pure functions, immutability
- **SOLID Principles**: Single responsibility, dependency injection
- **Result Type Pattern**: Type-safe error handling
- **Repository Pattern**: Clean data access layer

## 📝 API Endpoints

### Products
- `GET /api/v1/products` - List all products
- `GET /api/v1/products/:id` - Get product by ID
- `POST /api/v1/products` - Create new product
- `PATCH /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product

### Orders
- `GET /api/v1/orders` - List all orders
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create new order
- `PATCH /api/v1/orders/:id` - Update order
- `POST /api/v1/orders/:id/confirm` - Confirm order
- `POST /api/v1/orders/:id/cancel` - Cancel order
- `DELETE /api/v1/orders/:id` - Delete order

### Payments
- `GET /api/v1/payments` - List all payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Create new payment
- `POST /api/v1/payments/:id/mark-paid` - Mark payment as paid
- `GET /api/v1/payments/order/:orderId` - Get payment by order ID

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure tests pass
4. Submit a pull request

## 📄 License

[Your License Here]

## 👥 Authors

[Your Name/Team]

## 🔗 Links

- [Repository](https://github.com/yourusername/bakery-cms)
- [Issues](https://github.com/yourusername/bakery-cms/issues)
- [Documentation](./docs)
