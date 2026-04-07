/**
 * Migration: Add product_type and combo item support
 */

import { QueryInterface, DataTypes } from 'sequelize';

const PRODUCTS_TABLE = 'products';
const PRODUCT_TYPE_COLUMN = 'product_type';
const PRODUCT_TYPE_INDEX = 'products_product_type_idx';

const COMBO_ITEMS_TABLE = 'product_combo_items';
const COMBO_PRODUCT_INDEX = 'idx_pci_combo_product_id';
const ITEM_PRODUCT_INDEX = 'idx_pci_item_product_id';
const COMBO_DISPLAY_ORDER_INDEX = 'idx_pci_combo_display_order';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const productsTableDescription = await queryInterface.describeTable(PRODUCTS_TABLE);
  const productsIndexes = (await queryInterface.showIndex(PRODUCTS_TABLE)) as Array<{
    name: string;
  }>;

  if (!productsTableDescription[PRODUCT_TYPE_COLUMN]) {
    await queryInterface.addColumn(PRODUCTS_TABLE, PRODUCT_TYPE_COLUMN, {
      type: DataTypes.ENUM('single', 'combo'),
      allowNull: false,
      defaultValue: 'single',
      comment: 'Product type: single product or combo bundle',
    });
  }

  const hasProductTypeIndex = productsIndexes.some((index) => index.name === PRODUCT_TYPE_INDEX);
  if (!hasProductTypeIndex) {
    await queryInterface.addIndex(PRODUCTS_TABLE, [PRODUCT_TYPE_COLUMN], {
      name: PRODUCT_TYPE_INDEX,
    });
  }

  await queryInterface.createTable(COMBO_ITEMS_TABLE, {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    combo_product_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: PRODUCTS_TABLE,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    item_product_id: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: PRODUCTS_TABLE,
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    display_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    },
  });

  await queryInterface.addIndex(COMBO_ITEMS_TABLE, ['combo_product_id'], {
    name: COMBO_PRODUCT_INDEX,
  });

  await queryInterface.addIndex(COMBO_ITEMS_TABLE, ['item_product_id'], {
    name: ITEM_PRODUCT_INDEX,
  });

  await queryInterface.addIndex(COMBO_ITEMS_TABLE, ['combo_product_id', 'display_order'], {
    name: COMBO_DISPLAY_ORDER_INDEX,
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const tableNames = (await queryInterface.showAllTables()) as string[];
  const comboItemsTableExists = tableNames.includes(COMBO_ITEMS_TABLE);

  if (comboItemsTableExists) {
    const comboIndexes = (await queryInterface.showIndex(COMBO_ITEMS_TABLE)) as Array<{
      name: string;
    }>;
    if (comboIndexes.some((index) => index.name === COMBO_DISPLAY_ORDER_INDEX)) {
      await queryInterface.removeIndex(COMBO_ITEMS_TABLE, COMBO_DISPLAY_ORDER_INDEX);
    }
    if (comboIndexes.some((index) => index.name === ITEM_PRODUCT_INDEX)) {
      await queryInterface.removeIndex(COMBO_ITEMS_TABLE, ITEM_PRODUCT_INDEX);
    }
    if (comboIndexes.some((index) => index.name === COMBO_PRODUCT_INDEX)) {
      await queryInterface.removeIndex(COMBO_ITEMS_TABLE, COMBO_PRODUCT_INDEX);
    }

    await queryInterface.dropTable(COMBO_ITEMS_TABLE);
  }

  const productsIndexes = (await queryInterface.showIndex(PRODUCTS_TABLE)) as Array<{
    name: string;
  }>;
  if (productsIndexes.some((index) => index.name === PRODUCT_TYPE_INDEX)) {
    await queryInterface.removeIndex(PRODUCTS_TABLE, PRODUCT_TYPE_INDEX);
  }

  const productsTableDescription = await queryInterface.describeTable(PRODUCTS_TABLE);
  if (productsTableDescription[PRODUCT_TYPE_COLUMN]) {
    await queryInterface.removeColumn(PRODUCTS_TABLE, PRODUCT_TYPE_COLUMN);
  }
};
