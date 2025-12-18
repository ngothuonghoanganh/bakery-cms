/**
 * User Model
 * Sequelize model for user authentication and management
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserRole, UserStatus, AuthProvider } from '@bakery-cms/common';

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  providerId?: string;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export class UserModel extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare passwordHash?: string;
  declare firstName: string;
  declare lastName: string;
  declare role: UserRole;
  declare status: UserStatus;
  declare provider: AuthProvider;
  declare providerId?: string;
  declare emailVerifiedAt?: Date;
  declare lastLoginAt?: Date;
  declare loginAttempts: number;
  declare lockedUntil?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Virtual getters
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  get isLocked(): boolean {
    return this.lockedUntil !== null && this.lockedUntil !== undefined && this.lockedUntil > new Date();
  }

  get isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null && this.emailVerifiedAt !== undefined;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && this.deletedAt === null;
  }

  get isOAuthUser(): boolean {
    return this.provider !== AuthProvider.LOCAL;
  }

  // Instance methods
  async incrementLoginAttempts(): Promise<void> {
    await this.increment('loginAttempts');
    await this.reload();
  }

  async resetLoginAttempts(): Promise<void> {
    await this.update({
      loginAttempts: 0,
      lockedUntil: undefined,
    });
  }

  async lockAccount(durationMinutes: number = 30): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);
    
    await this.update({
      lockedUntil: lockUntil,
    });
  }

  async updateLastLogin(): Promise<void> {
    await this.update({
      lastLoginAt: new Date(),
      loginAttempts: 0,
      lockedUntil: undefined,
    });
  }

  async verifyEmail(): Promise<void> {
    await this.update({
      emailVerifiedAt: new Date(),
      status: UserStatus.ACTIVE,
    });
  }
}

export const initUserModel = (sequelize: Sequelize): typeof UserModel => {
  UserModel.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address',
        },
        len: {
          args: [1, 255],
          msg: 'Email must be between 1 and 255 characters',
        },
      },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'password_hash',
      validate: {
        len: {
          args: [0, 255],
          msg: 'Password hash must not exceed 255 characters',
        },
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'first_name',
      validate: {
        len: {
          args: [1, 100],
          msg: 'First name must be between 1 and 100 characters',
        },
        notEmpty: {
          msg: 'First name cannot be empty',
        },
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'last_name',
      validate: {
        len: {
          args: [1, 100],
          msg: 'Last name must be between 1 and 100 characters',
        },
        notEmpty: {
          msg: 'Last name cannot be empty',
        },
      },
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.CUSTOMER,
      validate: {
        isIn: {
          args: [Object.values(UserRole)],
          msg: 'Role must be one of: ' + Object.values(UserRole).join(', '),
        },
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(UserStatus)),
      allowNull: false,
      defaultValue: UserStatus.PENDING_VERIFICATION,
      validate: {
        isIn: {
          args: [Object.values(UserStatus)],
          msg: 'Status must be one of: ' + Object.values(UserStatus).join(', '),
        },
      },
    },
    provider: {
      type: DataTypes.ENUM(...Object.values(AuthProvider)),
      allowNull: false,
      defaultValue: AuthProvider.LOCAL,
      validate: {
        isIn: {
          args: [Object.values(AuthProvider)],
          msg: 'Provider must be one of: ' + Object.values(AuthProvider).join(', '),
        },
      },
    },
    providerId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'provider_id',
      validate: {
        len: {
          args: [0, 255],
          msg: 'Provider ID must not exceed 255 characters',
        },
        isValidProviderId(value: string | undefined | null) {
          if ((this as any).provider !== AuthProvider.LOCAL && !value) {
            throw new Error('Provider ID is required for OAuth providers');
          }
          if ((this as any).provider === AuthProvider.LOCAL && value) {
            throw new Error('Provider ID should not be set for local authentication');
          }
        },
      },
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verified_at',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'login_attempts',
      validate: {
        min: {
          args: [0],
          msg: 'Login attempts cannot be negative',
        },
      },
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'locked_until',
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true, // Enables soft delete
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'users_email_unique',
      },
      {
        unique: true,
        fields: ['provider', 'provider_id'],
        name: 'users_provider_provider_id_unique',
      },
      {
        fields: ['role'],
        name: 'users_role_index',
      },
      {
        fields: ['status'],
        name: 'users_status_index',
      },
      {
        fields: ['role', 'status'],
        name: 'users_role_status_index',
      },
      {
        fields: ['provider'],
        name: 'users_provider_index',
      },
      {
        fields: ['created_at'],
        name: 'users_created_at_index',
      },
      {
        fields: ['email_verified_at'],
        name: 'users_email_verified_at_index',
      },
      {
        fields: ['last_login_at'],
        name: 'users_last_login_at_index',
      },
      {
        fields: ['locked_until'],
        name: 'users_locked_until_index',
      },
    ],
    hooks: {
      beforeValidate: (user: UserModel) => {
        // Ensure email is lowercase
        if (user.email) {
          user.email = user.email.toLowerCase();
        }
      },
      beforeCreate: (user: UserModel) => {
        // Auto-verify OAuth users
        if (user.provider !== AuthProvider.LOCAL) {
          user.emailVerifiedAt = new Date();
          user.status = UserStatus.ACTIVE;
        }
      },
    },
  });

  return UserModel;
};