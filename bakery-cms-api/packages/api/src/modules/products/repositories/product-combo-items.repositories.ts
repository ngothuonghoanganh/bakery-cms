/**
 * Product Combo Items repository
 * Data access layer for combo child items
 */

import {
  ProductComboItemModel,
  ProductModel,
  FileModel,
} from '@bakery-cms/database';

export interface ProductComboItemRepository {
  findByComboProductId(comboProductId: string): Promise<ProductComboItemModel[]>;
  findById(id: string): Promise<ProductComboItemModel | null>;
  create(attributes: Partial<ProductComboItemModel>): Promise<ProductComboItemModel>;
  update(id: string, attributes: Partial<ProductComboItemModel>): Promise<ProductComboItemModel | null>;
  delete(id: string): Promise<boolean>;
}

export const createProductComboItemRepository = (
  model: typeof ProductComboItemModel
): ProductComboItemRepository => {
  const findByComboProductId = async (
    comboProductId: string
  ): Promise<ProductComboItemModel[]> => {
    return await model.findAll({
      where: { comboProductId },
      include: [
        {
          model: ProductModel,
          as: 'itemProduct',
          include: [{ model: FileModel, as: 'imageFile' }],
        },
      ],
      order: [['displayOrder', 'ASC']],
    });
  };

  const findById = async (id: string): Promise<ProductComboItemModel | null> => {
    return await model.findByPk(id, {
      include: [
        {
          model: ProductModel,
          as: 'itemProduct',
          include: [{ model: FileModel, as: 'imageFile' }],
        },
      ],
    });
  };

  const create = async (
    attributes: Partial<ProductComboItemModel>
  ): Promise<ProductComboItemModel> => {
    const created = await model.create(attributes);
    return (await findById(created.id)) as ProductComboItemModel;
  };

  const update = async (
    id: string,
    attributes: Partial<ProductComboItemModel>
  ): Promise<ProductComboItemModel | null> => {
    const comboItem = await model.findByPk(id);

    if (!comboItem) {
      return null;
    }

    await comboItem.update(attributes);
    return await findById(id);
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    const comboItem = await model.findByPk(id);

    if (!comboItem) {
      return false;
    }

    await comboItem.destroy();
    return true;
  };

  return {
    findByComboProductId,
    findById,
    create,
    update,
    delete: deleteItem,
  };
};
