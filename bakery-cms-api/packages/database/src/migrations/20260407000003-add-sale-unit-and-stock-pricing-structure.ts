/**
 * Migration: Add sale unit structure and stock package pricing structure
 */

import { QueryInterface, DataTypes } from 'sequelize';

const PRODUCTS_TABLE = 'products';
const ORDER_ITEMS_TABLE = 'order_items';
const STOCK_ITEMS_TABLE = 'stock_items';
const STOCK_ITEM_BRANDS_TABLE = 'stock_item_brands';

const PRODUCT_SALE_UNIT_COLUMN = 'sale_unit_type';
const ORDER_ITEM_SALE_UNIT_COLUMN = 'sale_unit_type';
const STOCK_UNIT_TYPE_COLUMN = 'unit_type';

const STOCK_PURCHASE_QUANTITY_COLUMN = 'purchase_quantity';
const STOCK_PURCHASE_UNIT_COLUMN = 'purchase_unit';
const STOCK_UNIT_PRICE_BEFORE_TAX_COLUMN = 'unit_price_before_tax';
const STOCK_UNIT_PRICE_AFTER_TAX_COLUMN = 'unit_price_after_tax';

const PRODUCT_SALE_UNIT_INDEX = 'idx_products_sale_unit_type';
const ORDER_ITEM_SALE_UNIT_INDEX = 'idx_order_items_sale_unit_type';
const STOCK_ITEM_UNIT_TYPE_INDEX = 'idx_stock_items_unit_type';
const STOCK_ITEM_PURCHASE_UNIT_INDEX = 'idx_sib_purchase_unit';

const addIndexIfMissing = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string,
  fields: string[]
): Promise<void> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  const hasIndex = indexes.some((index) => index.name === indexName);

  if (!hasIndex) {
    await queryInterface.addIndex(tableName, fields, {
      name: indexName,
    });
  }
};

const removeIndexIfExists = async (
  queryInterface: QueryInterface,
  tableName: string,
  indexName: string
): Promise<void> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name: string }>;
  const hasIndex = indexes.some((index) => index.name === indexName);

  if (hasIndex) {
    await queryInterface.removeIndex(tableName, indexName);
  }
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const productsTable = await queryInterface.describeTable(PRODUCTS_TABLE);
  if (!productsTable[PRODUCT_SALE_UNIT_COLUMN]) {
    await queryInterface.addColumn(PRODUCTS_TABLE, PRODUCT_SALE_UNIT_COLUMN, {
      type: DataTypes.ENUM('piece', 'weight'),
      allowNull: false,
      defaultValue: 'piece',
      comment: 'Sale unit type for product pricing',
    });
  }
  await addIndexIfMissing(
    queryInterface,
    PRODUCTS_TABLE,
    PRODUCT_SALE_UNIT_INDEX,
    [PRODUCT_SALE_UNIT_COLUMN]
  );

  const orderItemsTable = await queryInterface.describeTable(ORDER_ITEMS_TABLE);
  if (!orderItemsTable[ORDER_ITEM_SALE_UNIT_COLUMN]) {
    await queryInterface.addColumn(ORDER_ITEMS_TABLE, ORDER_ITEM_SALE_UNIT_COLUMN, {
      type: DataTypes.ENUM('piece', 'weight'),
      allowNull: false,
      defaultValue: 'piece',
      comment: 'Snapshot of product sale unit at order time',
    });
  }
  await addIndexIfMissing(
    queryInterface,
    ORDER_ITEMS_TABLE,
    ORDER_ITEM_SALE_UNIT_INDEX,
    [ORDER_ITEM_SALE_UNIT_COLUMN]
  );

  const stockItemsTable = await queryInterface.describeTable(STOCK_ITEMS_TABLE);
  if (!stockItemsTable[STOCK_UNIT_TYPE_COLUMN]) {
    await queryInterface.addColumn(STOCK_ITEMS_TABLE, STOCK_UNIT_TYPE_COLUMN, {
      type: DataTypes.ENUM('piece', 'weight'),
      allowNull: false,
      defaultValue: 'piece',
      comment: 'Canonical stock unit type',
    });
  }
  await addIndexIfMissing(
    queryInterface,
    STOCK_ITEMS_TABLE,
    STOCK_ITEM_UNIT_TYPE_INDEX,
    [STOCK_UNIT_TYPE_COLUMN]
  );

  // Safe migration default: normalize legacy free-text units to canonical piece.
  await queryInterface.bulkUpdate(
    STOCK_ITEMS_TABLE,
    {
      unit_of_measure: 'piece',
    },
    {}
  );

  const stockItemBrandsTable = await queryInterface.describeTable(STOCK_ITEM_BRANDS_TABLE);

  if (!stockItemBrandsTable[STOCK_PURCHASE_QUANTITY_COLUMN]) {
    await queryInterface.addColumn(STOCK_ITEM_BRANDS_TABLE, STOCK_PURCHASE_QUANTITY_COLUMN, {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 1,
      comment: 'Purchase package quantity',
    });
  }

  if (!stockItemBrandsTable[STOCK_PURCHASE_UNIT_COLUMN]) {
    await queryInterface.addColumn(STOCK_ITEM_BRANDS_TABLE, STOCK_PURCHASE_UNIT_COLUMN, {
      type: DataTypes.ENUM('piece', 'gram', 'kilogram'),
      allowNull: false,
      defaultValue: 'piece',
      comment: 'Purchase package unit',
    });
  }

  if (!stockItemBrandsTable[STOCK_UNIT_PRICE_BEFORE_TAX_COLUMN]) {
    await queryInterface.addColumn(STOCK_ITEM_BRANDS_TABLE, STOCK_UNIT_PRICE_BEFORE_TAX_COLUMN, {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Normalized unit price before tax',
    });
  }

  if (!stockItemBrandsTable[STOCK_UNIT_PRICE_AFTER_TAX_COLUMN]) {
    await queryInterface.addColumn(STOCK_ITEM_BRANDS_TABLE, STOCK_UNIT_PRICE_AFTER_TAX_COLUMN, {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Normalized unit price after tax',
    });
  }

  await queryInterface.sequelize.query(`
    UPDATE ${STOCK_ITEM_BRANDS_TABLE}
    SET
      ${STOCK_UNIT_PRICE_BEFORE_TAX_COLUMN} = price_before_tax,
      ${STOCK_UNIT_PRICE_AFTER_TAX_COLUMN} = price_after_tax
  `);

  await addIndexIfMissing(
    queryInterface,
    STOCK_ITEM_BRANDS_TABLE,
    STOCK_ITEM_PURCHASE_UNIT_INDEX,
    [STOCK_PURCHASE_UNIT_COLUMN]
  );
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await removeIndexIfExists(
    queryInterface,
    STOCK_ITEM_BRANDS_TABLE,
    STOCK_ITEM_PURCHASE_UNIT_INDEX
  );

  const stockItemBrandsTable = await queryInterface.describeTable(STOCK_ITEM_BRANDS_TABLE);
  if (stockItemBrandsTable[STOCK_UNIT_PRICE_AFTER_TAX_COLUMN]) {
    await queryInterface.removeColumn(
      STOCK_ITEM_BRANDS_TABLE,
      STOCK_UNIT_PRICE_AFTER_TAX_COLUMN
    );
  }
  if (stockItemBrandsTable[STOCK_UNIT_PRICE_BEFORE_TAX_COLUMN]) {
    await queryInterface.removeColumn(
      STOCK_ITEM_BRANDS_TABLE,
      STOCK_UNIT_PRICE_BEFORE_TAX_COLUMN
    );
  }
  if (stockItemBrandsTable[STOCK_PURCHASE_UNIT_COLUMN]) {
    await queryInterface.removeColumn(
      STOCK_ITEM_BRANDS_TABLE,
      STOCK_PURCHASE_UNIT_COLUMN
    );
  }
  if (stockItemBrandsTable[STOCK_PURCHASE_QUANTITY_COLUMN]) {
    await queryInterface.removeColumn(
      STOCK_ITEM_BRANDS_TABLE,
      STOCK_PURCHASE_QUANTITY_COLUMN
    );
  }

  await removeIndexIfExists(queryInterface, STOCK_ITEMS_TABLE, STOCK_ITEM_UNIT_TYPE_INDEX);
  const stockItemsTable = await queryInterface.describeTable(STOCK_ITEMS_TABLE);
  if (stockItemsTable[STOCK_UNIT_TYPE_COLUMN]) {
    await queryInterface.removeColumn(STOCK_ITEMS_TABLE, STOCK_UNIT_TYPE_COLUMN);
  }

  await removeIndexIfExists(queryInterface, ORDER_ITEMS_TABLE, ORDER_ITEM_SALE_UNIT_INDEX);
  const orderItemsTable = await queryInterface.describeTable(ORDER_ITEMS_TABLE);
  if (orderItemsTable[ORDER_ITEM_SALE_UNIT_COLUMN]) {
    await queryInterface.removeColumn(ORDER_ITEMS_TABLE, ORDER_ITEM_SALE_UNIT_COLUMN);
  }

  await removeIndexIfExists(queryInterface, PRODUCTS_TABLE, PRODUCT_SALE_UNIT_INDEX);
  const productsTable = await queryInterface.describeTable(PRODUCTS_TABLE);
  if (productsTable[PRODUCT_SALE_UNIT_COLUMN]) {
    await queryInterface.removeColumn(PRODUCTS_TABLE, PRODUCT_SALE_UNIT_COLUMN);
  }
};
