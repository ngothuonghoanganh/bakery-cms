/**
 * User repository
 * Data access layer for users using Sequelize
 */

import { Op } from 'sequelize';
import { UserModel } from '@bakery-cms/database/src/models/user.model';
import { UserRole, UserStatus, AuthProvider } from '@bakery-cms/common';

/**
 * User creation attributes
 */
export interface CreateUserAttributes {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  providerId?: string;
  emailVerifiedAt?: Date;
}

/**
 * User update attributes
 */
export interface UpdateUserAttributes {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  provider?: AuthProvider;
  providerId?: string;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastLoginAttemptAt?: Date;
  loginAttempts?: number;
  lockedUntil?: Date;
}

/**
 * User query filters
 */
export interface UserQueryFilters {
  role?: UserRole;
  status?: UserStatus;
  provider?: AuthProvider;
  search?: string;
  emailVerified?: boolean;
  isLocked?: boolean;
  page?: number;
  limit?: number;
}

/**
 * User repository interface
 * Defines all data access operations for users
 */
export interface UserRepository {
  findById(id: string): Promise<UserModel | null>;
  findByEmail(email: string): Promise<UserModel | null>;
  findByProvider(provider: AuthProvider, providerId: string): Promise<UserModel | null>;
  findAll(filters: UserQueryFilters): Promise<{ rows: UserModel[]; count: number }>;
  create(attributes: CreateUserAttributes): Promise<UserModel>;
  update(id: string, attributes: UpdateUserAttributes): Promise<UserModel | null>;
  delete(id: string): Promise<boolean>;
  restore(id: string): Promise<UserModel | null>;
  forceDelete(id: string): Promise<boolean>;
  count(filters?: Partial<UserModel>): Promise<number>;
  incrementLoginAttempts(id: string): Promise<UserModel | null>;
  resetLoginAttempts(id: string): Promise<UserModel | null>;
  lockAccount(id: string, durationMinutes?: number): Promise<UserModel | null>;
  updateLastLogin(id: string): Promise<UserModel | null>;
  verifyEmail(id: string): Promise<UserModel | null>;
  findByRole(role: UserRole): Promise<UserModel[]>;
  countByRole(role: UserRole): Promise<number>;
  hasRole(id: string, role: UserRole): Promise<boolean>;
}

/**
 * Create user repository
 * Factory function that returns repository implementation
 * Uses dependency injection for testability
 */
export const createUserRepository = (
  model: typeof UserModel
): UserRepository => {
  /**
   * Find user by ID
   */
  const findById = async (id: string): Promise<UserModel | null> => {
    return await model.findByPk(id);
  };

  /**
   * Find user by email (case insensitive)
   */
  const findByEmail = async (email: string): Promise<UserModel | null> => {
    return await model.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });
  };

  /**
   * Find user by OAuth provider and provider ID
   */
  const findByProvider = async (
    provider: AuthProvider,
    providerId: string
  ): Promise<UserModel | null> => {
    return await model.findOne({
      where: {
        provider,
        providerId,
      },
    });
  };

  /**
   * Find all users with filtering and pagination
   */
  const findAll = async (
    filters: UserQueryFilters
  ): Promise<{ rows: UserModel[]; count: number }> => {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      provider,
      search,
      emailVerified,
      isLocked,
    } = filters;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (role) {
      where['role'] = role;
    }

    if (status) {
      where['status'] = status;
    }

    if (provider) {
      where['provider'] = provider;
    }

    if (emailVerified === true) {
      where['emailVerifiedAt'] = { [Op.ne]: null };
    } else if (emailVerified === false) {
      where['emailVerifiedAt'] = null;
    }

    if (isLocked === true) {
      where['lockedUntil'] = { [Op.gt]: new Date() };
    } else if (isLocked === false) {
      (where as any)[Op.or] = [
        { lockedUntil: null },
        { lockedUntil: { [Op.lte]: new Date() } },
      ];
    }

    if (search) {
      (where as any)[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
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
   * Create new user
   */
  const create = async (attributes: CreateUserAttributes): Promise<UserModel> => {
    const userData = {
      ...attributes,
      email: attributes.email.toLowerCase(),
      loginAttempts: 0,
    } as any; // Type cast to handle enum differences

    return await model.create(userData);
  };

  /**
   * Update user by ID
   */
  const update = async (
    id: string,
    attributes: UpdateUserAttributes
  ): Promise<UserModel | null> => {
    const user = await model.findByPk(id);
    if (!user) {
      return null;
    }

    const updateData = { ...attributes };
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    await user.update(updateData as any); // Type cast to handle enum differences
    return user;
  };

  /**
   * Soft delete user (sets deletedAt)
   */
  const deleteUser = async (id: string): Promise<boolean> => {
    const result = await model.destroy({
      where: { id },
    });
    return result > 0;
  };

  /**
   * Restore soft deleted user
   */
  const restore = async (id: string): Promise<UserModel | null> => {
    const user = await model.findByPk(id, { paranoid: false });
    if (!user) {
      return null;
    }

    await user.restore();
    return user;
  };

  /**
   * Permanently delete user
   */
  const forceDelete = async (id: string): Promise<boolean> => {
    const result = await model.destroy({
      where: { id },
      force: true,
    });
    return result > 0;
  };

  /**
   * Count users with optional filters
   */
  const count = async (filters?: Partial<UserModel>): Promise<number> => {
    return await model.count({
      where: filters || {},
    });
  };

  /**
   * Increment login attempts for user
   */
  const incrementLoginAttempts = async (id: string): Promise<UserModel | null> => {
    const user = await model.findByPk(id);
    if (!user) {
      return null;
    }

    await user.incrementLoginAttempts();
    return user;
  };

  /**
   * Reset login attempts for user
   */
  const resetLoginAttempts = async (id: string): Promise<UserModel | null> => {
    const user = await model.findByPk(id);
    if (!user) {
      return null;
    }

    await user.resetLoginAttempts();
    return user;
  };

  /**
   * Lock user account
   */
  const lockAccount = async (
    id: string,
    durationMinutes: number = 30
  ): Promise<UserModel | null> => {
    const user = await model.findByPk(id);
    if (!user) {
      return null;
    }

    await user.lockAccount(durationMinutes);
    return user;
  };

  /**
   * Update user's last login timestamp
   */
  const updateLastLogin = async (id: string): Promise<UserModel | null> => {
    const user = await model.findByPk(id);
    if (!user) {
      return null;
    }

    await user.updateLastLogin();
    return user;
  };

  /**
   * Verify user's email
   */
  const verifyEmail = async (id: string): Promise<UserModel | null> => {
    const user = await model.findByPk(id);
    if (!user) {
      return null;
    }

    await user.verifyEmail();
    return user;
  };

  /**
   * Find all users by role
   */
  const findByRole = async (role: UserRole): Promise<UserModel[]> => {
    return await model.findAll({
      where: { role },
    });
  };

  /**
   * Count users by role
   */
  const countByRole = async (role: UserRole): Promise<number> => {
    return await model.count({
      where: { role },
    });
  };

  /**
   * Check if user has specific role
   */
  const hasRole = async (id: string, role: UserRole): Promise<boolean> => {
    const user = await findById(id);
    return user?.role === role;
  };

  return {
    findById,
    findByEmail,
    findByProvider,
    findAll,
    create,
    update,
    delete: deleteUser,
    restore,
    forceDelete,
    count,
    incrementLoginAttempts,
    resetLoginAttempts,
    lockAccount,
    updateLastLogin,
    verifyEmail,
    findByRole,
    countByRole,
    hasRole,
  };
};

/**
 * Default user repository instance
 */
export const userRepository = createUserRepository(UserModel);