/**
 * Seeder: Create users with different roles
 * 
 * Creates test users for each role: Manager, Staff, Seller, Customer, Viewer
 * FOR DEVELOPMENT/TESTING ONLY - Do not run in production
 */

import { QueryInterface } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UserRole, UserStatus, AuthProvider } from '@bakery-cms/common';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Default password for all test users
  const defaultPassword = 'TestPass123!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // Define test users for each role
  const testUsers = [
    {
      id: randomUUID(),
      email: 'manager@bakery.com',
      password_hash: hashedPassword,
      first_name: 'Manager',
      last_name: 'User',
      role: UserRole.MANAGER,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      provider_id: null,
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
      email: 'staff@bakery.com',
      password_hash: hashedPassword,
      first_name: 'Staff',
      last_name: 'User',
      role: UserRole.STAFF,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      provider_id: null,
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
      email: 'seller@bakery.com',
      password_hash: hashedPassword,
      first_name: 'Seller',
      last_name: 'User',
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      provider_id: null,
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
      email: 'customer@bakery.com',
      password_hash: hashedPassword,
      first_name: 'Customer',
      last_name: 'User',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      provider_id: null,
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
      email: 'viewer@bakery.com',
      password_hash: hashedPassword,
      first_name: 'Viewer',
      last_name: 'User',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
      provider: AuthProvider.LOCAL,
      provider_id: null,
      email_verified_at: new Date(),
      last_login_at: null,
      login_attempts: 0,
      locked_until: null,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
    },
  ];

  // Check for existing users and filter out duplicates
  const usersToInsert = [];
  for (const user of testUsers) {
    const exists = await queryInterface.rawSelect(
      'users',
      {
        where: {
          email: user.email,
        },
      },
      ['id']
    );

    if (!exists) {
      usersToInsert.push(user);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  // Insert users
  if (usersToInsert.length > 0) {
    await queryInterface.bulkInsert('users', usersToInsert);
    console.log(`Created ${usersToInsert.length} test users with different roles`);
    console.log('Default password for all test users: TestPass123!');
    console.log('');
    console.log('Test users created:');
    usersToInsert.forEach((user) => {
      console.log(`- ${user.email} (${user.role})`);
    });
  } else {
    console.log('All test users already exist');
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove all test users
  const testEmails = [
    'manager@bakery.com',
    'staff@bakery.com',
    'seller@bakery.com',
    'customer@bakery.com',
    'viewer@bakery.com',
  ];

  await queryInterface.bulkDelete('users', {
    email: testEmails,
  });

  console.log('Removed all test users with different roles');
};
