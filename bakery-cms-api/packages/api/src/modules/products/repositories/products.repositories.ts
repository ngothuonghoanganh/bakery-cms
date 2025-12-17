/**
 * Product repository
 * Data access layer for products using Sequelize
 */

import { Op } from 'sequelize';
import { ProductModel } from '@bakery-cms/database';
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
   * Find product by ID
   */
  const findById = async (id: string): Promise<ProductModel | null> => {
    return await model.findByPk(id);
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
   * Returns updated product or null if not found
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
    return product;
  };

  /**
   * Delete product by ID
   * Returns true if deleted, false if not found
   */
  const deleteProduct = async (id: string): Promise<boolean> => {
    const rowsDeleted = await model.destroy({
      where: { id },
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
    count,
  };
};
