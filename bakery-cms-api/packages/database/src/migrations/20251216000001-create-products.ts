/**
 * Migration: Create products table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('products', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    business_type: {
      type: DataTypes.ENUM('MADE_TO_ORDER', 'READY_TO_SELL', 'BOTH'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'OUT_OF_STOCK'),
      allowNull: false,
      defaultValue: 'AVAILABLE',
    },
    image_url: {
      type: DataTypes.STRING(500),
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
  await queryInterface.addIndex('products', ['category'], {
    name: 'products_category_idx',
  });

  await queryInterface.addIndex('products', ['business_type'], {
    name: 'products_business_type_idx',
  });

  await queryInterface.addIndex('products', ['status'], {
    name: 'products_status_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('products');
};
