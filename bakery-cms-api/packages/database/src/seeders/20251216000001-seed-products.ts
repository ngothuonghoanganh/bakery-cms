/**
 * Seed: Initial product data
 * Sample bakery products covering both business types
 */

import { QueryInterface } from 'sequelize';
import { randomUUID } from 'crypto';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const now = new Date();
  
  await queryInterface.bulkInsert('products', [
    {
      id: randomUUID(),
      name: 'Bánh Cookies Chocolate Chip',
      description: 'Bánh quy chocolate chip truyền thống, giòn tan, ngọt vừa phải',
      price: 150000,
      category: 'Cookies',
      business_type: 'READY_TO_SELL',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Cookies Bơ',
      description: 'Bánh quy bơ thơm béo, làm từ bơ tươi cao cấp',
      price: 180000,
      category: 'Cookies',
      business_type: 'READY_TO_SELL',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Kem Sinh Nhật (15cm)',
      description: 'Bánh kem tươi size 15cm, phù hợp 4-6 người. Nhận đặt trước 24h',
      price: 250000,
      category: 'Cake',
      business_type: 'MADE_TO_ORDER',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Kem Sinh Nhật (20cm)',
      description: 'Bánh kem tươi size 20cm, phù hợp 8-10 người. Nhận đặt trước 24h',
      price: 350000,
      category: 'Cake',
      business_type: 'MADE_TO_ORDER',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Mì Sandwich',
      description: 'Bánh mì sandwich tươi mỗi ngày, có thể đặt trước hoặc mua trực tiếp',
      price: 35000,
      category: 'Bread',
      business_type: 'BOTH',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Croissant',
      description: 'Bánh sừng bò Pháp giòn xốp, làm tươi mỗi sáng',
      price: 45000,
      category: 'Pastry',
      business_type: 'READY_TO_SELL',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Tiramisu Mini',
      description: 'Tiramisu size nhỏ cho 1-2 người, có thể mua trực tiếp hoặc đặt trước',
      price: 85000,
      category: 'Dessert',
      business_type: 'BOTH',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Mousse Chocolate',
      description: 'Bánh mousse chocolate đắng nhẹ, mịn màng. Nhận đặt trước 12h',
      price: 120000,
      category: 'Dessert',
      business_type: 'MADE_TO_ORDER',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Macaron Set 6',
      description: 'Set 6 bánh macaron nhiều vị, làm tươi hàng ngày',
      price: 95000,
      category: 'Pastry',
      business_type: 'READY_TO_SELL',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
    {
      id: randomUUID(),
      name: 'Bánh Bông Lan Trứng Muối',
      description: 'Bánh bông lan trứng muối thơm béo, có sẵn tại cửa hàng',
      price: 65000,
      category: 'Cake',
      business_type: 'READY_TO_SELL',
      status: 'AVAILABLE',
      image_url: null,
      created_at: now,
      updated_at: now,
    },
  ]);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('products', {});
};
