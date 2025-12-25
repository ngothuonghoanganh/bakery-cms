/**
 * ProductStockItem Sequelize model
 * Junction table linking products to stock items (recipe/BOM)
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * ProductStockItem model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class ProductStockItemModel extends Model {
  declare id: string;
  declare productId: string;
  declare stockItemId: string;
  declare quantity: number;
  declare preferredBrandId: string | null;
  declare notes: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize ProductStockItem model
 * Pure function that configures the model
 */
export const initProductStockItemModel = (
  sequelize: Sequelize
): typeof ProductStockItemModel => {
  ProductStockItemModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      productId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'product_id',
        references: {
          model: 'products',
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
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        validate: {
          min: 0.001,
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
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'product_stock_items',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['product_id'],
          name: 'idx_psi_product_id',
        },
        {
          fields: ['stock_item_id'],
          name: 'idx_psi_stock_item_id',
        },
        {
          fields: ['product_id', 'stock_item_id'],
          unique: true,
          name: 'idx_psi_unique',
          where: {
            deleted_at: null,
          },
        },
      ],
    }
  );

  return ProductStockItemModel;
};
