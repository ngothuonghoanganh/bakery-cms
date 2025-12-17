# Bakery-CMS Constitution

## 1. Project Overview

**Bakery-CMS** is a Cookie Sales Management Application designed for small businesses and freelancers. It provides a centralized system for managing products, orders, payments, and business analytics with a focus on scalability, maintainability, and code quality.

The project is structured as **two separate repositories**:
- **Backend Repository**: API server with Express.js, MySQL, and Sequelize
- **Frontend Repository**: React application with TypeScript

---

## 2. Repository Structure

### 2.1 Backend Repository (bakery-cms-api)
Monorepo structure containing API services, database, and shared packages.

### 2.2 Frontend Repository (bakery-cms-web)
React application with TypeScript, functional programming approach.

---

## 3. Technology Stack

### 3.1 Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: MySQL
- **Architecture**: Monorepo structure (Turborepo)
- **Package Manager**: Yarn (Berry/v3+)

### 3.2 Frontend
- **Framework**: React.js with TypeScript
- **HTTP Client**: Axios (base configuration)
- **State Management**: React Context API / Zustand
- **Styling**: CSS Modules / Styled Components / Tailwind CSS
- **Architecture**: Component-based with functional programming
- **Package Manager**: Yarn (Berry/v3+)

### 3.3 Infrastructure
- **IaC**: Terraform
- **Deployment**: Cloud-based (AWS/GCP/Azure)
- **CI/CD**: GitHub Actions (separate pipelines per repo)

---

## 4. Backend Core Principles

### 4.1 SOLID Principles (Functional Programming Approach)

#### 4.1.1 Single Responsibility Principle (SRP)
Each function/module has one reason to change:
- **Handlers**: Handle HTTP requests/responses only
- **Services**: Contain business logic as pure functions
- **Repositories**: Handle data access through functional composition
- **Validators**: Validate input data using composable validation functions
- **Mappers**: Transform data between layers using pure functions

**Example:**
```typescript
// ✅ GOOD: Separated responsibilities using functional composition
const validateOrderData = (data: unknown): CreateOrderDTO => { /* ... */ };
const createOrderService = (orderRepo: OrderRepository) => 
  async (data: CreateOrderDTO): Promise<Order> => { /* ... */ };
const orderToDTO = (order: Order): OrderResponseDTO => ({ /* ... */ });
```

#### 4.1.2 Open/Closed Principle (OCP)
Functions are open for extension but closed for modification:
- Use **Higher-Order Functions** for payment methods
- Use **Factory Functions** for order type creation
- Use middleware composition for cross-cutting concerns

#### 4.1.3 Liskov Substitution Principle (LSP)
Functions with the same signature can be substituted:
- Consistent function signatures across implementations
- Composable repository functions
- Polymorphic handlers through function types

#### 4.1.4 Interface Segregation Principle (ISP)
Functions should not depend on operations they don't use:
- Separate read and write repository functions
- Specific function types for different features

#### 4.1.5 Dependency Inversion Principle (DIP)
Depend on abstractions (function types), not concretions:
- Use dependency injection through function parameters
- Repository pattern using function types
- Service composition through higher-order functions

### 4.2 Functional Programming Principles (NON-NEGOTIABLE)

#### 4.2.1 Pure Functions
- Functions must be deterministic and side-effect free when possible
- All dependencies passed as parameters
- No external state mutation

#### 4.2.2 Immutability
- Prefer immutable data structures
- Use spread operators and array methods that return new arrays
- Never mutate function parameters

#### 4.2.3 Function Composition
- Build complex operations from simple functions
- Use pipe/compose utilities for readable data transformations
- Keep functions small and focused

#### 4.2.4 Higher-Order Functions
- Functions that take or return functions
- Use for middleware, decorators, and strategy patterns
- Factory functions for dependency injection

#### 4.2.5 Type-Driven Development
- Define types first, implementation follows
- Prefer `type` over `interface` for consistency
- Let TypeScript's type system guide implementation
- Use discriminated unions for error handling

---

## 5. Frontend Core Principles

### 5.1 React Component Architecture (NON-NEGOTIABLE)

#### 5.1.1 Component Types
All components must fall into one of three categories:

**1. Core Components**
- Atomic UI elements (buttons, inputs, cards, modals)
- No business logic
- Highly reusable across the application
- Accept props for customization
- Pure and presentational

**Example:**
```typescript
// ✅ Core Component
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
};

export const Button = ({ variant, size, onClick, children, disabled }: ButtonProps) => (
  <button
    className={`btn btn-${variant} btn-${size}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);
```

**2. Shared Components**
- Composite components combining core components
- Reusable across multiple features
- May contain presentational logic
- Accept data via props
- No direct API calls

**Example:**
```typescript
// ✅ Shared Component
type ProductCardProps = {
  product: Product;
  onAddToCart: (productId: string) => void;
  onViewDetails: (productId: string) => void;
};

export const ProductCard = ({ product, onAddToCart, onViewDetails }: ProductCardProps) => {
  return (
    <Card>
      <Image src={product.imageUrl} alt={product.name} />
      <CardBody>
        <Heading>{product.name}</Heading>
        <Text>{product.description}</Text>
        <Price amount={product.price} />
        <Button variant="primary" onClick={() => onAddToCart(product.id)}>
          Add to Cart
        </Button>
        <Button variant="secondary" onClick={() => onViewDetails(product.id)}>
          View Details
        </Button>
      </CardBody>
    </Card>
  );
};
```

**3. Detail Components (Feature Components)**
- Feature-specific components
- Contain business logic and data fetching
- Use shared and core components
- Handle API calls via services
- Manage local state

**Example:**
```typescript
// ✅ Detail Component
type ProductListProps = {
  categoryId?: string;
};

export const ProductList = ({ categoryId }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const result = await productService.getProducts({ categoryId });
      
      if (result.success) {
        setProducts(result.data);
      } else {
        setError(result.error.message);
      }
      
      setLoading(false);
    };

    fetchProducts();
  }, [categoryId]);

  const handleAddToCart = async (productId: string) => {
    await cartService.addItem(productId);
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <Grid>
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onViewDetails={(id) => navigate(`/products/${id}`)}
        />
      ))}
    </Grid>
  );
};
```

#### 5.1.2 Component Organization
```
src/
├── components/
│   ├── core/                    # Core components (atomic)
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts
│   │   │   ├── Button.styles.ts
│   │   │   └── Button.test.tsx
│   │   ├── Input/
│   │   ├── Card/
│   │   ├── Modal/
│   │   └── index.ts
│   │
│   ├── shared/                  # Shared components (composite)
│   │   ├── ProductCard/
│   │   ├── OrderSummary/
│   │   ├── PaymentForm/
│   │   └── index.ts
│   │
│   └── features/                # Detail components (feature-specific)
│       ├── products/
│       │   ├── ProductList/
│       │   ├── ProductDetail/
│       │   └── ProductFilter/
│       ├── orders/
│       │   ├── OrderList/
│       │   ├── OrderDetail/
│       │   └── CreateOrder/
│       └── payments/
│           ├── PaymentProcess/
│           └── PaymentHistory/
```

### 5.2 Functional Programming in React (NON-NEGOTIABLE)

#### 5.2.1 Functional Components Only
- No class components
- Use React Hooks for state and lifecycle
- Pure functional components when possible

```typescript
// ✅ GOOD: Functional component
type UserProfileProps = {
  userId: string;
};

export const UserProfile = ({ userId }: UserProfileProps) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <Spinner />;
  
  return <div>{user.name}</div>;
};

// ❌ BAD: Class component
class UserProfile extends React.Component {
  // Not allowed
}
```

#### 5.2.2 Immutable State Updates
```typescript
// ✅ GOOD: Immutable state updates
const [order, setOrder] = useState<Order>(initialOrder);

const addItem = (item: OrderItem) => {
  setOrder(prevOrder => ({
    ...prevOrder,
    items: [...prevOrder.items, item],
    totalAmount: prevOrder.totalAmount + item.subtotal,
  }));
};

const removeItem = (itemId: string) => {
  setOrder(prevOrder => ({
    ...prevOrder,
    items: prevOrder.items.filter(item => item.id !== itemId),
  }));
};

// ❌ BAD: Mutable state updates
const addItemBad = (item: OrderItem) => {
  order.items.push(item);  // Mutates state
  setOrder(order);
};
```

#### 5.2.3 Custom Hooks for Reusability
```typescript
// ✅ GOOD: Custom hooks
const useProducts = (filters?: ProductFilters) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await productService.getProducts(filters);
        if (result.success) {
          setProducts(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  return { products, loading, error };
};

// Usage
const ProductList = () => {
  const { products, loading, error } = useProducts({ category: 'cookies' });
  // ...
};
```

### 5.3 Data Model from API Response

#### 5.3.1 Response to Domain Model Mapping
All API responses must be transformed to domain models:

```typescript
// API Response type
type ProductAPIResponse = {
  id: string;
  product_name: string;
  product_price: number;
  created_at: string;
  updated_at: string;
};

// Domain Model type
type Product = {
  id: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
};

// Mapper function
const mapProductFromAPI = (response: ProductAPIResponse): Product => ({
  id: response.id,
  name: response.product_name,
  price: response.product_price,
  createdAt: new Date(response.created_at),
  updatedAt: new Date(response.updated_at),
});

// Service layer handles mapping
const productService = {
  getProducts: async (): Promise<Result<Product[]>> => {
    try {
      const response = await api.get<ProductAPIResponse[]>('/products');
      const products = response.data.map(mapProductFromAPI);
      return ok(products);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },
};
```

#### 5.3.2 Data Model Organization
```
src/
├── types/
│   ├── api/                     # API response types
│   │   ├── product.api.ts
│   │   ├── order.api.ts
│   │   └── payment.api.ts
│   │
│   ├── models/                  # Domain models
│   │   ├── product.model.ts
│   │   ├── order.model.ts
│   │   └── payment.model.ts
│   │
│   └── mappers/                 # API to Model mappers
│       ├── product.mapper.ts
│       ├── order.mapper.ts
│       └── payment.mapper.ts
```

#### 5.3.3 Type-Safe API Client (Axios)
```typescript
// api/client.ts
import axios, { AxiosInstance } from 'axios';

type APIConfig = {
  baseURL: string;
  timeout: number;
};

export const createAPIClient = (config: APIConfig): AxiosInstance => {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// api/services/product.service.ts
type ProductService = {
  getProducts: (filters?: ProductFilters) => Promise<Result<Product[]>>;
  getProductById: (id: string) => Promise<Result<Product>>;
  createProduct: (data: CreateProductDTO) => Promise<Result<Product>>;
};

export const createProductService = (client: AxiosInstance): ProductService => ({
  getProducts: async (filters) => {
    try {
      const response = await client.get<ProductAPIResponse[]>('/products', {
        params: filters,
      });
      const products = response.data.map(mapProductFromAPI);
      return ok(products);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },

  getProductById: async (id) => {
    try {
      const response = await client.get<ProductAPIResponse>(`/products/${id}`);
      const product = mapProductFromAPI(response.data);
      return ok(product);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },

  createProduct: async (data) => {
    try {
      const response = await client.post<ProductAPIResponse>('/products', data);
      const product = mapProductFromAPI(response.data);
      return ok(product);
    } catch (error) {
      return err(handleAPIError(error));
    }
  },
});
```

### 5.4 Frontend Type Standards

#### 5.4.1 TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

#### 5.4.2 Prefer Type over Interface
```typescript
// ✅ GOOD: Use type
type Product = {
  id: string;
  name: string;
  price: number;
};

type ProductWithCategory = Product & {
  category: Category;
};

// ✅ GOOD: Union types
type OrderStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

// ❌ BAD: interface (unless extending library types)
interface Product {
  id: string;
  name: string;
}
```

---

## 6. Backend Code Quality Standards (NON-NEGOTIABLE)

### 6.1 TypeScript Standards
1. **Strict Mode**: Always enabled (`strict: true` in tsconfig.json)
2. **Type Definitions**: Use `type` over `interface` except when extending library types
3. **No `any`**: Prohibited except in rare, documented cases
4. **Explicit Return Types**: All public functions must declare return types
5. **Enums and Constants**: Use `enum` for related constant groups, `const` for immutable single values

**Example:**
```typescript
// ✅ GOOD: Use enum for related constant groups
enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

enum PaymentMethod {
  VIETQR = 'vietqr',
  CASH = 'cash',
  BANK_TRANSFER = 'bank-transfer',
}

// ✅ GOOD: Use const for single immutable values
const MAX_ORDER_ITEMS = 100;
const DEFAULT_PAGE_SIZE = 20;
const API_VERSION = 'v1';

// ✅ GOOD: Use const with as const for immutable objects
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
} as const;

const ERROR_MESSAGES = {
  INVALID_ORDER: 'Invalid order data',
  PRODUCT_NOT_FOUND: 'Product not found',
  INSUFFICIENT_STOCK: 'Insufficient stock',
} as const;

// ✅ GOOD: Use union types for string literals (alternative to enum)
type OrderStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled';

// ❌ BAD: Using magic strings/numbers
if (order.status === 'paid') { /* ... */ }  // Should use enum or constant

// ❌ BAD: Mutable constants
const config = { maxItems: 100 };  // Should use as const or freeze
```

### 6.2 Testing Requirements
1. **Test Coverage**: Minimum 80% coverage required
2. **Test Structure**: Arrange-Act-Assert pattern
3. **Unit Tests**: All services and utility functions
4. **Integration Tests**: All API endpoints
5. **Test Isolation**: Mock external dependencies

### 6.3 Code Review Requirements
1. SOLID principles adherence
2. Functional programming patterns
3. Type safety verification
4. Test coverage check
5. Performance considerations
6. Security review

---

## 7. Frontend Code Quality Standards (NON-NEGOTIABLE)

### 7.1 Component Testing
1. **Test Coverage**: Minimum 80% coverage for components
2. **Testing Library**: React Testing Library
3. **Unit Tests**: All custom hooks and utility functions
4. **Component Tests**: All shared and detail components
5. **Integration Tests**: Key user flows

**Example:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button onClick={() => {}}>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button onClick={() => {}} disabled>Click</Button>);
    expect(screen.getByText('Click')).toBeDisabled();
  });
});
```

### 7.2 Code Review Requirements
1. Component type adherence (core/shared/detail)
2. Functional programming patterns
3. Type safety verification
4. Proper data model mapping
5. Immutable state updates
6. Test coverage

### 7.3 Linting and Formatting
- **ESLint**: With React and TypeScript plugins
- **Prettier**: Consistent code formatting
- **Import Order**: Enforced via eslint-plugin-import

---

## 8. Constants and Enums Management

### 6.1 When to Use Enum vs Union Types vs Const

**Use Enum when:**
- Values are related and form a closed set
- Need reverse mapping (value to key)
- Values might be used in switch statements
- Clear semantic grouping exists

```typescript
// ✅ Use enum for status workflows
enum OrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

enum PaymentMethod {
  VIETQR = 'vietqr',
  CASH = 'cash',
  BANK_TRANSFER = 'bank-transfer',
}

enum BusinessType {
  MADE_TO_ORDER = 'made-to-order',
  READY_TO_SELL = 'ready-to-sell',
  BOTH = 'both',
}
```

**Use Union Types when:**
- Simple string/number literals
- Type-only definitions (no runtime value needed)
- More type flexibility required

```typescript
// ✅ Use union types for simple literals
type OrderType = 'temporary' | 'official';
type ProductStatus = 'available' | 'out-of-stock';
type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNAUTHORIZED';
```

**Use Const with `as const` when:**
- Configuration values
- API endpoints
- Error messages
- Fixed numerical values

```typescript
// ✅ Use const for configuration
const CONFIG = {
  MAX_ORDER_ITEMS: 100,
  MIN_ORDER_AMOUNT: 1000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SESSION_TIMEOUT: 3600,
} as const;

const API_ROUTES = {
  ORDERS: '/api/v1/orders',
  PRODUCTS: '/api/v1/products',
  PAYMENTS: '/api/v1/payments',
  STATISTICS: '/api/v1/statistics',
} as const;

const ERROR_MESSAGES = {
  INVALID_ORDER: 'Invalid order data provided',
  PRODUCT_NOT_FOUND: 'Product not found',
  INSUFFICIENT_STOCK: 'Insufficient stock available',
  PAYMENT_FAILED: 'Payment processing failed',
} as const;
```

### 6.2 Constants Organization Structure

```
packages/common/src/
├── constants/
│   ├── index.ts              # Re-export all constants
│   ├── config.constants.ts   # App configuration
│   ├── http.constants.ts     # HTTP status codes, headers
│   ├── api.constants.ts      # API routes, versions
│   ├── error.constants.ts    # Error messages, codes
│   └── business.constants.ts # Business rules, limits
└── enums/
    ├── index.ts              # Re-export all enums
    ├── order.enums.ts        # Order-related enums
    ├── payment.enums.ts      # Payment-related enums
    └── product.enums.ts      # Product-related enums
```

### 6.3 Constants Naming Conventions

```typescript
// ✅ GOOD: SCREAMING_SNAKE_CASE for constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const API_BASE_URL = process.env.API_BASE_URL!;

// ✅ GOOD: PascalCase for enums
enum OrderStatus { /* ... */ }
enum PaymentMethod { /* ... */ }

// ✅ GOOD: SCREAMING_SNAKE_CASE for enum values
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
}

// ❌ BAD: Inconsistent naming
const maxRetries = 3;  // Should be MAX_RETRIES
const TimeOut = 5000;  // Should be TIMEOUT or TIMEOUT_MS
```

### 6.4 Immutability Enforcement

```typescript
// ✅ GOOD: Deep readonly with as const
const DATABASE_CONFIG = {
  host: 'localhost',
  port: 3306,
  options: {
    poolSize: 10,
    timeout: 30000,
  },
} as const;

// ✅ GOOD: Object.freeze for runtime immutability
const ALLOWED_ORIGINS = Object.freeze([
  'https://app.example.com',
  'https://admin.example.com',
]);

// ✅ GOOD: Readonly arrays
const SUPPORTED_PAYMENT_METHODS = [
  'vietqr',
  'cash',
  'bank-transfer',
] as const;

type PaymentMethod = typeof SUPPORTED_PAYMENT_METHODS[number];

// ❌ BAD: Mutable constants
const config = { maxItems: 100 };
config.maxItems = 200;  // Should not be allowed
```

### 6.5 Constants Usage Examples

```typescript
// ✅ GOOD: Using enums in functions
const getOrderStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.DRAFT:
      return 'Draft';
    case OrderStatus.CONFIRMED:
      return 'Confirmed';
    case OrderStatus.PAID:
      return 'Paid';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
    default:
      const _exhaustive: never = status;
      throw new Error(`Unhandled status: ${_exhaustive}`);
  }
};

// ✅ GOOD: Using constants for validation
const validateOrderItems = (items: OrderItem[]): Result<void> => {
  if (items.length > CONFIG.MAX_ORDER_ITEMS) {
    return err(createValidationError(
      `Order cannot have more than ${CONFIG.MAX_ORDER_ITEMS} items`
    ));
  }
  
  if (items.length === 0) {
    return err(createValidationError('Order must have at least one item'));
  }
  
  return ok(undefined);
};

// ✅ GOOD: Using constants for error messages
const handleProductNotFound = (productId: string): AppError => 
  createNotFoundError(ERROR_MESSAGES.PRODUCT_NOT_FOUND, { productId });
```

### 6.6 Environment-Specific Constants

```typescript
// ✅ GOOD: Environment-based configuration
const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

const RATE_LIMIT = {
  WINDOW_MS: ENV.IS_PRODUCTION ? 15 * 60 * 1000 : 60 * 1000,
  MAX_REQUESTS: ENV.IS_PRODUCTION ? 100 : 1000,
} as const;

// ✅ GOOD: Feature flags as constants
const FEATURE_FLAGS = {
  ENABLE_VIETQR_PAYMENT: process.env.ENABLE_VIETQR === 'true',
  ENABLE_STATISTICS: process.env.ENABLE_STATISTICS !== 'false',
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL === 'true',
} as const;
```

---

## 9. Backend Architecture Constraints

### 9.1 Monorepo Structure
```
packages/
├── api/              # Express.js API server
├── common/           # Shared types and constants
└── database/         # Database models and migrations
```

### 9.2 Module Organization
Each module must contain:
- `handlers/` - Request handlers (controllers)
- `services/` - Business logic functions
- `repositories/` - Data access functions
- `validators/` - Validation functions
- `dto/` - Data transfer types
- `mappers/` - Transformation functions
- `types/` - Domain types
- `tests/` - Test files

### 9.3 Layered Architecture
1. **Presentation Layer**: Handlers, middleware
2. **Application Layer**: Services, business logic
3. **Domain Layer**: Types, entities, DTOs
4. **Infrastructure Layer**: Repositories, database, external services

---

## 10. Data Management

### 10.1 Database Standards
- **ORM**: Sequelize only
- **Migrations**: All schema changes via migrations
- **Transactions**: Required for multi-step operations
- **Indexing**: All foreign keys and frequently queried columns

### 10.2 Data Models
Core entities:
- **Product**: Product catalog with business types
- **Order**: Orders with support for temporary/official types
- **OrderItem**: Line items for orders
- **Payment**: Payment tracking with VietQR support

### 10.3 Data Validation
- Input validation at handler level
- Business rule validation in services
- Database constraints for data integrity
- Type validation through TypeScript

---

## 11. Security Requirements (NON-NEGOTIABLE)

### 11.1 Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing (bcrypt, min 10 rounds)

### 11.2 Data Protection
- Input validation and sanitization (all endpoints)
- SQL injection prevention (parameterized queries only)
- XSS protection (helmet middleware required)
- Rate limiting (100 requests per 15 minutes per IP)
- CORS configuration (whitelist only)

### 11.3 Secrets Management
- No secrets in code or version control
- Environment variables only
- Separate configs per environment (dev/staging/prod)

---

## 12. Performance Standards

### 12.1 Response Time Targets
- **API Endpoints**: < 200ms (p95)
- **Database Queries**: < 100ms (p95)
- **External API Calls**: < 500ms with timeout

### 12.2 Optimization Requirements
- Database indexing on all foreign keys
- Connection pooling enabled
- Response compression (gzip)
- Pagination for list endpoints (max 100 items)
- Caching for frequently accessed data (Redis)

### 12.3 Scalability
- Stateless API design (horizontal scaling ready)
- Database read replicas for reporting
- Async job processing for heavy operations
- CDN for static assets

---

## 13. CI/CD & Deployment

### 13.1 CI/CD Pipeline Requirements
```yaml
Required Steps:
1. Lint check (ESLint)
2. Type check (tsc)
3. Unit tests (Jest)
4. Integration tests
5. Build verification
6. Deployment (on main branch only)
```

### 13.2 Deployment Standards
- **Infrastructure as Code**: Terraform only
- **Environments**: dev, staging, production
- **Zero-downtime deployments**: Blue-green or rolling updates
- **Rollback capability**: Must be tested and documented

### 13.3 Monitoring Requirements
- Health check endpoints (`/health`, `/ready`)
- Application metrics (request rate, error rate, latency)
- Error tracking and alerting
- Structured logging (JSON format)

---

## 14. Documentation Requirements

### 14.1 Code Documentation
- JSDoc for all public functions
- README.md in each package
- Architecture diagrams (sequence, data flow)
- API documentation (OpenAPI/Swagger)

### 14.2 Process Documentation
- Setup instructions (README.md in root)
- Development workflow guide
- Deployment procedures
- Troubleshooting guide

---

## 15. Development Workflow

### 15.1 Git Strategy
- **main**: Production-ready code only
- **develop**: Integration branch
- **feature/***: Feature branches (from develop)
- **bugfix/***: Bug fix branches
- **hotfix/***: Emergency fixes (from main)

### 15.2 Commit Standards
- Conventional commits format
- Clear, descriptive messages
- Reference issue numbers
- Small, focused commits

### 15.3 Pull Request Requirements
- All tests passing
- Code review approval (minimum 1)
- No merge conflicts
- Updated documentation if needed

---

## 16. Error Handling

### 16.1 Error Types
```typescript
type ErrorCode = 
  | 'VALIDATION_ERROR' 
  | 'NOT_FOUND' 
  | 'UNAUTHORIZED' 
  | 'INTERNAL_ERROR';

type AppError = {
  code: ErrorCode;
  statusCode: number;
  message: string;
  isOperational: boolean;
  details?: unknown;
};
```

### 16.2 Error Response Format
```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": { "field": "email", "issue": "Invalid format" }
}
```

### 16.3 Error Handling Strategy
- Use Result type for expected errors
- Global error handler for unexpected errors
- Structured error logging
- Never expose internal errors to clients

---

## 17. Governance

### 17.1 Constitution Authority
- This constitution supersedes all other practices
- All code must comply with these principles
- Violations must be justified and documented
- Amendments require team consensus

### 17.2 Compliance Verification
- All PRs must verify compliance
- Code reviews enforce constitution
- Automated checks where possible (linting, tests)
- Regular architecture reviews

### 17.3 Amendment Process
1. Propose change with rationale
2. Team discussion and consensus
3. Update constitution document
4. Migration plan if needed
5. Update version and date

---

## 18. Success Metrics

### 18.1 Technical Metrics
- **Code Coverage**: > 80%
- **API Response Time**: < 200ms (p95)
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%
- **Build Time**: < 5 minutes

### 18.2 Quality Metrics
- **Code Review Turnaround**: < 24 hours
- **Bug Resolution Time**: < 48 hours
- **Zero Critical Security Vulnerabilities**
- **Dependency Updates**: Monthly

---

## 19. Key Development Philosophies

1. **Functional First**: Prefer pure functions, immutability, and composition over classes and mutation (Backend & Frontend)
2. **Type-Driven**: Use TypeScript's type system (with `type` over `interface`) to guide implementation (Backend & Frontend)
3. **Composability**: Build complex features from small, reusable functions (Backend & Frontend)
4. **Yarn Package Management**: Use Yarn for deterministic dependency management (Backend & Frontend)
5. **Component Clarity**: Maintain clear separation between core, shared, and detail components (Frontend)
6. **Data Model Transformation**: Always transform API responses to domain models (Frontend)
7. **Test-Driven**: Write tests first, implementation second (Backend & Frontend)
8. **Security-First**: Security considerations in every design decision (Backend & Frontend)
9. **Performance-Aware**: Performance optimization from the start (Backend & Frontend)

---

**Version**: 1.0  
**Ratified**: December 16, 2025  
**Last Amended**: December 16, 2025  
**Architecture**: Functional Programming with TypeScript (Backend & Frontend)  
**Repositories**: Two separate repos (bakery-cms-api & bakery-cms-web)  
**Maintained By**: Development Team
