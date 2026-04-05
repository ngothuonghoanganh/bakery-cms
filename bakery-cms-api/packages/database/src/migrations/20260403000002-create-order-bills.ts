/**
 * Migration: Create order_bills table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('order_bills', {
    id: {
      type: DataTypes.STRING(36),
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    order_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    bill_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'voided'),
      allowNull: false,
      defaultValue: 'active',
    },
    snapshot: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    void_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    voided_at: {
      type: DataTypes.DATE,
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

  await queryInterface.addIndex('order_bills', ['order_id'], {
    name: 'order_bills_order_id_idx',
  });

  await queryInterface.addIndex('order_bills', ['status'], {
    name: 'order_bills_status_idx',
  });

  await queryInterface.addIndex('order_bills', ['order_id', 'version'], {
    name: 'order_bills_order_version_unique',
    unique: true,
  });

  await queryInterface.addIndex('order_bills', ['created_at'], {
    name: 'order_bills_created_at_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('order_bills');
};
