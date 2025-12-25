/**
 * Product stock items repository
 * Data access layer for product-stock-item junction table using Sequelize
 */

import { ProductStockItemModel, StockItemModel, BrandModel } from '@bakery-cms/database';

/**
 * Product stock items repository interface
 * Defines all data access operations for product stock items
 */
export interface ProductStockItemRepository {
  findByProductId(productId: string): Promise<ProductStockItemModel[]>;
  findByProductAndStockItem(
    productId: string,
    stockItemId: string
  ): Promise<ProductStockItemModel | null>;
  create(attributes: Partial<ProductStockItemModel>): Promise<ProductStockItemModel>;
  update(
    productId: string,
    stockItemId: string,
    attributes: Partial<ProductStockItemModel>
  ): Promise<ProductStockItemModel | null>;
  delete(productId: string, stockItemId: string): Promise<boolean>;
  countByStockItemId(stockItemId: string): Promise<number>;
}

/**
 * Create product stock items repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createProductStockItemRepository = (
  model: typeof ProductStockItemModel
): ProductStockItemRepository => {
  /**
   * Find all stock items for a product (recipe)
   * Includes stock item and brand details
   */
  const findByProductId = async (
    productId: string
  ): Promise<ProductStockItemModel[]> => {
    return await model.findAll({
      where: { productId },
      include: [
        {
          model: StockItemModel,
          as: 'StockItem',
          attributes: ['id', 'name', 'unitOfMeasure'],
        },
        {
          model: BrandModel,
          as: 'PreferredBrand',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });
  };

  /**
   * Find specific product-stock-item link
   */
  const findByProductAndStockItem = async (
    productId: string,
    stockItemId: string
  ): Promise<ProductStockItemModel | null> => {
    return await model.findOne({
      where: { productId, stockItemId },
      include: [
        {
          model: StockItemModel,
          as: 'StockItem',
          attributes: ['id', 'name', 'unitOfMeasure'],
        },
        {
          model: BrandModel,
          as: 'PreferredBrand',
          attributes: ['id', 'name'],
        },
      ],
    });
  };

  /**
   * Create new product-stock-item link
   */
  const create = async (
    attributes: Partial<ProductStockItemModel>
  ): Promise<ProductStockItemModel> => {
    const created = await model.create(attributes);

    // Fetch with includes
    const result = await model.findOne({
      where: { id: created.id },
      include: [
        {
          model: StockItemModel,
          as: 'StockItem',
          attributes: ['id', 'name', 'unitOfMeasure'],
        },
        {
          model: BrandModel,
          as: 'PreferredBrand',
          attributes: ['id', 'name'],
        },
      ],
    });

    return result!;
  };

  /**
   * Update product-stock-item link
   * Returns updated link or null if not found
   */
  const update = async (
    productId: string,
    stockItemId: string,
    attributes: Partial<ProductStockItemModel>
  ): Promise<ProductStockItemModel | null> => {
    const link = await model.findOne({
      where: { productId, stockItemId },
    });

    if (!link) {
      return null;
    }

    await link.update(attributes);

    // Refetch with includes
    const result = await model.findOne({
      where: { id: link.id },
      include: [
        {
          model: StockItemModel,
          as: 'StockItem',
          attributes: ['id', 'name', 'unitOfMeasure'],
        },
        {
          model: BrandModel,
          as: 'PreferredBrand',
          attributes: ['id', 'name'],
        },
      ],
    });

    return result;
  };

  /**
   * Delete product-stock-item link (soft delete)
   * Returns true if deleted, false if not found
   */
  const deleteLink = async (productId: string, stockItemId: string): Promise<boolean> => {
    const link = await model.findOne({
      where: { productId, stockItemId },
    });

    if (!link) {
      return false;
    }

    await link.destroy();
    return true;
  };

  /**
   * Count how many products use a specific stock item
   * Used for deletion protection
   */
  const countByStockItemId = async (stockItemId: string): Promise<number> => {
    return await model.count({
      where: { stockItemId },
    });
  };

  return {
    findByProductId,
    findByProductAndStockItem,
    create,
    update,
    delete: deleteLink,
    countByStockItemId,
  };
};
