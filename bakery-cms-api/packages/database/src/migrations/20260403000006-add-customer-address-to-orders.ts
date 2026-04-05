/**
 * Migration: Add customer address to orders
 */

import { QueryInterface, DataTypes } from 'sequelize';

const TABLE_NAME = 'orders';
const COLUMN_NAME = 'customer_address';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn(TABLE_NAME, COLUMN_NAME, {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Customer receiving/shipping address',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
};

