/**
 * Migration: Create users table
 * 
 * Creates the users table for authentication with support for:
 * - Local authentication (email/password)
 * - OAuth authentication (Google, Facebook)
 * - Role-based access control
 * - Account security (lockout, verification)
 * - Soft delete functionality
 */

import { QueryInterface, DataTypes } from 'sequelize';

const tableName = 'users';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable(tableName, {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Bcrypt hash, null for OAuth-only users',
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'seller', 'customer', 'viewer'),
      allowNull: false,
      defaultValue: 'customer',
      comment: 'User role for access control',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending_verification'),
      allowNull: false,
      defaultValue: 'pending_verification',
      comment: 'User account status',
    },
    provider: {
      type: DataTypes.ENUM('local', 'google', 'facebook'),
      allowNull: false,
      defaultValue: 'local',
      comment: 'Authentication provider',
    },
    provider_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'External provider user ID',
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Email verification timestamp',
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last successful login timestamp',
    },
    login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Failed login attempt counter',
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Account lock expiration timestamp',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp',
    },
  });

  // Create indexes for performance optimization
  await queryInterface.addIndex(tableName, ['email'], {
    unique: true,
    name: 'users_email_unique',
  });

  await queryInterface.addIndex(tableName, ['provider', 'provider_id'], {
    unique: true,
    name: 'users_provider_provider_id_unique',
  });

  await queryInterface.addIndex(tableName, ['role'], {
    name: 'users_role_index',
  });

  await queryInterface.addIndex(tableName, ['status'], {
    name: 'users_status_index',
  });

  await queryInterface.addIndex(tableName, ['role', 'status'], {
    name: 'users_role_status_index',
  });

  await queryInterface.addIndex(tableName, ['provider'], {
    name: 'users_provider_index',
  });

  await queryInterface.addIndex(tableName, ['created_at'], {
    name: 'users_created_at_index',
  });

  await queryInterface.addIndex(tableName, ['email_verified_at'], {
    name: 'users_email_verified_at_index',
  });

  await queryInterface.addIndex(tableName, ['last_login_at'], {
    name: 'users_last_login_at_index',
  });

  await queryInterface.addIndex(tableName, ['locked_until'], {
    name: 'users_locked_until_index',
  });

  // Add index for soft delete queries
  await queryInterface.addIndex(tableName, ['deleted_at'], {
    name: 'users_deleted_at_index',
  });

  // Add composite index for active user queries
  await queryInterface.addIndex(tableName, ['status', 'deleted_at'], {
    name: 'users_status_deleted_at_index',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop indexes first
  await queryInterface.removeIndex(tableName, 'users_email_unique');
  await queryInterface.removeIndex(tableName, 'users_provider_provider_id_unique');
  await queryInterface.removeIndex(tableName, 'users_role_index');
  await queryInterface.removeIndex(tableName, 'users_status_index');
  await queryInterface.removeIndex(tableName, 'users_role_status_index');
  await queryInterface.removeIndex(tableName, 'users_provider_index');
  await queryInterface.removeIndex(tableName, 'users_created_at_index');
  await queryInterface.removeIndex(tableName, 'users_email_verified_at_index');
  await queryInterface.removeIndex(tableName, 'users_last_login_at_index');
  await queryInterface.removeIndex(tableName, 'users_locked_until_index');
  await queryInterface.removeIndex(tableName, 'users_deleted_at_index');
  await queryInterface.removeIndex(tableName, 'users_status_deleted_at_index');

  // Drop table
  await queryInterface.dropTable(tableName);
};