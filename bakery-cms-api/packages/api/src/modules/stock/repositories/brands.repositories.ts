/**
 * Brands repository
 * Data access layer for brands using Sequelize
 */

import { Op } from 'sequelize';
import { BrandModel } from '@bakery-cms/database';
import { BrandListQueryDto } from '../dto/brands.dto';

/**
 * Brands repository interface
 * Defines all data access operations for brands
 */
export interface BrandRepository {
  findById(id: string): Promise<BrandModel | null>;
  findAll(query: BrandListQueryDto): Promise<{ rows: BrandModel[]; count: number }>;
  create(attributes: Partial<BrandModel>): Promise<BrandModel>;
  update(id: string, attributes: Partial<BrandModel>): Promise<BrandModel | null>;
  delete(id: string): Promise<boolean>;
  restore(id: string): Promise<BrandModel | null>;
  forceDelete(id: string): Promise<boolean>;
  count(filters?: Partial<BrandModel>): Promise<number>;
}

/**
 * Create brands repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createBrandRepository = (
  model: typeof BrandModel
): BrandRepository => {
  /**
   * Find brand by ID
   */
  const findById = async (id: string): Promise<BrandModel | null> => {
    return await model.findByPk(id);
  };

  /**
   * Find all brands with filtering and pagination
   */
  const findAll = async (
    query: BrandListQueryDto
  ): Promise<{ rows: BrandModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (isActive !== undefined) {
      where['isActive'] = isActive;
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
   * Create new brand
   */
  const create = async (
    attributes: Partial<BrandModel>
  ): Promise<BrandModel> => {
    return await model.create(attributes);
  };

  /**
   * Update brand by ID
   * Returns updated brand or null if not found
   */
  const update = async (
    id: string,
    attributes: Partial<BrandModel>
  ): Promise<BrandModel | null> => {
    const brand = await model.findByPk(id);

    if (!brand) {
      return null;
    }

    await brand.update(attributes);
    return brand;
  };

  /**
   * Delete brand by ID (soft delete)
   * Returns true if deleted, false if not found
   */
  const deleteBrand = async (id: string): Promise<boolean> => {
    const brand = await model.findByPk(id);

    if (!brand) {
      return false;
    }

    await brand.destroy();
    return true;
  };

  /**
   * Restore soft-deleted brand by ID
   * Returns restored brand or null if not found
   */
  const restore = async (id: string): Promise<BrandModel | null> => {
    const brand = await model.scope('withDeleted').findByPk(id);

    if (!brand || !brand.deletedAt) {
      return null;
    }

    await brand.restore();
    return brand;
  };

  /**
   * Permanently delete brand by ID (hard delete)
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
   * Count brands with optional filters
   */
  const count = async (filters?: Partial<BrandModel>): Promise<number> => {
    return await model.count({
      where: filters ?? {},
    });
  };

  return {
    findById,
    findAll,
    create,
    update,
    delete: deleteBrand,
    restore,
    forceDelete,
    count,
  };
};
