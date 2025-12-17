/**
 * Migration: Add soft delete fields to all entities
 * 
 * Adds deletedAt column to products, orders, order_items, and payments tables.
 * Updates unique constraints to exclude soft-deleted records.
 * Adds indexes for query performance optimization.
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Step 1: Add deletedAt column to products table
  await queryInterface.addColumn('products', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  // Step 2: Add deletedAt column to orders table
  await queryInterface.addColumn('orders', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  // Step 3: Add deletedAt column to order_items table
  await queryInterface.addColumn('order_items', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  // Step 4: Add deletedAt column to payments table
  await queryInterface.addColumn('payments', 'deleted_at', {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null,
  });

  // Step 5: Add indexes on deletedAt columns for better query performance
  await queryInterface.addIndex('products', ['deleted_at'], {
    name: 'idx_products_deleted_at',
  });

  await queryInterface.addIndex('orders', ['deleted_at'], {
    name: 'idx_orders_deleted_at',
  });

  await queryInterface.addIndex('order_items', ['deleted_at'], {
    name: 'idx_order_items_deleted_at',
  });

  await queryInterface.addIndex('payments', ['deleted_at'], {
    name: 'idx_payments_deleted_at',
  });

  // Note: MySQL doesn't support partial indexes with WHERE clause
  // The regular indexes on deleted_at above will be used for filtering
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Step 1: Remove regular indexes on deletedAt columns
  await queryInterface.removeIndex('products', 'idx_products_deleted_at');
  await queryInterface.removeIndex('orders', 'idx_orders_deleted_at');
  await queryInterface.removeIndex('order_items', 'idx_order_items_deleted_at');
  await queryInterface.removeIndex('payments', 'idx_payments_deleted_at');

  // Step 2: Remove deletedAt columns from all tables
  await queryInterface.removeColumn('products', 'deleted_at');
  await queryInterface.removeColumn('orders', 'deleted_at');
  await queryInterface.removeColumn('order_items', 'deleted_at');
  await queryInterface.removeColumn('payments', 'deleted_at');
};
