/**
 * Migration: Create product_images junction table
 * Links products to multiple images with ordering support
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('product_images', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    file_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: {
        model: 'files',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // Add indexes
  await queryInterface.addIndex('product_images', ['product_id'], {
    name: 'idx_product_images_product_id',
  });

  await queryInterface.addIndex('product_images', ['file_id'], {
    name: 'idx_product_images_file_id',
  });

  await queryInterface.addIndex('product_images', ['product_id', 'file_id'], {
    name: 'idx_product_images_product_file',
    unique: true,
  });

  await queryInterface.addIndex('product_images', ['product_id', 'display_order'], {
    name: 'idx_product_images_display_order',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('product_images');
};
