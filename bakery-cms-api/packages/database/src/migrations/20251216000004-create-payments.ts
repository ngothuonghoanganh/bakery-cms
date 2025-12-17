/**
 * Migration: Create payments table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('payments', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
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
    },
    method: {
      type: DataTypes.ENUM('CASH', 'BANK_TRANSFER', 'VIETQR'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    vietqr_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Create indexes
  await queryInterface.addIndex('payments', ['order_id'], {
    name: 'payments_order_id_unique',
    unique: true,
  });

  await queryInterface.addIndex('payments', ['status'], {
    name: 'payments_status_idx',
  });

  await queryInterface.addIndex('payments', ['method'], {
    name: 'payments_method_idx',
  });

  await queryInterface.addIndex('payments', ['transaction_id'], {
    name: 'payments_transaction_id_idx',
  });

  await queryInterface.addIndex('payments', ['paid_at'], {
    name: 'payments_paid_at_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('payments');
};
