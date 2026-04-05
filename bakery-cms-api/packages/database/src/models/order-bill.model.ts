/**
 * OrderBill Sequelize model
 * Stores bill snapshots for orders (versioned and recoverable)
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

export enum OrderBillStatus {
  ACTIVE = 'active',
  VOIDED = 'voided',
}

export class OrderBillModel extends Model {
  declare id: string;
  declare orderId: string;
  declare billNumber: string;
  declare version: number;
  declare status: OrderBillStatus;
  declare snapshot: Record<string, unknown>;
  declare voidReason: string | null;
  declare voidedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize OrderBill model
 */
export const initOrderBillModel = (sequelize: Sequelize): typeof OrderBillModel => {
  OrderBillModel.init(
    {
      id: {
        type: DataTypes.STRING(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orderId: {
        type: DataTypes.STRING(36),
        allowNull: false,
        field: 'order_id',
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      billNumber: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'bill_number',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(OrderBillStatus)),
        allowNull: false,
        defaultValue: OrderBillStatus.ACTIVE,
      },
      snapshot: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      voidReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'void_reason',
        validate: {
          len: [0, 1000],
        },
      },
      voidedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'voided_at',
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
      tableName: 'order_bills',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['order_id'],
        },
        {
          fields: ['status'],
        },
        {
          unique: true,
          fields: ['order_id', 'version'],
        },
        {
          fields: ['created_at'],
        },
      ],
    }
  );

  return OrderBillModel;
};
