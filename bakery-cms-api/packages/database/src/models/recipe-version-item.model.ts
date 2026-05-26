import { DataTypes, Model, Sequelize } from 'sequelize';
import { StockPurchaseUnit } from '@bakery-cms/common';

export class RecipeVersionItemModel extends Model {
  declare id: string;
  declare recipeVersionId: string;
  declare stockItemId: string;
  declare quantity: number;
  declare unit: string;
  declare baseQuantity: number;
  declare baseUnit: string;
  declare wastePercent: number;
  declare preferredBrandId: string | null;
  declare unitCostSnapshot: number;
  declare totalCostSnapshot: number;
  declare note: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initRecipeVersionItemModel = (
  sequelize: Sequelize
): typeof RecipeVersionItemModel => {
  RecipeVersionItemModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      recipeVersionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'recipe_version_id',
        references: {
          model: 'recipe_versions',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      stockItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'stock_item_id',
        references: {
          model: 'stock_items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        validate: {
          min: 0.001,
        },
      },
      unit: {
        type: DataTypes.ENUM(...Object.values(StockPurchaseUnit)),
        allowNull: false,
      },
      baseQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'base_quantity',
        validate: {
          min: 0.001,
        },
      },
      baseUnit: {
        type: DataTypes.ENUM(
          StockPurchaseUnit.PIECE,
          StockPurchaseUnit.GRAM,
          StockPurchaseUnit.MILLILITER
        ),
        allowNull: false,
        field: 'base_unit',
      },
      wastePercent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'waste_percent',
        validate: {
          min: 0,
        },
      },
      preferredBrandId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'preferred_brand_id',
        references: {
          model: 'brands',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      unitCostSnapshot: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'unit_cost_snapshot',
      },
      totalCostSnapshot: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        defaultValue: 0,
        field: 'total_cost_snapshot',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'recipe_version_items',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['recipe_version_id'],
          name: 'idx_rvi_recipe_version_id',
        },
        {
          fields: ['stock_item_id'],
          name: 'idx_rvi_stock_item_id',
        },
        {
          fields: ['preferred_brand_id'],
          name: 'idx_rvi_preferred_brand_id',
        },
      ],
    }
  );

  return RecipeVersionItemModel;
};
