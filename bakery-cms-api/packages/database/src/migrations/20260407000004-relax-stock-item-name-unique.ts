/**
 * Migration: Relax stock_items.name unique constraint for soft delete
 *
 * MySQL does not support partial unique indexes (WHERE deleted_at IS NULL),
 * so we remove the DB-level unique constraint and enforce "active-only" uniqueness
 * in the API service layer.
 */

import { QueryInterface, QueryTypes } from 'sequelize';

type ShowIndexRow = {
  Key_name: string;
  Column_name: string;
  Non_unique: number;
};

const STOCK_ITEMS_TABLE = 'stock_items';
const NAME_COLUMN = 'name';
const NAME_UNIQUE_INDEX = 'stock_items_name_unique';

const getNameIndexes = async (
  queryInterface: QueryInterface
): Promise<ShowIndexRow[]> => {
  return (await queryInterface.sequelize.query(
    `SHOW INDEX FROM ${STOCK_ITEMS_TABLE} WHERE Column_name = :columnName`,
    {
      type: QueryTypes.SELECT,
      replacements: { columnName: NAME_COLUMN },
    }
  )) as ShowIndexRow[];
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const indexes = await getNameIndexes(queryInterface);

  const uniqueNameIndexes = indexes
    .filter((index) => index.Non_unique === 0 && index.Key_name !== 'PRIMARY')
    .map((index) => index.Key_name);

  for (const indexName of new Set(uniqueNameIndexes)) {
    await queryInterface.removeIndex(STOCK_ITEMS_TABLE, indexName);
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const duplicateActiveNames = (await queryInterface.sequelize.query(
    `SELECT ${NAME_COLUMN}, COUNT(*) AS total
     FROM ${STOCK_ITEMS_TABLE}
     WHERE deleted_at IS NULL
     GROUP BY ${NAME_COLUMN}
     HAVING COUNT(*) > 1
     LIMIT 1`,
    { type: QueryTypes.SELECT }
  )) as Array<{ name: string; total: number }>;

  if (duplicateActiveNames.length > 0) {
    throw new Error(
      'Cannot restore unique constraint on stock_items.name because active duplicate names exist.'
    );
  }

  const indexes = await getNameIndexes(queryInterface);
  const hasUniqueNameIndex = indexes.some(
    (index) => index.Non_unique === 0 && index.Key_name !== 'PRIMARY'
  );

  if (!hasUniqueNameIndex) {
    await queryInterface.addIndex(STOCK_ITEMS_TABLE, [NAME_COLUMN], {
      name: NAME_UNIQUE_INDEX,
      unique: true,
    });
  }
};

