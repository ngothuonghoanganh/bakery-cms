/**
 * Migration: Add image_file_id column to products table
 * Links products to the files table for image storage
 */

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn('products', 'image_file_id', {
    type: 'CHAR(36)',
    allowNull: true,
    references: {
      model: 'files',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('products', ['image_file_id'], {
    name: 'idx_products_image_file_id',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('products', 'idx_products_image_file_id');
  await queryInterface.removeColumn('products', 'image_file_id');
};
