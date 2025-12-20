/**
 * Migration: Convert enum constraints to VARCHAR and clean/reseed data
 * Enum validation will be handled in application code instead of database constraints
 */

import { QueryInterface } from 'sequelize';
import * as bcrypt from 'bcrypt';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // 1. Clean all existing data (cascade delete)
  console.log('Cleaning existing data...');
  await queryInterface.bulkDelete('order_items', {}, {});
  await queryInterface.bulkDelete('payments', {}, {});
  await queryInterface.bulkDelete('orders', {}, {});
  await queryInterface.bulkDelete('auth_sessions', {}, {});
  await queryInterface.bulkDelete('users', {}, {});
  await queryInterface.bulkDelete('products', {}, {});
  console.log('✓ Cleaned all existing data');

  // 2. Drop foreign key constraints temporarily
  console.log('Dropping foreign key constraints...');
  
  await queryInterface.sequelize.query(
    `ALTER TABLE auth_sessions DROP FOREIGN KEY auth_sessions_ibfk_1`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_1`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items DROP FOREIGN KEY order_items_ibfk_2`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE payments DROP FOREIGN KEY payments_ibfk_1`
  );
  
  console.log('✓ Dropped foreign key constraints');

  // 3. Set default UUID generation for all table id columns
  console.log('Setting UUID defaults for all table id columns...');
  
  await queryInterface.sequelize.query(
    `ALTER TABLE users MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID())`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE products MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID())`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE orders MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID())`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID())`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE payments MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID())`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE auth_sessions MODIFY COLUMN id VARCHAR(36) NOT NULL DEFAULT (UUID())`
  );
  
  console.log('✓ Set UUID defaults for all table id columns');

  // 4. Update foreign key columns to match VARCHAR(36)
  console.log('Updating foreign key columns to VARCHAR(36)...');
  
  // Update auth_sessions.user_id to match users.id
  await queryInterface.sequelize.query(
    `ALTER TABLE auth_sessions MODIFY COLUMN user_id VARCHAR(36) NOT NULL`
  );
  
  // Update order_items.order_id to match orders.id
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items MODIFY COLUMN order_id VARCHAR(36) NOT NULL`
  );
  
  // Update order_items.product_id to match products.id
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items MODIFY COLUMN product_id VARCHAR(36) NOT NULL`
  );
  
  // Update payments.order_id to match orders.id
  await queryInterface.sequelize.query(
    `ALTER TABLE payments MODIFY COLUMN order_id VARCHAR(36) NOT NULL`
  );
  
  console.log('✓ Updated foreign key columns to VARCHAR(36)');

  // 5. Recreate foreign key constraints
  console.log('Recreating foreign key constraints...');
  
  await queryInterface.sequelize.query(
    `ALTER TABLE auth_sessions ADD CONSTRAINT auth_sessions_ibfk_1 
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items ADD CONSTRAINT order_items_ibfk_1 
     FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE order_items ADD CONSTRAINT order_items_ibfk_2 
     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE`
  );
  
  await queryInterface.sequelize.query(
    `ALTER TABLE payments ADD CONSTRAINT payments_ibfk_1 
     FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE`
  );
  
  console.log('✓ Recreated foreign key constraints');

  // 6. Convert products table enums to VARCHAR
  console.log('Converting products enum columns to VARCHAR...');
  
  // Convert business_type from ENUM to VARCHAR
  await queryInterface.sequelize.query(
    `ALTER TABLE products MODIFY COLUMN business_type VARCHAR(50) NOT NULL`
  );
  
  // Convert status from ENUM to VARCHAR with default
  await queryInterface.sequelize.query(
    `ALTER TABLE products MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'available'`
  );
  
  console.log('✓ Converted products columns to VARCHAR');

  // 7. Convert payments table enums to VARCHAR
  console.log('Converting payments enum columns to VARCHAR...');
  
  // Convert method from ENUM to VARCHAR
  await queryInterface.sequelize.query(
    `ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) NOT NULL`
  );
  
  // Convert status from ENUM to VARCHAR with default
  await queryInterface.sequelize.query(
    `ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'`
  );
  
  console.log('✓ Converted payments columns to VARCHAR');

  // 8. Convert users table enums to VARCHAR
  console.log('Converting users enum columns to VARCHAR...');
  
  // Convert role from ENUM to VARCHAR with default
  await queryInterface.sequelize.query(
    `ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'customer'`
  );
  
  // Convert status from ENUM to VARCHAR with default
  await queryInterface.sequelize.query(
    `ALTER TABLE users MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'active'`
  );
  
  console.log('✓ Converted users columns to VARCHAR');

  // 9. Seed admin user
  console.log('Seeding admin user...');
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  
  await queryInterface.bulkInsert('users', [
    {
      email: 'admin@bakery.com',
      password_hash: adminPasswordHash,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      status: 'active',
      provider: 'local',
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
  
  console.log('✓ Created admin user (email: admin@bakery.com, password: AdminPass123!)');


  // 10. Seed sample customer
  console.log('Seeding customer user...');
  const customerPasswordHash = await bcrypt.hash('Customer@123', 10);
  
  await queryInterface.bulkInsert('users', [
    {
      email: 'customer@example.com',
      password_hash: customerPasswordHash,
      first_name: 'John',
      last_name: 'Doe',
      role: 'customer',
      status: 'active',
      provider: 'local',
      email_verified_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]);
  
  console.log('✓ Created customer user (email: customer@example.com, password: Customer@123)');



  console.log('\n✅ Migration completed successfully!');
  console.log('\n📋 Test accounts:');
  console.log('  Admin: admin@bakery.com / AdminPass123!');
  console.log('  Customer: customer@example.com / Customer@123');
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Use queryInterface to avoid TypeScript unused parameter error
  console.log('Reverting to enum constraints...');
  console.log('Note: This migration converted enums to VARCHAR. Rollback is not applicable.');
  console.log('If you need old enum constraints, restore from database backup.');
  
  // Prevent unused parameter warning
  void queryInterface;
};
