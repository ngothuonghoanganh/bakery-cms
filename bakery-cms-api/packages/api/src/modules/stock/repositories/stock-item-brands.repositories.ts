/**
 * Stock Item Brands repository
 * Data access layer for stock item brand pricing junction table
 */

import { StockItemBrandModel, BrandModel } from '@bakery-cms/database';

/**
 * Stock Item Brands repository interface
 * Defines all data access operations for stock item brand associations
 */
export interface StockItemBrandRepository {
  findByStockItemId(stockItemId: string): Promise<StockItemBrandModel[]>;
  findByStockItemAndBrand(stockItemId: string, brandId: string): Promise<StockItemBrandModel | null>;
  create(attributes: Partial<StockItemBrandModel>): Promise<StockItemBrandModel>;
  update(stockItemId: string, brandId: string, attributes: Partial<StockItemBrandModel>): Promise<StockItemBrandModel | null>;
  delete(stockItemId: string, brandId: string): Promise<boolean>;
  deleteByStockItemId(stockItemId: string): Promise<number>;
  setPreferred(stockItemId: string, brandId: string): Promise<boolean>;
}

/**
 * Create stock item brands repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createStockItemBrandRepository = (
  stockItemBrandModel: typeof StockItemBrandModel,
  brandModel: typeof BrandModel
): StockItemBrandRepository => {
  /**
   * Find all brands associated with a stock item
   * Includes brand details through association
   */
  const findByStockItemId = async (
    stockItemId: string
  ): Promise<StockItemBrandModel[]> => {
    return await stockItemBrandModel.findAll({
      where: { stockItemId },
      include: [
        {
          model: brandModel,
          as: 'brand',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
      order: [['isPreferred', 'DESC'], ['createdAt', 'ASC']],
    });
  };

  /**
   * Find specific stock item brand association
   */
  const findByStockItemAndBrand = async (
    stockItemId: string,
    brandId: string
  ): Promise<StockItemBrandModel | null> => {
    return await stockItemBrandModel.findOne({
      where: { stockItemId, brandId },
      include: [
        {
          model: brandModel,
          as: 'brand',
          attributes: ['id', 'name', 'description', 'isActive'],
        },
      ],
    });
  };

  /**
   * Create new stock item brand association
   */
  const create = async (
    attributes: Partial<StockItemBrandModel>
  ): Promise<StockItemBrandModel> => {
    return await stockItemBrandModel.create(attributes);
  };

  /**
   * Update stock item brand pricing
   * Returns updated association or null if not found
   */
  const update = async (
    stockItemId: string,
    brandId: string,
    attributes: Partial<StockItemBrandModel>
  ): Promise<StockItemBrandModel | null> => {
    const stockItemBrand = await stockItemBrandModel.findOne({
      where: { stockItemId, brandId },
    });

    if (!stockItemBrand) {
      return null;
    }

    await stockItemBrand.update(attributes);
    return stockItemBrand;
  };

  /**
   * Delete stock item brand association
   * Returns true if deleted, false if not found
   */
  const deleteStockItemBrand = async (
    stockItemId: string,
    brandId: string
  ): Promise<boolean> => {
    const rowsDeleted = await stockItemBrandModel.destroy({
      where: { stockItemId, brandId },
    });

    return rowsDeleted > 0;
  };

  /**
   * Delete all brand associations for a stock item
   * Returns number of associations deleted
   */
  const deleteByStockItemId = async (
    stockItemId: string
  ): Promise<number> => {
    return await stockItemBrandModel.destroy({
      where: { stockItemId },
    });
  };

  /**
   * Set a brand as preferred for a stock item
   * Unsets all other brands as not preferred first
   * Returns true if successful, false if not found
   */
  const setPreferred = async (
    stockItemId: string,
    brandId: string
  ): Promise<boolean> => {
    // First, unset all preferred brands for this stock item
    await stockItemBrandModel.update(
      { isPreferred: false },
      { where: { stockItemId } }
    );

    // Then set the specified brand as preferred
    const [affectedRows] = await stockItemBrandModel.update(
      { isPreferred: true },
      { where: { stockItemId, brandId } }
    );

    return affectedRows > 0;
  };

  return {
    findByStockItemId,
    findByStockItemAndBrand,
    create,
    update,
    delete: deleteStockItemBrand,
    deleteByStockItemId,
    setPreferred,
  };
};
