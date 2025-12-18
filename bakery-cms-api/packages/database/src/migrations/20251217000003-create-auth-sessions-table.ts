/**
 * Migration: Create auth_sessions table
 * 
 * Creates the auth_sessions table for JWT refresh token management:
 * - Store refresh tokens securely
 * - Track active sessions per user
 * - Support device/IP tracking for security
 * - Enable session cleanup and management
 */

import { QueryInterface, DataTypes } from 'sequelize';

const tableName = 'auth_sessions';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable(tableName, {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Reference to the user who owns this session',
    },
    refresh_token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      comment: 'JWT refresh token, hashed for security',
    },
    device_info: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string with device information',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Client IP address (supports IPv6)',
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Client user agent string',
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Token expiration timestamp',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this session is active',
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
  });

  // Create indexes for performance optimization
  await queryInterface.addIndex(tableName, ['refresh_token'], {
    unique: true,
    name: 'auth_sessions_refresh_token_unique',
  });

  await queryInterface.addIndex(tableName, ['user_id'], {
    name: 'auth_sessions_user_id_index',
  });

  await queryInterface.addIndex(tableName, ['user_id', 'is_active'], {
    name: 'auth_sessions_user_id_is_active_index',
  });

  await queryInterface.addIndex(tableName, ['expires_at'], {
    name: 'auth_sessions_expires_at_index',
  });

  await queryInterface.addIndex(tableName, ['created_at'], {
    name: 'auth_sessions_created_at_index',
  });

  await queryInterface.addIndex(tableName, ['is_active'], {
    name: 'auth_sessions_is_active_index',
  });

  // Composite index for cleanup operations
  await queryInterface.addIndex(tableName, ['expires_at', 'is_active'], {
    name: 'auth_sessions_expires_at_is_active_index',
  });

  // Index for security tracking
  await queryInterface.addIndex(tableName, ['ip_address', 'created_at'], {
    name: 'auth_sessions_ip_address_created_at_index',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Drop indexes first
  await queryInterface.removeIndex(tableName, 'auth_sessions_refresh_token_unique');
  await queryInterface.removeIndex(tableName, 'auth_sessions_user_id_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_user_id_is_active_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_expires_at_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_created_at_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_is_active_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_expires_at_is_active_index');
  await queryInterface.removeIndex(tableName, 'auth_sessions_ip_address_created_at_index');

  // Drop table
  await queryInterface.dropTable(tableName);
};