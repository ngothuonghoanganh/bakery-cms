/**
 * Migration: Add product_code to products and order_items
 * Uses short product codes instead of UUID for human-facing product identifiers
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn('products', 'product_code', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  // Backfill existing products with short sequential codes: SP000001, SP000002, ...
  await queryInterface.sequelize.query(`
    UPDATE products p
    JOIN (
      SELECT sorted.id, CONCAT('SP', LPAD(@row_num := @row_num + 1, 6, '0')) AS generated_code
      FROM (
        SELECT id
        FROM products
        ORDER BY created_at ASC, id ASC
      ) sorted
      CROSS JOIN (SELECT @row_num := 0) vars
    ) seq ON p.id = seq.id
    SET p.product_code = seq.generated_code
    WHERE p.product_code IS NULL OR p.product_code = ''
  `);

  await queryInterface.changeColumn('products', 'product_code', {
    type: DataTypes.STRING(50),
    allowNull: false,
  });

  await queryInterface.addIndex('products', ['product_code'], {
    name: 'products_product_code_unique',
    unique: true,
  });

  await queryInterface.addColumn('order_items', 'product_code', {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  // Snapshot current product_code into order items
  await queryInterface.sequelize.query(`
    UPDATE order_items oi
    JOIN products p ON oi.product_id = p.id
    SET oi.product_code = p.product_code
    WHERE oi.product_code IS NULL OR oi.product_code = ''
  `);

  await queryInterface.sequelize.query(`
    UPDATE order_items
    SET product_code = 'UNKNOWN'
    WHERE product_code IS NULL OR product_code = ''
  `);

  await queryInterface.changeColumn('order_items', 'product_code', {
    type: DataTypes.STRING(50),
    allowNull: false,
  });

  await queryInterface.addIndex('order_items', ['product_code'], {
    name: 'order_items_product_code_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('order_items', 'order_items_product_code_idx');
  await queryInterface.removeColumn('order_items', 'product_code');

  await queryInterface.removeIndex('products', 'products_product_code_unique');
  await queryInterface.removeColumn('products', 'product_code');
};
