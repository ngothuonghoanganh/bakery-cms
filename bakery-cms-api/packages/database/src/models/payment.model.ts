/**
 * Payment Sequelize model
 * Represents payment transactions for orders
 */

import { Model, DataTypes, Sequelize, Op } from 'sequelize';
import { PaymentMethod, PaymentStatus } from '@bakery-cms/common';

/**
 * Payment model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class PaymentModel extends Model {
  declare id: string;
  declare orderId: string;
  declare amount: number;
  declare method: string;
  declare status: string;
  declare transactionId: string | null;
  declare vietqrData: string | null;
  declare paidAt: Date | null;
  declare notes: string | null;
  declare deletedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize Payment model
 * Pure function that configures the model
 */
export const initPaymentModel = (sequelize: Sequelize): typeof PaymentModel => {
  PaymentModel.init(
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
        unique: true,
        field: 'order_id',
        references: {
          model: 'orders',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
          isDecimal: true,
        },
      },
      method: {
        type: DataTypes.ENUM(...Object.values(PaymentMethod)),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(PaymentStatus)),
        allowNull: false,
        defaultValue: PaymentStatus.PENDING,
      },
      transactionId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'transaction_id',
      },
      vietqrData: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'vietqr_data',
        comment: 'JSON string containing VietQR data',
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at',
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
      tableName: 'payments',
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
          fields: ['order_id'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['method'],
        },
        {
          fields: ['transaction_id'],
        },
        {
          fields: ['paid_at'],
        },
        {
          fields: ['deleted_at'],
          name: 'idx_payments_deleted_at',
        },
      ],
    }
  );

  return PaymentModel;
};
