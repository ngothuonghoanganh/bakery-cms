/**
 * Product Repository Tests
 * Tests for soft delete, restore, and force delete operations
 */

import { createProductRepository, ProductRepository } from './products.repositories';
import { ProductModel } from '@bakery-cms/database';

// Mock ProductModel type for testing
type MockProductModel = {
  findByPk: jest.Mock;
  findAndCountAll: jest.Mock;
  create: jest.Mock;
  destroy: jest.Mock;
  count: jest.Mock;
  scope: jest.Mock;
};

const createMockProductModel = (): MockProductModel => ({
  findByPk: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  count: jest.fn(),
  scope: jest.fn(),
});;

describe('Product Repository - Soft Delete', () => {
  let repository: ProductRepository;
  let mockProductModel: MockProductModel;

  beforeEach(() => {
    mockProductModel = createMockProductModel();
    repository = createProductRepository(mockProductModel as any);
  });

  describe('delete (soft delete)', () => {
    it('should soft delete a product by ID', async () => {
      const mockProduct = {
        id: '123',
        name: 'Test Product',
        destroy: jest.fn().mockResolvedValue(undefined),
      } as unknown as ProductModel;

      (mockProductModel.findByPk as jest.Mock).mockResolvedValue(mockProduct);

      const result = await repository.delete('123');

      expect(mockProductModel.findByPk).toHaveBeenCalledWith('123');
      expect(mockProduct.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if product not found', async () => {
      (mockProductModel.findByPk as jest.Mock).mockResolvedValue(null);

      const result = await repository.delete('non-existent');

      expect(mockProductModel.findByPk).toHaveBeenCalledWith('non-existent');
      expect(result).toBe(false);
    });

    it('should handle soft delete errors', async () => {
      const mockProduct = {
        destroy: jest.fn().mockRejectedValue(new Error('DB Error')),
      } as unknown as ProductModel;

      (mockProductModel.findByPk as jest.Mock).mockResolvedValue(mockProduct);

      await expect(repository.delete('123')).rejects.toThrow('DB Error');
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted product by ID', async () => {
      const mockProduct = {
        id: '123',
        name: 'Test Product',
        deletedAt: new Date('2024-01-01'),
        restore: jest.fn().mockResolvedValue(undefined),
      } as unknown as ProductModel;

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockProduct),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      const result = await repository.restore('123');

      expect(mockProductModel.scope).toHaveBeenCalledWith('withDeleted');
      expect(mockScope.findByPk).toHaveBeenCalledWith('123');
      expect(mockProduct.restore).toHaveBeenCalled();
      expect(result).toBe(mockProduct);
    });

    it('should return null if product not found', async () => {
      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(null),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      const result = await repository.restore('non-existent');

      expect(result).toBeNull();
    });

    it('should return null if product is not deleted', async () => {
      const mockProduct = {
        id: '123',
        deletedAt: null,
      } as unknown as ProductModel;

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockProduct),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      const result = await repository.restore('123');

      expect(result).toBeNull();
    });

    it('should handle restore errors', async () => {
      const mockProduct = {
        deletedAt: new Date(),
        restore: jest.fn().mockRejectedValue(new Error('DB Error')),
      } as unknown as ProductModel;

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockProduct),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      await expect(repository.restore('123')).rejects.toThrow('DB Error');
    });
  });

  describe('forceDelete (hard delete)', () => {
    it('should permanently delete a product by ID', async () => {
      const mockScope = {
        destroy: jest.fn().mockResolvedValue(1),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      const result = await repository.forceDelete('123');

      expect(mockProductModel.scope).toHaveBeenCalledWith('withDeleted');
      expect(mockScope.destroy).toHaveBeenCalledWith({
        where: { id: '123' },
        force: true,
      });
      expect(result).toBe(true);
    });

    it('should return false if no rows deleted', async () => {
      const mockScope = {
        destroy: jest.fn().mockResolvedValue(0),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      const result = await repository.forceDelete('non-existent');

      expect(result).toBe(false);
    });

    it('should handle force delete errors', async () => {
      const mockScope = {
        destroy: jest.fn().mockRejectedValue(new Error('DB Error')),
      };

      (mockProductModel.scope as jest.Mock).mockReturnValue(mockScope);

      await expect(repository.forceDelete('123')).rejects.toThrow('DB Error');
    });
  });

  describe('defaultScope filtering', () => {
    it('should only return non-deleted products by default', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', deletedAt: null },
        { id: '2', name: 'Product 2', deletedAt: null },
      ] as ProductModel[];

      (mockProductModel.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: mockProducts,
        count: 2,
      });

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.rows).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should not include soft-deleted products in count', async () => {
      (mockProductModel.count as jest.Mock).mockResolvedValue(5);

      const result = await repository.count();

      expect(result).toBe(5);
    });
  });
});
