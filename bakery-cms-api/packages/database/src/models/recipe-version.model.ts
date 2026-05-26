import { DataTypes, Model, Sequelize } from 'sequelize';
import {
  CostingMethod,
  RecipeVersionStatus,
  StockPurchaseUnit,
} from '@bakery-cms/common';

export class RecipeVersionModel extends Model {
  declare id: string;
  declare recipeId: string;
  declare versionNumber: number;
  declare status: string;
  declare yieldQuantity: number;
  declare yieldUnit: string;
  declare yieldBaseQuantity: number;
  declare yieldBaseUnit: string;
  declare estimatedCost: number;
  declare costingMethod: string;
  declare effectiveFrom: Date | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initRecipeVersionModel = (
  sequelize: Sequelize
): typeof RecipeVersionModel => {
  RecipeVersionModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      recipeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'recipe_id',
        references: {
          model: 'recipes',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      versionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'version_number',
        validate: {
          min: 1,
          isInt: true,
        },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(RecipeVersionStatus)),
        allowNull: false,
        defaultValue: RecipeVersionStatus.DRAFT,
      },
      yieldQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'yield_quantity',
        validate: {
          min: 0.001,
        },
      },
      yieldUnit: {
        type: DataTypes.ENUM(...Object.values(StockPurchaseUnit)),
        allowNull: false,
        field: 'yield_unit',
      },
      yieldBaseQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'yield_base_quantity',
        validate: {
          min: 0.001,
        },
      },
      yieldBaseUnit: {
        type: DataTypes.ENUM(
          StockPurchaseUnit.PIECE,
          StockPurchaseUnit.GRAM,
          StockPurchaseUnit.MILLILITER
        ),
        allowNull: false,
        field: 'yield_base_unit',
      },
      estimatedCost: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'estimated_cost',
      },
      costingMethod: {
        type: DataTypes.ENUM(...Object.values(CostingMethod)),
        allowNull: false,
        defaultValue: CostingMethod.PREFERRED_BRAND_PRICE,
        field: 'costing_method',
      },
      effectiveFrom: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'effective_from',
      },
    },
    {
      sequelize,
      tableName: 'recipe_versions',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['recipe_id'],
          name: 'idx_recipe_versions_recipe_id',
        },
        {
          fields: ['status'],
          name: 'idx_recipe_versions_status',
        },
        {
          fields: ['recipe_id', 'version_number'],
          name: 'idx_recipe_versions_unique_recipe_version',
          unique: true,
          where: {
            deleted_at: null,
          },
        },
      ],
    }
  );

  return RecipeVersionModel;
};
