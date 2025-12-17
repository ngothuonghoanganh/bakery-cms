/**
 * Order Sequelize model
 * Represents customer orders with state management
 */

import { Model, DataTypes, Sequelize, Op } from 'sequelize';
import { OrderStatus, OrderType, BusinessModel } from '@bakery-cms/common';

/**
 * Order model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class OrderModel extends Model {
  declare id: string;
  declare orderNumber: string;
  declare orderType: string;
  declare businessModel: string;
  declare totalAmount: number;
  declare status: string;
  declare customerName: string | null;
  declare customerPhone: string | null;
  declare notes: string | null;
  declare confirmedAt: Date | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Order model
 * Pure function that configures the model
 */
export const initOrderModel = (sequelize: Sequelize): typeof OrderModel => {
  OrderModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        field: 'order_number',
      },
      orderType: {
        type: DataTypes.ENUM(...Object.values(OrderType)),
        allowNull: false,
        defaultValue: OrderType.TEMPORARY,
        field: 'order_type',
      },
      businessModel: {
        type: DataTypes.ENUM(...Object.values(BusinessModel)),
        allowNull: false,
        field: 'business_model',
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'total_amount',
        validate: {
          min: 0,
          isDecimal: true,
        },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
        defaultValue: OrderStatus.DRAFT,
      },
      customerName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'customer_name',
      },
      customerPhone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'customer_phone',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'confirmed_at',
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
      tableName: 'orders',
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
          unique: true,
          fields: ['order_number'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['order_type'],
        },
        {
          fields: ['business_model'],
        },
        {
          fields: ['customer_phone'],
        },
        {
          fields: ['created_at'],
        },
        {
          fields: ['deleted_at'],
          name: 'idx_orders_deleted_at',
        },
      ],
    }
  );

  return OrderModel;
};
