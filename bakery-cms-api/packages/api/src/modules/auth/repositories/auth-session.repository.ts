/**
 * AuthSession repository
 * Data access layer for authentication sessions using Sequelize
 */

import { Op } from 'sequelize';
import { AuthSessionModel } from '@bakery-cms/database/src/models/auth-session.model';

/**
 * AuthSession creation attributes
 */
export interface CreateAuthSessionAttributes {
  userId: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuthSession update attributes
 */
export interface UpdateAuthSessionAttributes {
  refreshToken?: string;
  expiresAt?: Date;
  isRevoked?: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuthSession query filters
 */
export interface AuthSessionQueryFilters {
  userId?: string;
  tokenType?: string;
  isRevoked?: boolean;
  isExpired?: boolean;
  deviceInfo?: string;
  page?: number;
  limit?: number;
}

/**
 * AuthSession repository interface
 * Defines all data access operations for authentication sessions
 */
export interface AuthSessionRepository {
  findById(id: string): Promise<AuthSessionModel | null>;
  findByRefreshToken(refreshToken: string): Promise<AuthSessionModel | null>;
  findByUserId(userId: string): Promise<AuthSessionModel[]>;
  findActiveSessions(userId: string): Promise<AuthSessionModel[]>;
  findAll(filters: AuthSessionQueryFilters): Promise<{ rows: AuthSessionModel[]; count: number }>;
  create(attributes: CreateAuthSessionAttributes): Promise<AuthSessionModel>;
  update(id: string, attributes: UpdateAuthSessionAttributes): Promise<AuthSessionModel | null>;
  delete(id: string): Promise<boolean>;
  revoke(id: string): Promise<AuthSessionModel | null>;
  revokeByRefreshToken(refreshToken: string): Promise<AuthSessionModel | null>;
  revokeAllForUser(userId: string): Promise<number>;
  cleanupExpired(): Promise<number>;
  cleanupRevoked(): Promise<number>;
  count(filters?: Partial<AuthSessionModel>): Promise<number>;
}

/**
 * Create auth session repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createAuthSessionRepository = (
  model: typeof AuthSessionModel
): AuthSessionRepository => {
  /**
   * Find session by ID
   */
  const findById = async (id: string): Promise<AuthSessionModel | null> => {
    return await model.findByPk(id);
  };

  /**
   * Find session by refresh token
   */
  const findByRefreshToken = async (refreshToken: string): Promise<AuthSessionModel | null> => {
    return await model.findOne({
      where: {
        refreshToken,
      },
    });
  };

  /**
   * Find all sessions for a user
   */
  const findByUserId = async (userId: string): Promise<AuthSessionModel[]> => {
    return await model.findAll({
      where: {
        userId,
      },
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Find active (non-revoked, non-expired) sessions for a user
   */
  const findActiveSessions = async (userId: string): Promise<AuthSessionModel[]> => {
    return await model.findAll({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Find all sessions with filtering and pagination
   */
  const findAll = async (
    filters: AuthSessionQueryFilters
  ): Promise<{ rows: AuthSessionModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      userId,
      tokenType,
      isRevoked,
      isExpired,
      deviceInfo,
    } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (userId) {
      where['userId'] = userId;
    }

    if (tokenType) {
      where['tokenType'] = tokenType;
    }

    if (isRevoked !== undefined) {
      where['isRevoked'] = isRevoked;
    }

    if (isExpired === true) {
      where['expiresAt'] = { [Op.lte]: new Date() };
    } else if (isExpired === false) {
      where['expiresAt'] = { [Op.gt]: new Date() };
    }

    if (deviceInfo) {
      where['deviceInfo'] = { [Op.like]: `%${deviceInfo}%` };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute query
    return await model.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Create new session
   */
  const create = async (attributes: CreateAuthSessionAttributes): Promise<AuthSessionModel> => {
    return await model.create(attributes as any);
  };

  /**
   * Update session by ID
   */
  const update = async (
    id: string,
    attributes: UpdateAuthSessionAttributes
  ): Promise<AuthSessionModel | null> => {
    const session = await model.findByPk(id);
    if (!session) {
      return null;
    }

    await session.update(attributes as any);
    return session;
  };

  /**
   * Delete session
   */
  const deleteSession = async (id: string): Promise<boolean> => {
    const result = await model.destroy({
      where: { id },
    });
    return result > 0;
  };

  /**
   * Revoke session by ID
   */
  const revoke = async (id: string): Promise<AuthSessionModel | null> => {
    const session = await model.findByPk(id);
    if (!session) {
      return null;
    }

    await session.revoke();
    return session;
  };

  /**
   * Revoke session by refresh token
   */
  const revokeByRefreshToken = async (refreshToken: string): Promise<AuthSessionModel | null> => {
    const session = await model.findOne({
      where: { refreshToken },
    });
    
    if (!session) {
      return null;
    }

    await session.revoke();
    return session;
  };

  /**
   * Revoke all sessions for a user
   */
  const revokeAllForUser = async (userId: string): Promise<number> => {
    return await AuthSessionModel.revokeAllForUser(userId);
  };

  /**
   * Clean up expired sessions
   */
  const cleanupExpired = async (): Promise<number> => {
    return await AuthSessionModel.cleanupExpired();
  };

  /**
   * Clean up revoked sessions
   */
  const cleanupRevoked = async (): Promise<number> => {
    return await AuthSessionModel.cleanupRevoked();
  };

  /**
   * Count sessions with optional filters
   */
  const count = async (filters?: Partial<AuthSessionModel>): Promise<number> => {
    return await model.count({
      where: filters || {},
    });
  };

  return {
    findById,
    findByRefreshToken,
    findByUserId,
    findActiveSessions,
    findAll,
    create,
    update,
    delete: deleteSession,
    revoke,
    revokeByRefreshToken,
    revokeAllForUser,
    cleanupExpired,
    cleanupRevoked,
    count,
  };
};

/**
 * Default auth session repository instance
 */
export const authSessionRepository = createAuthSessionRepository(AuthSessionModel);