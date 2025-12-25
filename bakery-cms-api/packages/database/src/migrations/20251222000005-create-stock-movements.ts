/**
 * Migration: Create stock_movements table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('stock_movements', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    stock_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stock_items',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('received', 'used', 'adjusted', 'damaged', 'expired'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    previous_quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    new_quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    user_id: {
      type: 'CHAR(36)',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Create indexes
  await queryInterface.addIndex('stock_movements', ['stock_item_id'], {
    name: 'idx_sm_stock_item_id',
  });

  await queryInterface.addIndex('stock_movements', ['type'], {
    name: 'idx_sm_type',
  });

  await queryInterface.addIndex('stock_movements', ['created_at'], {
    name: 'idx_sm_created_at',
  });

  await queryInterface.addIndex('stock_movements', ['user_id'], {
    name: 'idx_sm_user_id',
  });

  await queryInterface.addIndex('stock_movements', ['reference_type', 'reference_id'], {
    name: 'idx_sm_reference',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('stock_movements');
};
