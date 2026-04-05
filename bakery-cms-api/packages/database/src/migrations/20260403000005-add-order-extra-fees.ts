/**
 * Migration: Add extra fee fields to orders
 *
 * - extra_amount: total amount from extra fees
 * - extra_fees: JSON string snapshot of per-order extra fees
 * - has_pending_extra_payment: flag to highlight paid orders with unpaid extra fees
 */

import { QueryInterface, DataTypes } from 'sequelize';

const ORDERS_TABLE = 'orders';
const EXTRA_AMOUNT_COLUMN = 'extra_amount';
const EXTRA_FEES_COLUMN = 'extra_fees';
const HAS_PENDING_EXTRA_PAYMENT_COLUMN = 'has_pending_extra_payment';
const HAS_PENDING_EXTRA_PAYMENT_INDEX = 'idx_orders_has_pending_extra_payment';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDefinition = await queryInterface.describeTable(ORDERS_TABLE);

  if (!tableDefinition[EXTRA_AMOUNT_COLUMN]) {
    await queryInterface.addColumn(ORDERS_TABLE, EXTRA_AMOUNT_COLUMN, {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });
  }

  if (!tableDefinition[EXTRA_FEES_COLUMN]) {
    await queryInterface.addColumn(ORDERS_TABLE, EXTRA_FEES_COLUMN, {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: '[]',
    });
  }

  if (!tableDefinition[HAS_PENDING_EXTRA_PAYMENT_COLUMN]) {
    await queryInterface.addColumn(ORDERS_TABLE, HAS_PENDING_EXTRA_PAYMENT_COLUMN, {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  // Backfill for existing rows to keep data consistent
  await queryInterface.sequelize.query(
    `UPDATE ${ORDERS_TABLE}
      SET ${EXTRA_AMOUNT_COLUMN} = 0
      WHERE ${EXTRA_AMOUNT_COLUMN} IS NULL`
  );
  await queryInterface.sequelize.query(
    `UPDATE ${ORDERS_TABLE}
      SET ${EXTRA_FEES_COLUMN} = '[]'
      WHERE ${EXTRA_FEES_COLUMN} IS NULL OR ${EXTRA_FEES_COLUMN} = ''`
  );
  await queryInterface.sequelize.query(
    `UPDATE ${ORDERS_TABLE}
      SET ${HAS_PENDING_EXTRA_PAYMENT_COLUMN} = FALSE
      WHERE ${HAS_PENDING_EXTRA_PAYMENT_COLUMN} IS NULL`
  );

  await queryInterface.addIndex(ORDERS_TABLE, [HAS_PENDING_EXTRA_PAYMENT_COLUMN], {
    name: HAS_PENDING_EXTRA_PAYMENT_INDEX,
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tableDefinition = await queryInterface.describeTable(ORDERS_TABLE);

  if (tableDefinition[HAS_PENDING_EXTRA_PAYMENT_COLUMN]) {
    await queryInterface.removeIndex(ORDERS_TABLE, HAS_PENDING_EXTRA_PAYMENT_INDEX);
    await queryInterface.removeColumn(ORDERS_TABLE, HAS_PENDING_EXTRA_PAYMENT_COLUMN);
  }

  if (tableDefinition[EXTRA_FEES_COLUMN]) {
    await queryInterface.removeColumn(ORDERS_TABLE, EXTRA_FEES_COLUMN);
  }

  if (tableDefinition[EXTRA_AMOUNT_COLUMN]) {
    await queryInterface.removeColumn(ORDERS_TABLE, EXTRA_AMOUNT_COLUMN);
  }
};
