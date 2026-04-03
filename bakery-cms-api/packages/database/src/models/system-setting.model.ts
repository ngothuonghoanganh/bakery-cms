/**
 * SystemSetting Sequelize model
 * Stores configurable system-level settings as key/value pairs
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * SystemSetting model class
 */
export class SystemSettingModel extends Model {
  declare id: string;
  declare key: string;
  declare value: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize SystemSetting model
 */
export const initSystemSettingModel = (sequelize: Sequelize): typeof SystemSettingModel => {
  SystemSettingModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 120],
        },
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'system_settings',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['key'],
          name: 'idx_system_settings_key_unique',
        },
      ],
    }
  );

  return SystemSettingModel;
};
