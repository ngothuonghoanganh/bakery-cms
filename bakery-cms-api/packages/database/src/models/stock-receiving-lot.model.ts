/**
 * StockReceivingLot Sequelize model
 * Represents a single stock receiving event with lot-level pricing snapshot.
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { StockPurchaseUnit } from '@bakery-cms/common';

export class StockReceivingLotModel extends Model {
  declare id: string;
  declare stockItemId: string;
  declare brandId: string;
  declare receivedQuantity: number;
  declare receivedUnit: string;
  declare receivedQuantityBase: number;
  declare baseUnit: string;
  declare priceBeforeTax: number;
  declare priceAfterTax: number;
  declare unitPriceBeforeTax: number;
  declare unitPriceAfterTax: number;
  declare remainingQuantityBase: number;
  declare receivedAt: Date;
  declare supplierName: string | null;
  declare invoiceCode: string | null;
  declare note: string | null;
  declare createdByUserId: string;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

export const initStockReceivingLotModel = (
  sequelize: Sequelize
): typeof StockReceivingLotModel => {
  StockReceivingLotModel.init(
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
        onDelete: 'RESTRICT',
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
      receivedQuantity: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'received_quantity',
        validate: {
          min: 0.001,
        },
      },
      receivedUnit: {
        type: DataTypes.ENUM(...Object.values(StockPurchaseUnit)),
        allowNull: false,
        field: 'received_unit',
      },
      receivedQuantityBase: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'received_quantity_base',
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
          isGreaterThanOrEqualToBeforeTax(this: StockReceivingLotModel, value: number) {
            if (value < Number(this.priceBeforeTax)) {
              throw new Error(
                'Price after tax must be greater than or equal to price before tax'
              );
            }
          },
        },
      },
      unitPriceBeforeTax: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        field: 'unit_price_before_tax',
        validate: {
          min: 0,
        },
      },
      unitPriceAfterTax: {
        type: DataTypes.DECIMAL(14, 4),
        allowNull: false,
        field: 'unit_price_after_tax',
        validate: {
          min: 0,
          isGreaterThanOrEqualToUnitBeforeTax(
            this: StockReceivingLotModel,
            value: number
          ) {
            if (value < Number(this.unitPriceBeforeTax)) {
              throw new Error(
                'Unit price after tax must be greater than or equal to unit price before tax'
              );
            }
          },
        },
      },
      remainingQuantityBase: {
        type: DataTypes.DECIMAL(12, 3),
        allowNull: false,
        field: 'remaining_quantity_base',
        validate: {
          min: 0,
        },
      },
      receivedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'received_at',
      },
      supplierName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'supplier_name',
      },
      invoiceCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'invoice_code',
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdByUserId: {
        // NOTE: users.id is stored as CHAR(36) (legacy), keep FK type compatible.
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'created_by_user_id',
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
    },
    {
      sequelize,
      tableName: 'stock_receiving_lots',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        {
          fields: ['stock_item_id'],
          name: 'idx_srl_stock_item_id',
        },
        {
          fields: ['brand_id'],
          name: 'idx_srl_brand_id',
        },
        {
          fields: ['received_at'],
          name: 'idx_srl_received_at',
        },
        {
          fields: ['stock_item_id', 'brand_id'],
          name: 'idx_srl_stock_item_brand',
        },
        {
          fields: ['deleted_at'],
          name: 'idx_srl_deleted_at',
        },
      ],
    }
  );

  return StockReceivingLotModel;
};
