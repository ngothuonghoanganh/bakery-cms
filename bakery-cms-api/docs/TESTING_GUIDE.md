# Backend Testing Guide

This guide explains how to write tests for the Bakery CMS API using the established patterns.

## Test Structure

Each module should have tests for:
1. **Mappers**: Pure function transformation tests
2. **Validators**: Joi schema validation tests
3. **Repositories**: Database access layer tests (with mocks)
4. **Services**: Business logic tests (with mocked repositories)
5. **Handlers**: HTTP endpoint tests (with mocked services)

## Example: Products Module

### 1. Mapper Tests ✅ (Already Created)

**File**: `packages/api/src/modules/products/mappers/products.mappers.test.ts`

**Pattern**:
```typescript
describe('MapperFunction', () => {
  it('should handle happy path', () => {
    const input = createTestData();
    const result = mapperFunction(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle edge case', () => {
    const input = createEdgeCaseData();
    const result = mapperFunction(input);
    expect(result).toEqual(expectedEdgeCaseOutput);
  });
});
```

**Coverage**:
- ✅ All transformation functions
- ✅ Null/undefined handling
- ✅ Default values
- ✅ Empty arrays/objects
- ✅ Type conversions

### 2. Validator Tests (To Be Created)

**File**: `packages/api/src/modules/products/validators/products.validators.test.ts`

**Pattern**:
```typescript
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productParamsSchema,
} from './products.validators';

describe('createProductSchema', () => {
  it('should validate valid product creation data', () => {
    const validData = {
      name: 'Chocolate Chip Cookie',
      description: 'Delicious cookies',
      businessType: 'BOTH',
      pricePerDozenMade: 50000,
      pricePerDozenReady: 45000,
      status: 'AVAILABLE',
    };

    const { error, value } = createProductSchema.validate(validData);
    
    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it('should reject empty name', () => {
    const invalidData = {
      name: '',
      businessType: 'BOTH',
    };

    const { error } = createProductSchema.validate(invalidData);
    
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('name');
  });

  it('should reject invalid business type', () => {
    const invalidData = {
      name: 'Test Product',
      businessType: 'INVALID',
    };

    const { error } = createProductSchema.validate(invalidData);
    
    expect(error).toBeDefined();
    expect(error?.details[0].path).toContain('businessType');
  });

  it('should require pricePerDozenMade for MADE_TO_ORDER', () => {
    const invalidData = {
      name: 'Test Product',
      businessType: 'MADE_TO_ORDER',
      // Missing pricePerDozenMade
    };

    const { error } = createProductSchema.validate(invalidData);
    
    expect(error).toBeDefined();
  });

  it('should set default status to AVAILABLE', () => {
    const data = {
      name: 'Test Product',
      businessType: 'BOTH',
      pricePerDozenMade: 50000,
      pricePerDozenReady: 45000,
    };

    const { error, value } = createProductSchema.validate(data);
    
    expect(error).toBeUndefined();
    expect(value.status).toBe('AVAILABLE');
  });
});

describe('updateProductSchema', () => {
  it('should validate partial updates', () => {
    const validData = {
      name: 'Updated Name',
    };

    const { error, value } = updateProductSchema.validate(validData);
    
    expect(error).toBeUndefined();
    expect(value).toEqual(validData);
  });

  it('should allow empty update (all fields optional)', () => {
    const { error } = updateProductSchema.validate({});
    
    expect(error).toBeUndefined();
  });
});

describe('productQuerySchema', () => {
  it('should validate valid query parameters', () => {
    const validQuery = {
      page: '1',
      limit: '10',
      search: 'cookie',
      status: 'AVAILABLE',
    };

    const { error, value } = productQuerySchema.validate(validQuery);
    
    expect(error).toBeUndefined();
    expect(value.page).toBe(1); // Converted to number
    expect(value.limit).toBe(10); // Converted to number
  });

  it('should set default page and limit', () => {
    const { error, value } = productQuerySchema.validate({});
    
    expect(error).toBeUndefined();
    expect(value.page).toBe(1);
    expect(value.limit).toBe(10);
  });

  it('should enforce max limit of 100', () => {
    const query = { limit: '200' };

    const { error, value } = productQuerySchema.validate(query);
    
    expect(error).toBeUndefined();
    expect(value.limit).toBeLessThanOrEqual(100);
  });
});

describe('productParamsSchema', () => {
  it('should validate valid product ID', () => {
    const validParams = { id: '1' };

    const { error, value } = productParamsSchema.validate(validParams);
    
    expect(error).toBeUndefined();
    expect(value.id).toBe(1); // Converted to number
  });

  it('should reject non-numeric ID', () => {
    const invalidParams = { id: 'abc' };

    const { error } = productParamsSchema.validate(invalidParams);
    
    expect(error).toBeDefined();
  });

  it('should reject negative ID', () => {
    const invalidParams = { id: '-1' };

    const { error } = productParamsSchema.validate(invalidParams);
    
    expect(error).toBeDefined();
  });
});
```

### 3. Repository Tests (To Be Created)

**File**: `packages/api/src/modules/products/repositories/products.repository.test.ts`

**Pattern**: Mock Sequelize models

```typescript
import { Product } from '@bakery-cms/database';
import {
  findProductById,
  findAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  countProducts,
} from './products.repository';

// Mock the Product model
jest.mock('@bakery-cms/database', () => ({
  Product: {
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    count: jest.fn(),
  },
}));

describe('ProductsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        businessType: 'BOTH',
        toJSON: jest.fn().mockReturnThis(),
      };

      (Product.findByPk as jest.Mock).mockResolvedValue(mockProduct);

      const result = await findProductById(1);

      expect(Product.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockProduct);
    });

    it('should return null when not found', async () => {
      (Product.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await findProductById(999);

      expect(Product.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });

  describe('findAllProducts', () => {
    it('should return paginated products', async () => {
      const mockResponse = {
        rows: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ],
        count: 2,
      };

      (Product.findAndCountAll as jest.Mock).mockResolvedValue(mockResponse);

      const result = await findAllProducts({ page: 1, limit: 10 });

      expect(Product.findAndCountAll).toHaveBeenCalled();
      expect(result.rows).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should apply search filter', async () => {
      const mockResponse = { rows: [], count: 0 };
      (Product.findAndCountAll as jest.Mock).mockResolvedValue(mockResponse);

      await findAllProducts({ page: 1, limit: 10, search: 'cookie' });

      expect(Product.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object), // Op.like with %cookie%
          }),
        })
      );
    });

    it('should apply status filter', async () => {
      const mockResponse = { rows: [], count: 0 };
      (Product.findAndCountAll as jest.Mock).mockResolvedValue(mockResponse);

      await findAllProducts({ 
        page: 1, 
        limit: 10, 
        status: 'AVAILABLE' 
      });

      expect(Product.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'AVAILABLE',
          }),
        })
      );
    });
  });

  describe('createProduct', () => {
    it('should create and return new product', async () => {
      const newProductData = {
        name: 'New Product',
        businessType: 'BOTH' as const,
        pricePerDozenMade: 50000,
        pricePerDozenReady: 45000,
      };

      const mockCreatedProduct = {
        id: 1,
        ...newProductData,
        toJSON: jest.fn().mockReturnThis(),
      };

      (Product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const result = await createProduct(newProductData);

      expect(Product.create).toHaveBeenCalledWith(newProductData);
      expect(result).toEqual(mockCreatedProduct);
    });
  });

  describe('updateProduct', () => {
    it('should update product and return affected count', async () => {
      (Product.update as jest.Mock).mockResolvedValue([1]); // 1 row affected

      const result = await updateProduct(1, { name: 'Updated Name' });

      expect(Product.update).toHaveBeenCalledWith(
        { name: 'Updated Name' },
        { where: { id: 1 } }
      );
      expect(result).toBe(1);
    });

    it('should return 0 when product not found', async () => {
      (Product.update as jest.Mock).mockResolvedValue([0]); // 0 rows affected

      const result = await updateProduct(999, { name: 'Updated Name' });

      expect(result).toBe(0);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product and return affected count', async () => {
      (Product.destroy as jest.Mock).mockResolvedValue(1);

      const result = await deleteProduct(1);

      expect(Product.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(1);
    });

    it('should return 0 when product not found', async () => {
      (Product.destroy as jest.Mock).mockResolvedValue(0);

      const result = await deleteProduct(999);

      expect(result).toBe(0);
    });
  });

  describe('countProducts', () => {
    it('should return product count', async () => {
      (Product.count as jest.Mock).mockResolvedValue(42);

      const result = await countProducts();

      expect(Product.count).toHaveBeenCalled();
      expect(result).toBe(42);
    });

    it('should apply filters when counting', async () => {
      (Product.count as jest.Mock).mockResolvedValue(10);

      await countProducts({ status: 'AVAILABLE' });

      expect(Product.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'AVAILABLE',
          }),
        })
      );
    });
  });
});
```

### 4. Service Tests (To Be Created)

**File**: `packages/api/src/modules/products/services/products.service.test.ts`

**Pattern**: Mock repository functions

```typescript
import { ok, err } from 'neverthrow';
import * as repository from '../repositories/products.repository';
import {
  getProductById,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from './products.service';
import { AppError } from '../../../utils/error-factory';

// Mock the repository
jest.mock('../repositories/products.repository');

describe('ProductsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductById', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        businessType: 'BOTH',
      };

      jest.spyOn(repository, 'findProductById')
        .mockResolvedValue(mockProduct as any);

      const result = await getProductById(1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        expect.objectContaining({ id: 1, name: 'Test Product' })
      );
    });

    it('should return error when product not found', async () => {
      jest.spyOn(repository, 'findProductById')
        .mockResolvedValue(null);

      const result = await getProductById(999);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
    });

    it('should return error when repository throws', async () => {
      jest.spyOn(repository, 'findProductById')
        .mockRejectedValue(new Error('Database error'));

      const result = await getProductById(1);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
    });
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const mockData = {
        rows: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ],
        count: 2,
      };

      jest.spyOn(repository, 'findAllProducts')
        .mockResolvedValue(mockData as any);

      const result = await getProducts({ page: 1, limit: 10 });

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.products).toHaveLength(2);
      expect(data.pagination.total).toBe(2);
    });

    it('should handle empty results', async () => {
      jest.spyOn(repository, 'findAllProducts')
        .mockResolvedValue({ rows: [], count: 0 } as any);

      const result = await getProducts({ page: 1, limit: 10 });

      expect(result.isOk()).toBe(true);
      const data = result._unsafeUnwrap();
      expect(data.products).toHaveLength(0);
      expect(data.pagination.total).toBe(0);
    });
  });

  describe('createProduct', () => {
    it('should create and return new product', async () => {
      const newProductDto = {
        name: 'New Product',
        businessType: 'BOTH' as const,
        pricePerDozenMade: 50000,
        pricePerDozenReady: 45000,
      };

      const mockCreatedProduct = {
        id: 1,
        ...newProductDto,
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'createProduct')
        .mockResolvedValue(mockCreatedProduct as any);

      const result = await createProduct(newProductDto);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        expect.objectContaining({ name: 'New Product' })
      );
    });

    it('should return error when creation fails', async () => {
      const newProductDto = {
        name: 'New Product',
        businessType: 'BOTH' as const,
        pricePerDozenMade: 50000,
      };

      jest.spyOn(repository, 'createProduct')
        .mockRejectedValue(new Error('Database constraint violation'));

      const result = await createProduct(newProductDto);

      expect(result.isErr()).toBe(true);
    });
  });

  describe('updateProduct', () => {
    it('should update and return updated product', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Name',
        businessType: 'BOTH',
      };

      jest.spyOn(repository, 'updateProduct')
        .mockResolvedValue(1); // 1 row affected
      jest.spyOn(repository, 'findProductById')
        .mockResolvedValue(mockUpdatedProduct as any);

      const result = await updateProduct(1, updateDto);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual(
        expect.objectContaining({ name: 'Updated Name' })
      );
    });

    it('should return error when product not found', async () => {
      jest.spyOn(repository, 'updateProduct')
        .mockResolvedValue(0); // 0 rows affected

      const result = await updateProduct(999, { name: 'Updated' });

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.statusCode).toBe(404);
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', async () => {
      jest.spyOn(repository, 'deleteProduct')
        .mockResolvedValue(1); // 1 row deleted

      const result = await deleteProduct(1);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual({ success: true });
    });

    it('should return error when product not found', async () => {
      jest.spyOn(repository, 'deleteProduct')
        .mockResolvedValue(0); // 0 rows deleted

      const result = await deleteProduct(999);

      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error.statusCode).toBe(404);
    });
  });
});
```

### 5. Handler Tests (To Be Created)

**File**: `packages/api/src/modules/products/handlers/products.handlers.test.ts`

**Pattern**: Mock Express req/res and service functions

```typescript
import { Request, Response } from 'express';
import { ok, err } from 'neverthrow';
import * as service from '../services/products.service';
import {
  getProductByIdHandler,
  getProductsHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from './products.handlers';
import { AppError } from '../../../utils/error-factory';

// Mock the service
jest.mock('../services/products.service');

describe('ProductsHandlers', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('getProductByIdHandler', () => {
    it('should return product when found', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        businessType: 'BOTH',
      };

      mockRequest.params = { id: '1' };
      
      jest.spyOn(service, 'getProductById')
        .mockResolvedValue(ok(mockProduct as any));

      await getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockProduct,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when product not found', async () => {
      mockRequest.params = { id: '999' };
      
      const notFoundError = AppError.notFound('Product not found');
      jest.spyOn(service, 'getProductById')
        .mockResolvedValue(err(notFoundError));

      await getProductByIdHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
    });
  });

  describe('getProductsHandler', () => {
    it('should return paginated products', async () => {
      const mockData = {
        products: [
          { id: 1, name: 'Product 1' },
          { id: 2, name: 'Product 2' },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockRequest.query = { page: '1', limit: '10' };
      
      jest.spyOn(service, 'getProducts')
        .mockResolvedValue(ok(mockData as any));

      await getProductsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockData.products,
        pagination: mockData.pagination,
      });
    });
  });

  describe('createProductHandler', () => {
    it('should create and return new product', async () => {
      const newProductDto = {
        name: 'New Product',
        businessType: 'BOTH' as const,
        pricePerDozenMade: 50000,
        pricePerDozenReady: 45000,
      };

      const mockCreatedProduct = {
        id: 1,
        ...newProductDto,
        status: 'AVAILABLE',
      };

      mockRequest.body = newProductDto;
      
      jest.spyOn(service, 'createProduct')
        .mockResolvedValue(ok(mockCreatedProduct as any));

      await createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCreatedProduct,
      });
    });

    it('should call next with error when creation fails', async () => {
      mockRequest.body = { name: 'New Product' };
      
      const error = AppError.internal('Database error');
      jest.spyOn(service, 'createProduct')
        .mockResolvedValue(err(error));

      await createProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('updateProductHandler', () => {
    it('should update and return updated product', async () => {
      const updateDto = { name: 'Updated Name' };
      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Name',
        businessType: 'BOTH',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = updateDto;
      
      jest.spyOn(service, 'updateProduct')
        .mockResolvedValue(ok(mockUpdatedProduct as any));

      await updateProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockUpdatedProduct,
      });
    });
  });

  describe('deleteProductHandler', () => {
    it('should delete product successfully', async () => {
      mockRequest.params = { id: '1' };
      
      jest.spyOn(service, 'deleteProduct')
        .mockResolvedValue(ok({ success: true }));

      await deleteProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Product deleted successfully',
      });
    });

    it('should call next with error when delete fails', async () => {
      mockRequest.params = { id: '999' };
      
      const error = AppError.notFound('Product not found');
      jest.spyOn(service, 'deleteProduct')
        .mockResolvedValue(err(error));

      await deleteProductHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
```

## Running Tests

```bash
# Run all tests
yarn test

# Run specific test file
yarn test products.mappers.test.ts

# Run tests in watch mode
yarn test --watch

# Run with coverage
yarn test:coverage

# Run specific module tests
yarn test products
```

## Coverage Requirements

All modules must maintain:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test**: Focus on single behavior
3. **Mock external dependencies**: Database, APIs, etc.
4. **Test edge cases**: Null, undefined, empty, boundaries
5. **Use descriptive test names**: `should do X when Y`
6. **Clean up after tests**: `beforeEach`, `afterEach`
7. **Avoid test interdependence**: Each test should be independent

## Next Steps for Complete Test Coverage

### Products Module
- [x] Mappers (11 tests) ✅
- [ ] Validators (15+ tests)
- [ ] Repository (15+ tests)
- [ ] Service (15+ tests)
- [ ] Handlers (10+ tests)

### Orders Module
- [ ] Mappers (12+ tests)
- [ ] Validators (20+ tests)
- [ ] Repository (20+ tests)
- [ ] Service (20+ tests with business logic)
- [ ] Handlers (14+ tests)

### Payments Module
- [ ] Mappers (8+ tests)
- [ ] Validators (12+ tests)
- [ ] Repository (15+ tests)
- [ ] Service (15+ tests with VietQR)
- [ ] Handlers (12+ tests)

### Integration Tests
- [ ] Products API endpoints (E2E)
- [ ] Orders API endpoints (E2E)
- [ ] Payments API endpoints (E2E)

**Total Estimated Tests**: 200+ test cases

---

Follow this guide to complete the remaining test files. Each test file should follow the established patterns for consistency and maintainability.
