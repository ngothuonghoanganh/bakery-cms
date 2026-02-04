/**
 * File Sequelize model
 * Represents uploaded files with metadata
 */

import { Model, DataTypes, Sequelize } from 'sequelize';

/**
 * File model class
 * Note: Classes are allowed for Sequelize models per constitution override
 */
export class FileModel extends Model {
  declare id: string;
  declare originalName: string;
  declare storagePath: string;
  declare mimeType: string;
  declare size: number;
  declare uploadedBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

/**
 * Initialize File model
 * Pure function that configures the model
 */
export const initFileModel = (sequelize: Sequelize): typeof FileModel => {
  FileModel.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      originalName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'original_name',
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      storagePath: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
        field: 'storage_path',
        validate: {
          notEmpty: true,
        },
      },
      mimeType: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'mime_type',
        validate: {
          notEmpty: true,
        },
      },
      size: {
        type: DataTypes.BIGINT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      uploadedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'uploaded_by',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'files',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ['uploaded_by'],
          name: 'idx_files_uploaded_by',
        },
        {
          fields: ['mime_type'],
          name: 'idx_files_mime_type',
        },
        {
          fields: ['created_at'],
          name: 'idx_files_created_at',
        },
      ],
    }
  );

  return FileModel;
};
