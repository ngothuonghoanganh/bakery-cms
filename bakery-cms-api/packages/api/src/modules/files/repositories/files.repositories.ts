/**
 * File repository
 * Data access layer for files using Sequelize
 */

import { Op } from 'sequelize';
import { FileModel } from '@bakery-cms/database';
import { FileListQueryDto } from '../dto/files.dto';

/**
 * File repository interface
 * Defines all data access operations for files
 */
export type FileRepository = {
  readonly findById: (id: string) => Promise<FileModel | null>;
  readonly findAll: (query: FileListQueryDto) => Promise<{ rows: readonly FileModel[]; count: number }>;
  readonly create: (attributes: Partial<FileModel>) => Promise<FileModel>;
  readonly delete: (id: string) => Promise<boolean>;
  readonly count: (filters?: Record<string, unknown>) => Promise<number>;
};

/**
 * Create file repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createFileRepository = (
  model: typeof FileModel
): FileRepository => {
  /**
   * Find file by ID
   */
  const findById = async (id: string): Promise<FileModel | null> => {
    return await model.findByPk(id);
  };

  /**
   * Find all files with filtering and pagination
   */
  const findAll = async (
    query: FileListQueryDto
  ): Promise<{ rows: readonly FileModel[]; count: number }> => {
    const {
      page = 1,
      limit = 20,
      mimeType,
      uploadedBy,
    } = query;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (mimeType) {
      // Support prefix matching for MIME types (e.g., 'image/' matches all images)
      where['mimeType'] = { [Op.like]: `${mimeType}%` };
    }

    if (uploadedBy) {
      where['uploadedBy'] = uploadedBy;
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute query
    const result = await model.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return {
      rows: result.rows,
      count: result.count,
    };
  };

  /**
   * Create new file record
   */
  const create = async (
    attributes: Partial<FileModel>
  ): Promise<FileModel> => {
    return await model.create(attributes);
  };

  /**
   * Delete file by ID (hard delete)
   * Returns true if deleted, false if not found
   */
  const deleteFile = async (id: string): Promise<boolean> => {
    const file = await model.findByPk(id);

    if (!file) {
      return false;
    }

    // Hard delete - no paranoid mode for files
    await file.destroy({ force: true });
    return true;
  };

  /**
   * Count files with optional filters
   */
  const count = async (filters?: Record<string, unknown>): Promise<number> => {
    return await model.count({
      where: filters ?? {},
    });
  };

  return {
    findById,
    findAll,
    create,
    delete: deleteFile,
    count,
  };
};
