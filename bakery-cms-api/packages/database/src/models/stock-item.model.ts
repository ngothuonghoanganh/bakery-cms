/**
 * StockItem Sequelize model
 * Represents raw materials/components used in product creation
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { StockItemStatus } from '@bakery-cms/common';

/**
 * StockItem model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class StockItemModel extends Model {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare unitOfMeasure: string;
  declare currentQuantity: number;
  declare reorderThreshold: number | null;
  declare status: string;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  /**
   * Compute stock status based on quantity and threshold
   * Pure function for status calculation
   */
  computeStatus(): StockItemStatus {
    if (this.currentQuantity === 0) {
      return StockItemStatus.OUT_OF_STOCK;
    }
    if (
      this.reorderThreshold !== null &&
      this.currentQuantity <= this.reorderThreshold
    ) {
      return StockItemStatus.LOW_STOCK;
    }
    return StockItemStatus.AVAILABLE;
  }
}

/**
 * Initialize StockItem model
 * Pure function that configures the model
 */
export const initStockItemModel = (
  sequelize: Sequelize
): typeof StockItemModel => {
  StockItemModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      unitOfMeasure: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 50],
        },
      },
      currentQuantity: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      reorderThreshold: {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      status: {
        type: DataTypes.ENUM(
          StockItemStatus.AVAILABLE,
          StockItemStatus.LOW_STOCK,
          StockItemStatus.OUT_OF_STOCK
        ),
        allowNull: false,
        defaultValue: StockItemStatus.AVAILABLE,
      },
    },
    {
      sequelize,
      tableName: 'stock_items',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['name'],
          name: 'idx_stock_items_name',
        },
        {
          fields: ['status'],
          name: 'idx_stock_items_status',
        },
        {
          fields: ['deleted_at'],
          name: 'idx_stock_items_deleted_at',
        },
      ],
      hooks: {
        beforeSave: (instance: StockItemModel) => {
          instance.status = instance.computeStatus();
        },
      },
    }
  );

  return StockItemModel;
};
