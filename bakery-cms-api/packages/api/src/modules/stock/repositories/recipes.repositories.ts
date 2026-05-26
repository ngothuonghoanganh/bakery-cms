import { Transaction } from 'sequelize';
import {
  BrandModel,
  RecipeModel,
  RecipeVersionItemModel,
  RecipeVersionModel,
  StockItemModel,
} from '@bakery-cms/database';
import { RecipeStatus, RecipeVersionStatus } from '@bakery-cms/common';

export interface RecipeRepository {
  findByProductId(productId: string): Promise<RecipeModel[]>;
  findById(productId: string, recipeId: string): Promise<RecipeModel | null>;
  create(attributes: Partial<RecipeModel>): Promise<RecipeModel>;
  update(
    recipeId: string,
    attributes: Partial<RecipeModel>
  ): Promise<RecipeModel | null>;
  clearDefaultActiveByProduct(
    productId: string,
    transaction?: Transaction
  ): Promise<void>;
  findVersionById(
    recipeId: string,
    versionId: string
  ): Promise<RecipeVersionModel | null>;
  findActiveVersionByIdForProduct(
    productId: string,
    versionId: string
  ): Promise<(RecipeVersionModel & { recipe?: RecipeModel }) | null>;
  findDefaultActiveVersionByProduct(
    productId: string
  ): Promise<(RecipeVersionModel & { recipe?: RecipeModel }) | null>;
  createVersion(attributes: Partial<RecipeVersionModel>): Promise<RecipeVersionModel>;
  updateVersion(
    versionId: string,
    attributes: Partial<RecipeVersionModel>
  ): Promise<RecipeVersionModel | null>;
  getNextVersionNumber(recipeId: string): Promise<number>;
  findVersionDetail(
    recipeId: string,
    versionId: string
  ): Promise<
    | (RecipeVersionModel & {
        items?: Array<
          RecipeVersionItemModel & {
            stockItem?: StockItemModel;
            preferredBrand?: BrandModel;
          }
        >;
      })
    | null
  >;
  findVersionItems(
    versionId: string
  ): Promise<
    Array<
      RecipeVersionItemModel & {
        stockItem?: StockItemModel;
        preferredBrand?: BrandModel;
      }
    >
  >;
  createVersionItem(
    attributes: Partial<RecipeVersionItemModel>
  ): Promise<RecipeVersionItemModel>;
  findVersionItem(
    versionId: string,
    itemId: string
  ): Promise<RecipeVersionItemModel | null>;
  updateVersionItem(
    itemId: string,
    attributes: Partial<RecipeVersionItemModel>
  ): Promise<RecipeVersionItemModel | null>;
  deleteVersionItem(versionId: string, itemId: string): Promise<boolean>;
}

export const createRecipeRepository = (
  recipeModel: typeof RecipeModel,
  recipeVersionModel: typeof RecipeVersionModel,
  recipeVersionItemModel: typeof RecipeVersionItemModel
): RecipeRepository => {
  const itemIncludes = [
    {
      model: StockItemModel,
      as: 'stockItem',
      attributes: ['id', 'name', 'unitType', 'unitOfMeasure', 'baseUnit'],
    },
    {
      model: BrandModel,
      as: 'preferredBrand',
      attributes: ['id', 'name'],
    },
  ] as const;

  const findByProductId = async (productId: string): Promise<RecipeModel[]> => {
    return await recipeModel.findAll({
      where: { productId },
      include: [
        {
          model: recipeVersionModel,
          as: 'versions',
          where: {
            deletedAt: null,
          },
          required: false,
        },
      ],
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'ASC'],
      ],
    });
  };

  const findById = async (
    productId: string,
    recipeId: string
  ): Promise<RecipeModel | null> => {
    return await recipeModel.findOne({
      where: { id: recipeId, productId },
    });
  };

  const create = async (attributes: Partial<RecipeModel>): Promise<RecipeModel> => {
    return await recipeModel.create(attributes);
  };

  const update = async (
    recipeId: string,
    attributes: Partial<RecipeModel>
  ): Promise<RecipeModel | null> => {
    const recipe = await recipeModel.findByPk(recipeId);
    if (!recipe) {
      return null;
    }

    await recipe.update(attributes);
    return recipe;
  };

  const clearDefaultActiveByProduct = async (
    productId: string,
    transaction?: Transaction
  ): Promise<void> => {
    await recipeModel.update(
      { isDefault: false },
      {
        where: {
          productId,
          isDefault: true,
          status: RecipeStatus.ACTIVE,
        },
        transaction,
      }
    );
  };

  const findVersionById = async (
    recipeId: string,
    versionId: string
  ): Promise<RecipeVersionModel | null> => {
    return await recipeVersionModel.findOne({
      where: {
        id: versionId,
        recipeId,
      },
    });
  };

  const findActiveVersionByIdForProduct = async (
    productId: string,
    versionId: string
  ): Promise<(RecipeVersionModel & { recipe?: RecipeModel }) | null> => {
    return (await recipeVersionModel.findOne({
      where: {
        id: versionId,
        status: RecipeVersionStatus.ACTIVE,
      },
      include: [
        {
          model: recipeModel,
          as: 'recipe',
          required: true,
          where: {
            productId,
            status: RecipeStatus.ACTIVE,
          },
        },
      ],
    })) as RecipeVersionModel & { recipe?: RecipeModel } | null;
  };

  const findDefaultActiveVersionByProduct = async (
    productId: string
  ): Promise<(RecipeVersionModel & { recipe?: RecipeModel }) | null> => {
    return (await recipeVersionModel.findOne({
      where: {
        status: RecipeVersionStatus.ACTIVE,
      },
      include: [
        {
          model: recipeModel,
          as: 'recipe',
          required: true,
          where: {
            productId,
            isDefault: true,
            status: RecipeStatus.ACTIVE,
          },
        },
      ],
      order: [['versionNumber', 'DESC']],
    })) as RecipeVersionModel & { recipe?: RecipeModel } | null;
  };

  const createVersion = async (
    attributes: Partial<RecipeVersionModel>
  ): Promise<RecipeVersionModel> => {
    return await recipeVersionModel.create(attributes);
  };

  const updateVersion = async (
    versionId: string,
    attributes: Partial<RecipeVersionModel>
  ): Promise<RecipeVersionModel | null> => {
    const version = await recipeVersionModel.findByPk(versionId);
    if (!version) {
      return null;
    }

    await version.update(attributes);
    return version;
  };

  const getNextVersionNumber = async (recipeId: string): Promise<number> => {
    const version = await recipeVersionModel.findOne({
      where: {
        recipeId,
      },
      order: [['versionNumber', 'DESC']],
    });

    return (version?.versionNumber ?? 0) + 1;
  };

  const findVersionDetail = async (
    recipeId: string,
    versionId: string
  ): Promise<
    | (RecipeVersionModel & {
        items?: Array<
          RecipeVersionItemModel & {
            stockItem?: StockItemModel;
            preferredBrand?: BrandModel;
          }
        >;
      })
    | null
  > => {
    return (await recipeVersionModel.findOne({
      where: {
        id: versionId,
        recipeId,
      },
      include: [
        {
          model: recipeVersionItemModel,
          as: 'items',
          include: itemIncludes as any,
          required: false,
        },
      ],
    })) as
      | (RecipeVersionModel & {
          items?: Array<
            RecipeVersionItemModel & {
              stockItem?: StockItemModel;
              preferredBrand?: BrandModel;
            }
          >;
        })
      | null;
  };

  const findVersionItems = async (
    versionId: string
  ): Promise<
    Array<
      RecipeVersionItemModel & {
        stockItem?: StockItemModel;
        preferredBrand?: BrandModel;
      }
    >
  > => {
    return (await recipeVersionItemModel.findAll({
      where: {
        recipeVersionId: versionId,
      },
      include: itemIncludes as any,
      order: [['createdAt', 'ASC']],
    })) as Array<
      RecipeVersionItemModel & {
        stockItem?: StockItemModel;
        preferredBrand?: BrandModel;
      }
    >;
  };

  const createVersionItem = async (
    attributes: Partial<RecipeVersionItemModel>
  ): Promise<RecipeVersionItemModel> => {
    return await recipeVersionItemModel.create(attributes);
  };

  const findVersionItem = async (
    versionId: string,
    itemId: string
  ): Promise<RecipeVersionItemModel | null> => {
    return await recipeVersionItemModel.findOne({
      where: {
        id: itemId,
        recipeVersionId: versionId,
      },
    });
  };

  const updateVersionItem = async (
    itemId: string,
    attributes: Partial<RecipeVersionItemModel>
  ): Promise<RecipeVersionItemModel | null> => {
    const item = await recipeVersionItemModel.findByPk(itemId);
    if (!item) {
      return null;
    }

    await item.update(attributes);
    return item;
  };

  const deleteVersionItem = async (
    versionId: string,
    itemId: string
  ): Promise<boolean> => {
    const rows = await recipeVersionItemModel.destroy({
      where: {
        id: itemId,
        recipeVersionId: versionId,
      },
    });

    return rows > 0;
  };

  return {
    findByProductId,
    findById,
    create,
    update,
    clearDefaultActiveByProduct,
    findVersionById,
    findActiveVersionByIdForProduct,
    findDefaultActiveVersionByProduct,
    createVersion,
    updateVersion,
    getNextVersionNumber,
    findVersionDetail,
    findVersionItems,
    createVersionItem,
    findVersionItem,
    updateVersionItem,
    deleteVersionItem,
  };
};
