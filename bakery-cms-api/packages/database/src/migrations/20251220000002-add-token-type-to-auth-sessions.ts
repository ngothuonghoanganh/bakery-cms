/**
 * Migration: Add token_type column to auth_sessions
 * 
 * Adds the token_type ENUM column to track different types of tokens
 * (refresh, access, email_verification, password_reset)
 */

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Add token_type column
  await queryInterface.addColumn('auth_sessions', 'token_type', {
    type: DataTypes.ENUM('refresh', 'access', 'email_verification', 'password_reset'),
    allowNull: false,
    defaultValue: 'refresh',
    comment: 'Type of token stored in this session',
  });

  // Add index for token_type for performance
  await queryInterface.addIndex('auth_sessions', ['token_type'], {
    name: 'auth_sessions_token_type_index',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove index
  await queryInterface.removeIndex('auth_sessions', 'auth_sessions_token_type_index');
  
  // Remove column
  await queryInterface.removeColumn('auth_sessions', 'token_type');
};
