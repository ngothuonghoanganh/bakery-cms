/**
 * Migration: Create product_stock_items table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('product_stock_items', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    product_id: {
      type: 'CHAR(36)',
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
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
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    preferred_brand_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'brands',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes
  await queryInterface.addIndex('product_stock_items', ['product_id'], {
    name: 'idx_psi_product_id',
  });

  await queryInterface.addIndex('product_stock_items', ['stock_item_id'], {
    name: 'idx_psi_stock_item_id',
  });

  // Unique constraint on product_id + stock_item_id where not deleted
  await queryInterface.addIndex(
    'product_stock_items',
    ['product_id', 'stock_item_id'],
    {
      name: 'idx_psi_unique',
      unique: true,
      where: {
        deleted_at: null,
      },
    }
  );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('product_stock_items');
};
