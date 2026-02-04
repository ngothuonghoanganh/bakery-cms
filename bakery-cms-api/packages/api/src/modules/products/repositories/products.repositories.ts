/**
 * Product repository
 * Data access layer for products using Sequelize
 */

import { Op } from 'sequelize';
import { ProductModel, FileModel, ProductImageModel } from '@bakery-cms/database';
import { ProductListQueryDto } from '../dto/products.dto';

/**
 * Product repository interface
 * Defines all data access operations for products
 */
export interface ProductRepository {
  findById(id: string): Promise<ProductModel | null>;
  findAll(query: ProductListQueryDto): Promise<{ rows: ProductModel[]; count: number }>;
  create(attributes: Partial<ProductModel>): Promise<ProductModel>;
  update(id: string, attributes: Partial<ProductModel>): Promise<ProductModel | null>;
  delete(id: string): Promise<boolean>;
  restore(id: string): Promise<ProductModel | null>;
  forceDelete(id: string): Promise<boolean>;
  count(filters?: Partial<ProductModel>): Promise<number>;
}

/**
 * Create product repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createProductRepository = (
  model: typeof ProductModel
): ProductRepository => {
  /**
   * Find product by ID with imageFile and images associations
   */
  const findById = async (id: string): Promise<ProductModel | null> => {
    return await model.findByPk(id, {
      include: [
        { model: FileModel, as: 'imageFile' },
        {
          model: ProductImageModel,
          as: 'images',
          include: [{ model: FileModel, as: 'file' }],
          order: [['displayOrder', 'ASC']],
        },
      ],
    });
  };

  /**
   * Find all products with filtering and pagination
   */
  const findAll = async (
    query: ProductListQueryDto
  ): Promise<{ rows: ProductModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      businessType,
      status,
      category,
      search,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (businessType) {
      where['businessType'] = businessType;
    }

    if (status) {
      where['status'] = status;
    }

    if (category) {
      where['category'] = category;
    }

    if (search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute query
    const result = await model.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { model: FileModel, as: 'imageFile' },
        {
          model: ProductImageModel,
          as: 'images',
          include: [{ model: FileModel, as: 'file' }],
          separate: true,
          order: [['displayOrder', 'ASC']],
        },
      ],
    });

    return result;
  };

  /**
   * Create new product
   */
  const create = async (
    attributes: Partial<ProductModel>
  ): Promise<ProductModel> => {
    return await model.create(attributes);
  };

  /**
   * Update product by ID
   * Returns updated product with imageFile association or null if not found
   */
  const update = async (
    id: string,
    attributes: Partial<ProductModel>
  ): Promise<ProductModel | null> => {
    const product = await model.findByPk(id);

    if (!product) {
      return null;
    }

    await product.update(attributes);

    // Reload to include imageFile and images associations
    return await model.findByPk(id, {
      include: [
        { model: FileModel, as: 'imageFile' },
        {
          model: ProductImageModel,
          as: 'images',
          include: [{ model: FileModel, as: 'file' }],
          order: [['displayOrder', 'ASC']],
        },
      ],
    });
  };

  /**
   * Delete product by ID (soft delete)
   * Returns true if deleted, false if not found
   */
  const deleteProduct = async (id: string): Promise<boolean> => {
    const product = await model.findByPk(id);
    
    if (!product) {
      return false;
    }

    await product.destroy();
    return true;
  };

  /**
   * Restore soft-deleted product by ID
   * Returns restored product or null if not found
   */
  const restore = async (id: string): Promise<ProductModel | null> => {
    const product = await model.scope('withDeleted').findByPk(id);
    
    if (!product || !product.deletedAt) {
      return null;
    }

    await product.restore();
    return product;
  };

  /**
   * Permanently delete product by ID (hard delete)
   * Returns true if deleted, false if not found
   */
  const forceDelete = async (id: string): Promise<boolean> => {
    const rowsDeleted = await model.scope('withDeleted').destroy({
      where: { id },
      force: true,
    });

    return rowsDeleted > 0;
  };

  /**
   * Count products with optional filters
   */
  const count = async (filters?: Partial<ProductModel>): Promise<number> => {
    return await model.count({
      where: filters ?? {},
    });
  };

  return {
    findById,
    findAll,
    create,
    update,
    delete: deleteProduct,
    restore,
    forceDelete,
    count,
  };
};
