/**
 * AuthSession Model
 * Sequelize model for JWT refresh token session management
 */

import { Model, DataTypes, Sequelize } from 'sequelize';
import { UserModel } from './user.model';

enum TokenType {
  REFRESH = 'refresh',
  ACCESS = 'access',
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

export interface AuthSessionAttributes {
  id: string;
  userId: string;
  refreshToken: string;
  tokenType: TokenType;
  expiresAt: Date;
  isRevoked: boolean;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSessionCreationAttributes extends Omit<AuthSessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export class AuthSessionModel extends Model<AuthSessionAttributes, AuthSessionCreationAttributes> implements AuthSessionAttributes {
  declare id: string;
  declare userId: string;
  declare refreshToken: string;
  declare tokenType: TokenType;
  declare expiresAt: Date;
  declare isRevoked: boolean;
  declare deviceInfo?: string;
  declare ipAddress?: string;
  declare userAgent?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Virtual getters
  get isExpired(): boolean {
    return this.expiresAt <= new Date();
  }

  get isValid(): boolean {
    return !this.isRevoked && !this.isExpired;
  }

  get daysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Instance methods
  async revoke(): Promise<void> {
    await this.update({
      isRevoked: true,
    });
  }

  async refresh(newExpiresAt: Date): Promise<void> {
    await this.update({
      expiresAt: newExpiresAt,
    });
  }

  // Static methods
  static async revokeAllForUser(userId: string): Promise<number> {
    const [affectedRows] = await AuthSessionModel.update(
      { isRevoked: true },
      { where: { userId, isRevoked: false } }
    );
    return affectedRows;
  }

  static async cleanupExpired(): Promise<number> {
    const result = await AuthSessionModel.destroy({
      where: {
        expiresAt: {
          [require('sequelize').Op.lt]: new Date(),
        },
      },
    });
    return result;
  }

  static async cleanupRevoked(): Promise<number> {
    const result = await AuthSessionModel.destroy({
      where: {
        isRevoked: true,
      },
    });
    return result;
  }
}

export const initAuthSessionModel = (sequelize: Sequelize): typeof AuthSessionModel => {
  AuthSessionModel.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    refreshToken: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      field: 'refresh_token',
      validate: {
        len: {
          args: [1, 500],
          msg: 'Refresh token must be between 1 and 500 characters',
        },
        notEmpty: {
          msg: 'Refresh token cannot be empty',
        },
      },
    },
    tokenType: {
      type: DataTypes.ENUM(...Object.values(TokenType)),
      allowNull: false,
      defaultValue: TokenType.REFRESH,
      field: 'token_type',
      validate: {
        isIn: {
          args: [Object.values(TokenType)],
          msg: 'Token type must be one of: ' + Object.values(TokenType).join(', '),
        },
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
      validate: {
        isDate: true,
        isAfterNow(value: Date) {
          if (value <= new Date()) {
            throw new Error('Expiration date must be in the future');
          }
        },
      },
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_revoked',
    },
    deviceInfo: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'device_info',
      validate: {
        len: {
          args: [0, 500],
          msg: 'Device info must not exceed 500 characters',
        },
      },
    },
    ipAddress: {
      type: DataTypes.STRING(45), // IPv6 max length
      allowNull: true,
      field: 'ip_address',
      validate: {
        isIP: {
          msg: 'Must be a valid IP address',
        },
      },
    },
    userAgent: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      field: 'user_agent',
      validate: {
        len: {
          args: [0, 1000],
          msg: 'User agent must not exceed 1000 characters',
        },
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
  }, {
    sequelize,
    modelName: 'AuthSession',
    tableName: 'auth_sessions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['refresh_token'],
        name: 'auth_sessions_refresh_token_unique',
      },
      {
        fields: ['user_id'],
        name: 'auth_sessions_user_id_index',
      },
      {
        fields: ['token_type'],
        name: 'auth_sessions_token_type_index',
      },
      {
        fields: ['expires_at'],
        name: 'auth_sessions_expires_at_index',
      },
      {
        fields: ['is_revoked'],
        name: 'auth_sessions_is_revoked_index',
      },
      {
        fields: ['user_id', 'token_type'],
        name: 'auth_sessions_user_id_token_type_index',
      },
      {
        fields: ['user_id', 'is_revoked'],
        name: 'auth_sessions_user_id_is_revoked_index',
      },
      {
        fields: ['created_at'],
        name: 'auth_sessions_created_at_index',
      },
    ],
    hooks: {
      beforeCreate: (authSession: AuthSessionModel) => {
        // Ensure the expiration date is in the future
        if (authSession.expiresAt <= new Date()) {
          const futureDate = new Date();
          futureDate.setFullYear(futureDate.getFullYear() + 1);
          authSession.expiresAt = futureDate;
        }
      },
    },
  });

  return AuthSessionModel;
};

export const setupAuthSessionAssociations = (): void => {
  // Set up association with User model
  AuthSessionModel.belongsTo(UserModel, {
    foreignKey: 'userId',
    as: 'user',
  });
  
  UserModel.hasMany(AuthSessionModel, {
    foreignKey: 'userId',
    as: 'authSessions',
  });
};