/**
 * Migration: Create stock_items table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('stock_items', {
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
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unit_of_measure: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    current_quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
    },
    reorder_threshold: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('available', 'low_stock', 'out_of_stock'),
      allowNull: false,
      defaultValue: 'available',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes
  await queryInterface.addIndex('stock_items', ['name'], {
    name: 'idx_stock_items_name',
  });

  await queryInterface.addIndex('stock_items', ['status'], {
    name: 'idx_stock_items_status',
  });

  await queryInterface.addIndex('stock_items', ['deleted_at'], {
    name: 'idx_stock_items_deleted_at',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('stock_items');
};
