/**
 * Seeder: Create admin user
 * 
 * Creates the initial admin user for system access.
 * Uses environment variables for configuration.
 * Idempotent - safe to run multiple times.
 */

import { QueryInterface } from 'sequelize';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get admin user configuration from environment
  const adminEmail = process.env['ADMIN_EMAIL'] || 'admin@bakery.com';
  const adminPassword = process.env['ADMIN_PASSWORD'] || 'AdminPass123!';
  const adminFirstName = process.env['ADMIN_FIRST_NAME'] || 'Admin';
  const adminLastName = process.env['ADMIN_LAST_NAME'] || 'User';

  // Check if admin user already exists
  const existingAdmin = await queryInterface.rawSelect(
    'users',
    {
      where: {
        email: adminEmail,
        role: 'admin',
      },
    },
    ['id']
  );

  // Skip if admin already exists
  if (existingAdmin) {
    console.log(`Admin user already exists with email: ${adminEmail}`);
    return;
  }

  // Hash the admin password with bcrypt (12 rounds as per security requirements)
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Create admin user data
  const adminUser = {
    id: randomUUID(),
    email: adminEmail,
    password_hash: hashedPassword,
    first_name: adminFirstName,
    last_name: adminLastName,
    role: 'admin',
    status: 'active',
    provider: 'local',
    provider_id: null,
    email_verified_at: new Date(),
    last_login_at: null,
    login_attempts: 0,
    locked_until: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  // Insert admin user
  await queryInterface.bulkInsert('users', [adminUser]);

  console.log(`Admin user created successfully:`);
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: [REDACTED FOR SECURITY]`);
  console.log(`WARNING: Please change the default password after first login!`);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Get admin email from environment
  const adminEmail = process.env['ADMIN_EMAIL'] || 'admin@bakery.com';

  // Remove admin user
  await queryInterface.bulkDelete('users', {
    email: adminEmail,
    role: 'admin',
  });

  console.log(`Admin user removed: ${adminEmail}`);
};