/**
 * Stock movements repository
 * Data access layer for stock movements using Sequelize
 */

import { Op } from 'sequelize';
import { StockMovementModel, StockItemModel, UserModel } from '@bakery-cms/database';
import { StockMovementListQueryDto } from '../dto/stock-movements.dto';

/**
 * Stock movements repository interface
 * Defines all data access operations for stock movements
 */
export interface StockMovementRepository {
  findById(id: string): Promise<StockMovementModel | null>;
  findAll(query: StockMovementListQueryDto): Promise<{
    rows: Array<StockMovementModel & { stockItem?: StockItemModel; user?: UserModel }>;
    count: number;
  }>;
  create(attributes: Partial<StockMovementModel>): Promise<StockMovementModel>;
  count(filters?: Partial<StockMovementModel>): Promise<number>;
}

/**
 * Create stock movements repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createStockMovementRepository = (
  model: typeof StockMovementModel
): StockMovementRepository => {
  /**
   * Find stock movement by ID with related data
   */
  const findById = async (id: string): Promise<StockMovementModel | null> => {
    return await model.findByPk(id, {
      include: [
        {
          model: StockItemModel,
          as: 'stockItem',
          attributes: ['id', 'name'],
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });
  };

  /**
   * Find all stock movements with filtering and pagination
   */
  const findAll = async (
    query: StockMovementListQueryDto
  ): Promise<{
    rows: Array<StockMovementModel & { stockItem?: StockItemModel; user?: UserModel }>;
    count: number;
  }> => {
    const {
      page = 1,
      limit = 10,
      stockItemId,
      type,
      userId,
      startDate,
      endDate,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (stockItemId) {
      where['stockItemId'] = stockItemId;
    }

    if (type) {
      where['type'] = type;
    }

    if (userId) {
      where['userId'] = userId;
    }

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) {
        dateFilter[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        dateFilter[Op.lte] = new Date(endDate);
      }
      where['createdAt'] = dateFilter;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute query with related data
    const result = await model.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: StockItemModel,
          as: 'stockItem',
          attributes: ['id', 'name'],
        },
        {
          model: UserModel,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    return result;
  };

  /**
   * Create new stock movement record
   */
  const create = async (
    attributes: Partial<StockMovementModel>
  ): Promise<StockMovementModel> => {
    return await model.create(attributes);
  };

  /**
   * Count stock movements with optional filters
   */
  const count = async (filters?: Partial<StockMovementModel>): Promise<number> => {
    return await model.count({
      where: filters ?? {},
    });
  };

  return {
    findById,
    findAll,
    create,
    count,
  };
};
