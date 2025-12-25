/**
 * Stock items repository
 * Data access layer for stock items using Sequelize
 */

import { Op } from 'sequelize';
import { StockItemModel } from '@bakery-cms/database';
import { StockItemStatus } from '@bakery-cms/common';
import { StockItemListQueryDto } from '../dto/stock-items.dto';

/**
 * Stock items repository interface
 * Defines all data access operations for stock items
 */
export interface StockItemRepository {
  findById(id: string): Promise<StockItemModel | null>;
  findAll(query: StockItemListQueryDto): Promise<{ rows: StockItemModel[]; count: number }>;
  create(attributes: Partial<StockItemModel>): Promise<StockItemModel>;
  update(id: string, attributes: Partial<StockItemModel>): Promise<StockItemModel | null>;
  delete(id: string): Promise<boolean>;
  restore(id: string): Promise<StockItemModel | null>;
  forceDelete(id: string): Promise<boolean>;
  count(filters?: Partial<StockItemModel>): Promise<number>;
  updateQuantity(id: string, quantity: number): Promise<StockItemModel | null>;
}

/**
 * Create stock items repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createStockItemRepository = (
  model: typeof StockItemModel
): StockItemRepository => {
  /**
   * Find stock item by ID
   */
  const findById = async (id: string): Promise<StockItemModel | null> => {
    return await model.findByPk(id);
  };

  /**
   * Find all stock items with filtering, sorting, and pagination
   */
  const findAll = async (
    query: StockItemListQueryDto
  ): Promise<{ rows: StockItemModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      lowStockOnly,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where['status'] = status;
    }

    if (lowStockOnly) {
      (where as any)[Op.or] = [
        { status: StockItemStatus.LOW_STOCK },
        { status: StockItemStatus.OUT_OF_STOCK },
      ];
    }

    if (search) {
      (where as any)[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build order clause with validated sortBy field
    const validSortFields = ['name', 'currentQuantity', 'status', 'createdAt', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Execute query
    const result = await model.findAndCountAll({
      where,
      limit,
      offset,
      order: [[orderField, orderDirection]],
    });

    return result;
  };

  /**
   * Create new stock item
   */
  const create = async (
    attributes: Partial<StockItemModel>
  ): Promise<StockItemModel> => {
    return await model.create(attributes);
  };

  /**
   * Update stock item by ID
   * Returns updated stock item or null if not found
   */
  const update = async (
    id: string,
    attributes: Partial<StockItemModel>
  ): Promise<StockItemModel | null> => {
    const stockItem = await model.findByPk(id);

    if (!stockItem) {
      return null;
    }

    await stockItem.update(attributes);
    return stockItem;
  };

  /**
   * Delete stock item by ID (soft delete)
   * Returns true if deleted, false if not found
   */
  const deleteStockItem = async (id: string): Promise<boolean> => {
    const stockItem = await model.findByPk(id);

    if (!stockItem) {
      return false;
    }

    await stockItem.destroy();
    return true;
  };

  /**
   * Restore soft-deleted stock item by ID
   * Returns restored stock item or null if not found
   */
  const restore = async (id: string): Promise<StockItemModel | null> => {
    const stockItem = await model.scope('withDeleted').findByPk(id);

    if (!stockItem || !stockItem.deletedAt) {
      return null;
    }

    await stockItem.restore();
    return stockItem;
  };

  /**
   * Permanently delete stock item by ID (hard delete)
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
   * Count stock items with optional filters
   */
  const count = async (filters?: Partial<StockItemModel>): Promise<number> => {
    return await model.count({
      where: filters ?? {},
    });
  };

  /**
   * Update stock item quantity
   * Returns updated stock item or null if not found
   */
  const updateQuantity = async (
    id: string,
    quantity: number
  ): Promise<StockItemModel | null> => {
    const stockItem = await model.findByPk(id);

    if (!stockItem) {
      return null;
    }

    await stockItem.update({ currentQuantity: quantity });
    return stockItem;
  };

  return {
    findById,
    findAll,
    create,
    update,
    delete: deleteStockItem,
    restore,
    forceDelete,
    count,
    updateQuantity,
  };
};
