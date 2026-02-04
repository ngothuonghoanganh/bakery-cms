/**
 * Migration: Create files table
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('files', {
    id: {
      type: 'CHAR(36)',
      primaryKey: true,
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    storage_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    uploaded_by: {
      type: 'CHAR(36)',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  // Create indexes
  await queryInterface.addIndex('files', ['uploaded_by'], {
    name: 'idx_files_uploaded_by',
  });

  await queryInterface.addIndex('files', ['mime_type'], {
    name: 'idx_files_mime_type',
  });

  await queryInterface.addIndex('files', ['created_at'], {
    name: 'idx_files_created_at',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('files');
};
