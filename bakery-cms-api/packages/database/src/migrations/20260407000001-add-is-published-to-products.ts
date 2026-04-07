/**
 * Migration: Add is_published flag to products
 */

import { QueryInterface, DataTypes } from 'sequelize';

const TABLE_NAME = 'products';
const COLUMN_NAME = 'is_published';
const INDEX_NAME = 'products_is_published_idx';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Determines whether product is visible on storefront',
  });

  await queryInterface.addIndex(TABLE_NAME, [COLUMN_NAME], {
    name: INDEX_NAME,
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
  await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
};
