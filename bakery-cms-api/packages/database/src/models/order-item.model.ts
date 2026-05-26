/**
 * OrderItem Sequelize model
 * Represents individual line items within orders
 */

import { Model, DataTypes, Sequelize, Op } from 'sequelize';
import { SaleUnitType, StockPurchaseUnit } from '@bakery-cms/common';

/**
 * OrderItem model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class OrderItemModel extends Model {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare productCode: string;
  declare productName: string;
  declare saleUnitType: string;
  declare quantity: number;
  declare saleUnit: string;
  declare saleQuantityBase: number;
  declare saleBaseUnit: string;
  declare recipeId: string | null;
  declare recipeVersionId: string | null;
  declare recipeNameSnapshot: string | null;
  declare recipeVersionSnapshot: number | null;
  declare recipeEstimatedCostSnapshot: number | null;
  declare unitPrice: number;
  declare subtotal: number;
  declare notes: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize OrderItem model
 * Pure function that configures the model
 */
export const initOrderItemModel = (sequelize: Sequelize): typeof OrderItemModel => {
  OrderItemModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'order_id',
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      productName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'product_name',
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      productCode: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'product_code',
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      saleUnitType: {
        type: DataTypes.ENUM(...Object.values(SaleUnitType)),
        allowNull: false,
        defaultValue: SaleUnitType.PIECE,
        field: 'sale_unit_type',
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        validate: {
          min: 0.001,
          isDecimal: true,
        },
      },
      saleUnit: {
        type: DataTypes.ENUM(...Object.values(StockPurchaseUnit)),
        allowNull: false,
        defaultValue: StockPurchaseUnit.PIECE,
        field: 'sale_unit',
      },
      saleQuantityBase: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'sale_quantity_base',
        validate: {
          min: 0.001,
          isDecimal: true,
        },
      },
      saleBaseUnit: {
        type: DataTypes.ENUM(
          StockPurchaseUnit.PIECE,
          StockPurchaseUnit.GRAM,
          StockPurchaseUnit.MILLILITER
        ),
        allowNull: false,
        defaultValue: StockPurchaseUnit.PIECE,
        field: 'sale_base_unit',
      },
      recipeId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'recipe_id',
        references: {
          model: 'recipes',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      recipeVersionId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'recipe_version_id',
        references: {
          model: 'recipe_versions',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      recipeNameSnapshot: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'recipe_name_snapshot',
      },
      recipeVersionSnapshot: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'recipe_version_snapshot',
      },
      recipeEstimatedCostSnapshot: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: true,
        field: 'recipe_estimated_cost_snapshot',
      },
      unitPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'unit_price',
        validate: {
          min: 0,
          isDecimal: true,
        },
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          isDecimal: true,
        },
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 500],
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
    },
    {
      sequelize,
      tableName: 'order_items',
      timestamps: true,
      underscored: true,
      paranoid: true,
      deletedAt: 'deletedAt',
      defaultScope: {
        where: {
          deletedAt: null,
        },
      },
      scopes: {
        withDeleted: {
          where: {},
        },
        onlyDeleted: {
          where: {
            deletedAt: { [Op.ne]: null },
          },
        },
      },
      indexes: [
        {
          fields: ['order_id'],
        },
        {
          fields: ['product_id'],
        },
        {
          fields: ['product_name'],
        },
        {
          fields: ['product_code'],
        },
        {
          fields: ['sale_unit_type'],
          name: 'idx_order_items_sale_unit_type',
        },
        {
          fields: ['recipe_id'],
          name: 'idx_order_items_recipe_id',
        },
        {
          fields: ['recipe_version_id'],
          name: 'idx_order_items_recipe_version_id',
        },
        {
          unique: true,
          fields: ['order_id', 'product_id'],
        },
        {
          fields: ['deleted_at'],
          name: 'idx_order_items_deleted_at',
        },
      ],
    }
  );

  return OrderItemModel;
};
