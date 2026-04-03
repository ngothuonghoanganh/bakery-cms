/**
 * Migration: Add payment_type and allow multiple payments per order
 *
 * - Adds payment_type column (payment | refund)
 * - Replaces unique order_id index with a non-unique index
 */

import { QueryInterface, DataTypes, QueryTypes } from 'sequelize';

type ShowIndexRow = {
  Key_name: string;
  Column_name: string;
  Non_unique: number;
};

const PAYMENTS_TABLE = 'payments';
const ORDER_ID_COLUMN = 'order_id';
const PAYMENT_TYPE_COLUMN = 'payment_type';
const ORDER_ID_INDEX_NAME = 'payments_order_id_idx';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDefinition = await queryInterface.describeTable(PAYMENTS_TABLE);

  if (!tableDefinition[PAYMENT_TYPE_COLUMN]) {
    await queryInterface.addColumn(PAYMENTS_TABLE, PAYMENT_TYPE_COLUMN, {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'payment',
    });
  }

  await queryInterface.sequelize.query(
    `UPDATE ${PAYMENTS_TABLE} SET ${PAYMENT_TYPE_COLUMN} = 'payment' WHERE ${PAYMENT_TYPE_COLUMN} IS NULL`
  );

  const indexes = (await queryInterface.sequelize.query(
    `SHOW INDEX FROM ${PAYMENTS_TABLE} WHERE Column_name = :columnName`,
    {
      type: QueryTypes.SELECT,
      replacements: { columnName: ORDER_ID_COLUMN },
    }
  )) as ShowIndexRow[];

  const hasNonUniqueOrderIdIndex = indexes.some(
    (index) => index.Non_unique === 1
  );

  if (!hasNonUniqueOrderIdIndex) {
    await queryInterface.addIndex(PAYMENTS_TABLE, [ORDER_ID_COLUMN], {
      name: ORDER_ID_INDEX_NAME,
      unique: false,
    });
  }

  const uniqueOrderIdIndexes = indexes
    .filter((index) => index.Non_unique === 0 && index.Key_name !== 'PRIMARY')
    .map((index) => index.Key_name);

  for (const indexName of new Set(uniqueOrderIdIndexes)) {
    await queryInterface.removeIndex(PAYMENTS_TABLE, indexName);
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const duplicateOrders = (await queryInterface.sequelize.query(
    `SELECT ${ORDER_ID_COLUMN}, COUNT(*) AS total
     FROM ${PAYMENTS_TABLE}
     GROUP BY ${ORDER_ID_COLUMN}
     HAVING COUNT(*) > 1
     LIMIT 1`,
    { type: QueryTypes.SELECT }
  )) as Array<{ order_id: string; total: number }>;

  if (duplicateOrders.length > 0) {
    throw new Error(
      'Cannot rollback payments unique order_id constraint because duplicate order payments exist.'
    );
  }

  const indexes = (await queryInterface.sequelize.query(
    `SHOW INDEX FROM ${PAYMENTS_TABLE} WHERE Column_name = :columnName`,
    {
      type: QueryTypes.SELECT,
      replacements: { columnName: ORDER_ID_COLUMN },
    }
  )) as ShowIndexRow[];

  const uniqueOrderIdIndexes = indexes.filter(
    (index) => index.Non_unique === 0 && index.Key_name !== 'PRIMARY'
  );

  if (uniqueOrderIdIndexes.length === 0) {
    await queryInterface.addIndex(PAYMENTS_TABLE, [ORDER_ID_COLUMN], {
      name: 'payments_order_id_unique',
      unique: true,
    });
  }

  if (indexes.some((index) => index.Key_name === ORDER_ID_INDEX_NAME)) {
    await queryInterface.removeIndex(PAYMENTS_TABLE, ORDER_ID_INDEX_NAME);
  }

  const tableDefinition = await queryInterface.describeTable(PAYMENTS_TABLE);
  if (tableDefinition[PAYMENT_TYPE_COLUMN]) {
    await queryInterface.removeColumn(PAYMENTS_TABLE, PAYMENT_TYPE_COLUMN);
  }
};
