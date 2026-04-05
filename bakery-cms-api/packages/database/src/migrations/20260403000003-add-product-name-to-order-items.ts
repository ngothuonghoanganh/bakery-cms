/**
 * Migration: Add product_name to order_items
 * Stores product name snapshot for order history/bill rendering
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn('order_items', 'product_name', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });

  // Backfill from products table so existing order items have names.
  await queryInterface.sequelize.query(`
    UPDATE order_items oi
    JOIN products p ON oi.product_id = p.id
    SET oi.product_name = p.name
    WHERE oi.product_name IS NULL
  `);

  await queryInterface.sequelize.query(`
    UPDATE order_items
    SET product_name = 'Unknown Product'
    WHERE product_name IS NULL OR product_name = ''
  `);

  await queryInterface.changeColumn('order_items', 'product_name', {
    type: DataTypes.STRING(255),
    allowNull: false,
  });

  await queryInterface.addIndex('order_items', ['product_name'], {
    name: 'order_items_product_name_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('order_items', 'order_items_product_name_idx');
  await queryInterface.removeColumn('order_items', 'product_name');
};
