import { DataTypes, QueryInterface } from 'sequelize';

const STOCK_RECEIVING_LOTS_TABLE = 'stock_receiving_lots';
const STOCK_MOVEMENTS_TABLE = 'stock_movements';

const addIndexIfMissing = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string,
  fields: string[],
  options: { unique?: boolean; where?: Record<string, unknown> } = {}
): Promise<void> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{
    name: string;
  }>;
  const hasIndex = indexes.some((index) => index.name === indexName);
  if (!hasIndex) {
    await queryInterface.addIndex(tableName, fields, {
      name: indexName,
      unique: options.unique ?? false,
      where: options.where,
    });
  }
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.changeColumn(STOCK_MOVEMENTS_TABLE, 'costing_method', {
    type: DataTypes.ENUM(
      'preferred_brand_price',
      'receiving_lot_price',
      'latest_receiving_price'
    ),
    allowNull: true,
  });

  await queryInterface.createTable(STOCK_RECEIVING_LOTS_TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    stock_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stock_items',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    brand_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'brands',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    received_quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    received_unit: {
      type: DataTypes.ENUM('piece', 'gram', 'kilogram', 'milliliter', 'liter'),
      allowNull: false,
    },
    received_quantity_base: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    base_unit: {
      type: DataTypes.ENUM('piece', 'gram', 'milliliter'),
      allowNull: false,
    },
    price_before_tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    price_after_tax: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    unit_price_before_tax: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
    },
    unit_price_after_tax: {
      type: DataTypes.DECIMAL(14, 4),
      allowNull: false,
    },
    remaining_quantity_base: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    received_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    supplier_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    invoice_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by_user_id: {
      // NOTE: users.id was created as CHAR(36) in older migrations, so we must match it exactly for FK compatibility.
      type: 'CHAR(36)',
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await addIndexIfMissing(
    queryInterface,
    STOCK_RECEIVING_LOTS_TABLE,
    'idx_srl_stock_item_id',
    ['stock_item_id']
  );
  await addIndexIfMissing(
    queryInterface,
    STOCK_RECEIVING_LOTS_TABLE,
    'idx_srl_brand_id',
    ['brand_id']
  );
  await addIndexIfMissing(
    queryInterface,
    STOCK_RECEIVING_LOTS_TABLE,
    'idx_srl_received_at',
    ['received_at']
  );
  await addIndexIfMissing(
    queryInterface,
    STOCK_RECEIVING_LOTS_TABLE,
    'idx_srl_stock_item_brand',
    ['stock_item_id', 'brand_id']
  );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable(STOCK_RECEIVING_LOTS_TABLE);

  await queryInterface.changeColumn(STOCK_MOVEMENTS_TABLE, 'costing_method', {
    type: DataTypes.ENUM('preferred_brand_price'),
    allowNull: true,
  });
};
