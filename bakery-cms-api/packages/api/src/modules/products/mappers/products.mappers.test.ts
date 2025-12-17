/**
 * Products Mapper Tests
 * Tests for entity-DTO transformation functions
 */

import {
  toProductResponseDto,
  toProductResponseDtoList,
  toProductCreationAttributes,
  toProductUpdateAttributes,
} from './products.mappers';
import { ProductModel } from '@bakery-cms/database';
import { BusinessType, ProductStatus } from '@bakery-cms/common';
import { CreateProductDto, UpdateProductDto } from '../dto/products.dto';

describe('Products Mappers', () => {
  describe('toProductResponseDto', () => {
    it('should map ProductModel to ProductResponseDto', () => {
      const model = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Chocolate Chip Cookie',
        description: 'Delicious cookies',
        price: 25000,
        category: 'cookies',
        businessType: BusinessType.READY_TO_SELL,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      } as ProductModel;

      const dto = toProductResponseDto(model);

      expect(dto).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Chocolate Chip Cookie',
        description: 'Delicious cookies',
        price: 25000,
        category: 'cookies',
        businessType: BusinessType.READY_TO_SELL,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://example.com/image.jpg',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should handle null optional fields', () => {
      const model = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Simple Cookie',
        description: null,
        price: 15000,
        category: null,
        businessType: BusinessType.BOTH,
        status: ProductStatus.OUT_OF_STOCK,
        imageUrl: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      } as ProductModel;

      const dto = toProductResponseDto(model);

      expect(dto.description).toBeNull();
      expect(dto.category).toBeNull();
      expect(dto.imageUrl).toBeNull();
    });
  });

  describe('toProductResponseDtoList', () => {
    it('should map array of models to array of DTOs', () => {
      const models = [
        {
          id: '1',
          name: 'Product 1',
          price: 10000,
          businessType: BusinessType.MADE_TO_ORDER,
          status: ProductStatus.AVAILABLE,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: '2',
          name: 'Product 2',
          price: 20000,
          businessType: BusinessType.READY_TO_SELL,
          status: ProductStatus.AVAILABLE,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ] as ProductModel[];

      const dtos = toProductResponseDtoList(models);

      expect(dtos).toHaveLength(2);
      expect(dtos[0]?.name).toBe('Product 1');
      expect(dtos[1]?.name).toBe('Product 2');
    });

    it('should return empty array for empty input', () => {
      const dtos = toProductResponseDtoList([]);
      expect(dtos).toEqual([]);
    });
  });

  describe('toProductCreationAttributes', () => {
    it('should map CreateProductDto to creation attributes', () => {
      const dto: CreateProductDto = {
        name: 'New Cookie',
        description: 'Fresh from oven',
        price: 30000,
        category: 'premium',
        businessType: BusinessType.MADE_TO_ORDER,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://example.com/new.jpg',
      };

      const attributes = toProductCreationAttributes(dto);

      expect(attributes).toEqual({
        name: 'New Cookie',
        description: 'Fresh from oven',
        price: 30000,
        category: 'premium',
        businessType: BusinessType.MADE_TO_ORDER,
        status: ProductStatus.AVAILABLE,
        imageUrl: 'https://example.com/new.jpg',
      });
    });

    it('should use default status when not provided', () => {
      const dto: CreateProductDto = {
        name: 'Default Product',
        price: 10000,
        businessType: BusinessType.BOTH,
      };

      const attributes = toProductCreationAttributes(dto);

      expect(attributes.status).toBe(ProductStatus.AVAILABLE);
    });

    it('should convert undefined to null for optional fields', () => {
      const dto: CreateProductDto = {
        name: 'Minimal Product',
        price: 10000,
        businessType: BusinessType.READY_TO_SELL,
      };

      const attributes = toProductCreationAttributes(dto);

      expect(attributes.description).toBeNull();
      expect(attributes.category).toBeNull();
      expect(attributes.imageUrl).toBeNull();
    });
  });

  describe('toProductUpdateAttributes', () => {
    it('should only include defined fields', () => {
      const dto: UpdateProductDto = {
        name: 'Updated Name',
        price: 35000,
      };

      const attributes = toProductUpdateAttributes(dto);

      expect(attributes).toEqual({
        name: 'Updated Name',
        price: 35000,
      });
      expect(attributes).not.toHaveProperty('description');
      expect(attributes).not.toHaveProperty('category');
    });

    it('should handle all fields when provided', () => {
      const dto: UpdateProductDto = {
        name: 'Complete Update',
        description: 'New description',
        price: 40000,
        category: 'special',
        businessType: BusinessType.BOTH,
        status: ProductStatus.OUT_OF_STOCK,
        imageUrl: 'https://example.com/updated.jpg',
      };

      const attributes = toProductUpdateAttributes(dto);

      expect(Object.keys(attributes)).toHaveLength(7);
      expect(attributes.name).toBe('Complete Update');
      expect(attributes.status).toBe(ProductStatus.OUT_OF_STOCK);
    });

    it('should convert empty strings to null', () => {
      const dto: UpdateProductDto = {
        description: '',
        category: '',
        imageUrl: '',
      };

      const attributes = toProductUpdateAttributes(dto);

      expect(attributes.description).toBeNull();
      expect(attributes.category).toBeNull();
      expect(attributes.imageUrl).toBeNull();
    });
  });
});
