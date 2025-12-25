/**
 * Migration: Create stock_item_brands table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('stock_item_brands', {
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'brands',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    price_before_tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    price_after_tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    is_preferred: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
  await queryInterface.addIndex('stock_item_brands', ['stock_item_id'], {
    name: 'idx_sib_stock_item_id',
  });

  await queryInterface.addIndex('stock_item_brands', ['brand_id'], {
    name: 'idx_sib_brand_id',
  });

  // Unique constraint on stock_item_id + brand_id where not deleted
  await queryInterface.addIndex(
    'stock_item_brands',
    ['stock_item_id', 'brand_id'],
    {
      name: 'idx_sib_unique',
      unique: true,
      where: {
        deleted_at: null,
      },
    }
  );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('stock_item_brands');
};
