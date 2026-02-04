/**
 * Migration: Add image_file_id column to brands table
 * Links brands to the files table for logo/image storage
 */

import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn('brands', 'image_file_id', {
    type: 'CHAR(36)',
    allowNull: true,
    references: {
      model: 'files',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });

  await queryInterface.addIndex('brands', ['image_file_id'], {
    name: 'idx_brands_image_file_id',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('brands', 'idx_brands_image_file_id');
  await queryInterface.removeColumn('brands', 'image_file_id');
};
