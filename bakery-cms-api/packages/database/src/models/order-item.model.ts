/**
 * OrderItem Sequelize model
 * Represents individual line items within orders
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * OrderItem model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class OrderItemModel extends Model {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare quantity: number;
  declare unitPrice: number;
  declare subtotal: number;
  declare notes: string | null;
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          isInt: true,
        },
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
    },
    {
      sequelize,
      tableName: 'order_items',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['order_id'],
        },
        {
          fields: ['product_id'],
        },
        {
          unique: true,
          fields: ['order_id', 'product_id'],
        },
      ],
    }
  );

  return OrderItemModel;
};
