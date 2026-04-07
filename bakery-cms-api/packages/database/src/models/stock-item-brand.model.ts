/**
 * StockItemBrand Sequelize model
 * Junction table linking stock items to brands with pricing
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { StockPurchaseUnit } from '@bakery-cms/common';

/**
 * StockItemBrand model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class StockItemBrandModel extends Model {
  declare id: string;
  declare stockItemId: string;
  declare brandId: string;
  declare purchaseQuantity: number;
  declare purchaseUnit: string;
  declare priceBeforeTax: number;
  declare priceAfterTax: number;
  declare unitPriceBeforeTax: number;
  declare unitPriceAfterTax: number;
  declare isPreferred: boolean;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize StockItemBrand model
 * Pure function that configures the model
 */
export const initStockItemBrandModel = (
  sequelize: Sequelize
): typeof StockItemBrandModel => {
  StockItemBrandModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      stockItemId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'stock_item_id',
        references: {
          model: 'stock_items',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      brandId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'brand_id',
        references: {
          model: 'brands',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      purchaseQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        defaultValue: 1,
        field: 'purchase_quantity',
        validate: {
          min: 0.001,
        },
      },
      purchaseUnit: {
        type: DataTypes.ENUM(...Object.values(StockPurchaseUnit)),
        allowNull: false,
        defaultValue: StockPurchaseUnit.PIECE,
        field: 'purchase_unit',
      },
      priceBeforeTax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'price_before_tax',
        validate: {
          min: 0,
        },
      },
      priceAfterTax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'price_after_tax',
        validate: {
          min: 0,
          isGreaterThanOrEqualToBeforeTax(this: StockItemBrandModel, value: number) {
            if (value < this.priceBeforeTax) {
              throw new Error(
                'Price after tax must be greater than or equal to price before tax'
              );
            }
          },
        },
      },
      unitPriceBeforeTax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price_before_tax',
        validate: {
          min: 0,
        },
      },
      unitPriceAfterTax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        field: 'unit_price_after_tax',
        validate: {
          min: 0,
          isGreaterThanOrEqualToUnitBeforeTax(
            this: StockItemBrandModel,
            value: number
          ) {
            if (value < this.unitPriceBeforeTax) {
              throw new Error(
                'Unit price after tax must be greater than or equal to unit price before tax'
              );
            }
          },
        },
      },
      isPreferred: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_preferred',
      },
    },
    {
      sequelize,
      tableName: 'stock_item_brands',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['stock_item_id'],
          name: 'idx_sib_stock_item_id',
        },
        {
          fields: ['brand_id'],
          name: 'idx_sib_brand_id',
        },
        {
          fields: ['purchase_unit'],
          name: 'idx_sib_purchase_unit',
        },
        {
          fields: ['stock_item_id', 'brand_id'],
          unique: true,
          name: 'idx_sib_unique',
          where: {
            deleted_at: null,
          },
        },
      ],
    }
  );

  return StockItemBrandModel;
};
