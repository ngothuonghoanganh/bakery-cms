/**
 * Migration: Add brand_id to stock_movements
 */

import { QueryInterface, DataTypes } from 'sequelize';

const TABLE_NAME = 'stock_movements';
const COLUMN_NAME = 'brand_id';
const INDEX_NAME = 'idx_sm_brand_id';

const hasIndex = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<boolean> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  return indexes.some((index) => index.name === indexName);
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const table = await queryInterface.describeTable(TABLE_NAME);

  if (!table[COLUMN_NAME]) {
    await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'brands',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  }

  if (!(await hasIndex(queryInterface, TABLE_NAME, INDEX_NAME))) {
    await queryInterface.addIndex(TABLE_NAME, [COLUMN_NAME], {
      name: INDEX_NAME,
    });
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const table = await queryInterface.describeTable(TABLE_NAME);

  if (await hasIndex(queryInterface, TABLE_NAME, INDEX_NAME)) {
    await queryInterface.removeIndex(TABLE_NAME, INDEX_NAME);
  }

  if (table[COLUMN_NAME]) {
    await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
  }
};
