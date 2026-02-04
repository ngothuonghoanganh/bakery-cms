/**
 * Migration: Add default timestamps for core tables
 * Ensures created_at/updated_at have defaults at the DB level
 */

import { QueryInterface } from 'sequelize';

const tables = ['products', 'files', 'product_images'];

const updateNullTimestamps = async (queryInterface: QueryInterface, table: string): Promise<void> => {
  await queryInterface.sequelize.query(
    `UPDATE \`${table}\` SET created_at = NOW() WHERE created_at IS NULL;`
  );
  await queryInterface.sequelize.query(
    `UPDATE \`${table}\` SET updated_at = NOW() WHERE updated_at IS NULL;`
  );
};

const addDefaults = async (queryInterface: QueryInterface, table: string): Promise<void> => {
  await queryInterface.sequelize.query(
    `ALTER TABLE \`${table}\` MODIFY COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;`
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE \`${table}\` MODIFY COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;`
  );
};

const removeDefaults = async (queryInterface: QueryInterface, table: string): Promise<void> => {
  await queryInterface.sequelize.query(
    `ALTER TABLE \`${table}\` MODIFY COLUMN created_at DATETIME NOT NULL;`
  );
  await queryInterface.sequelize.query(
    `ALTER TABLE \`${table}\` MODIFY COLUMN updated_at DATETIME NOT NULL;`
  );
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  for (const table of tables) {
    await updateNullTimestamps(queryInterface, table);
    await addDefaults(queryInterface, table);
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  for (const table of tables) {
    await removeDefaults(queryInterface, table);
  }
};
