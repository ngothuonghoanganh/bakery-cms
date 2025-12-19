/**
 * Seeder: Create OAuth test users (Development Only)
 * 
 * Creates test users with OAuth provider associations for development testing.
 * These users simulate successful OAuth logins from Google and Facebook.
 * 
 * WARNING: Only run in development/test environments!
 */

import { QueryInterface } from 'sequelize';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Only run in development/test environments
  const nodeEnv = process.env['NODE_ENV'] || 'development';
  if (nodeEnv === 'production') {
    console.log('Skipping OAuth test users seeder in production environment');
    return;
  }

  // Test users data
  const testUsers = [
    {
      id: randomUUID(),
      email: 'google.test@example.com',
      password_hash: null, // OAuth users don't need password
      first_name: 'Google',
      last_name: 'TestUser',
      role: 'customer',
      status: 'active',
      provider: 'google',
      provider_id: 'google_test_id_123456789',
      email_verified_at: new Date(),
      last_login_at: null,
      login_attempts: 0,
      locked_until: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
    {
      id: randomUUID(),
      email: 'facebook.test@example.com',
      password_hash: null,
      first_name: 'Facebook',
      last_name: 'TestUser',
      role: 'customer',
      status: 'active',
      provider: 'facebook',
      provider_id: 'facebook_test_id_987654321',
      email_verified_at: new Date(),
      last_login_at: null,
      login_attempts: 0,
      locked_until: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
  ];

  // Check for existing test users
  for (const user of testUsers) {
    const existingUser = await queryInterface.rawSelect(
      'users',
      {
        where: {
          email: user.email,
          provider: user.provider,
        },
      },
      ['id']
    );

    if (existingUser) {
      console.log(`OAuth test user already exists: ${user.email} (${user.provider})`);
      continue;
    }

    // Insert test user
    await queryInterface.bulkInsert('users', [user]);
    console.log(`Created OAuth test user: ${user.email} (${user.provider})`);
  }

  console.log('OAuth test users seeding completed');
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove OAuth test users
  await queryInterface.bulkDelete('users', {
    email: ['google.test@example.com', 'facebook.test@example.com'],
  });

  console.log('OAuth test users removed');
};
