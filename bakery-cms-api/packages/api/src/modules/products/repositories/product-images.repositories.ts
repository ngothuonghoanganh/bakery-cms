/**
 * Product Images repository
 * Data access layer for product images junction table using Sequelize
 */

import { ProductImageModel, FileModel } from '@bakery-cms/database';

/**
 * Product images repository interface
 * Defines all data access operations for product images
 */
export interface ProductImageRepository {
  findByProductId(productId: string): Promise<ProductImageModel[]>;
  findById(id: string): Promise<ProductImageModel | null>;
  findByProductAndFile(productId: string, fileId: string): Promise<ProductImageModel | null>;
  create(attributes: Partial<ProductImageModel>): Promise<ProductImageModel>;
  update(id: string, attributes: Partial<ProductImageModel>): Promise<ProductImageModel | null>;
  delete(id: string): Promise<boolean>;
  deleteByProductId(productId: string): Promise<number>;
  setPrimary(productId: string, imageId: string): Promise<boolean>;
  getMaxDisplayOrder(productId: string): Promise<number>;
}

/**
 * Create product images repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createProductImageRepository = (
  model: typeof ProductImageModel
): ProductImageRepository => {
  /**
   * Find all images for a product, ordered by displayOrder
   */
  const findByProductId = async (productId: string): Promise<ProductImageModel[]> => {
    return await model.findAll({
      where: { productId },
      include: [
        {
          model: FileModel,
          as: 'file',
        },
      ],
      order: [
        ['is_primary', 'DESC'],
        ['display_order', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
  };

  /**
   * Find image by ID
   */
  const findById = async (id: string): Promise<ProductImageModel | null> => {
    return await model.findByPk(id, {
      include: [
        {
          model: FileModel,
          as: 'file',
        },
      ],
    });
  };

  /**
   * Find image by product and file ID (check for duplicates)
   */
  const findByProductAndFile = async (
    productId: string,
    fileId: string
  ): Promise<ProductImageModel | null> => {
    return await model.findOne({
      where: { productId, fileId },
    });
  };

  /**
   * Create new product image
   */
  const create = async (
    attributes: Partial<ProductImageModel>
  ): Promise<ProductImageModel> => {
    const created = await model.create(attributes);
    return await findById(created.id) as ProductImageModel;
  };

  /**
   * Update product image
   */
  const update = async (
    id: string,
    attributes: Partial<ProductImageModel>
  ): Promise<ProductImageModel | null> => {
    const image = await model.findByPk(id);

    if (!image) {
      return null;
    }

    await image.update(attributes);
    return await findById(id);
  };

  /**
   * Delete product image
   */
  const deleteImage = async (id: string): Promise<boolean> => {
    const image = await model.findByPk(id);

    if (!image) {
      return false;
    }

    await image.destroy();
    return true;
  };

  /**
   * Delete all images for a product
   */
  const deleteByProductId = async (productId: string): Promise<number> => {
    return await model.destroy({
      where: { productId },
    });
  };

  /**
   * Set an image as primary (and unset others)
   */
  const setPrimary = async (productId: string, imageId: string): Promise<boolean> => {
    // First, unset all primary images for this product
    await model.update(
      { isPrimary: false },
      { where: { productId } }
    );

    // Then set the specified image as primary
    const [updated] = await model.update(
      { isPrimary: true },
      { where: { id: imageId, productId } }
    );

    return updated > 0;
  };

  /**
   * Get the maximum display order for a product's images
   */
  const getMaxDisplayOrder = async (productId: string): Promise<number> => {
    const result = await model.max('displayOrder', {
      where: { productId },
    });
    return (result as number) || 0;
  };

  return {
    findByProductId,
    findById,
    findByProductAndFile,
    create,
    update,
    delete: deleteImage,
    deleteByProductId,
    setPrimary,
    getMaxDisplayOrder,
  };
};
