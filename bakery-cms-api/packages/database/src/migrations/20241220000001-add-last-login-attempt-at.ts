import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.addColumn('users', 'last_login_attempt_at', {
      type: DataTypes.DATE,
      allowNull: true,
    });

    // Add index for performance
    await queryInterface.addIndex('users', ['last_login_attempt_at'], {
      name: 'users_last_login_attempt_at_index',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('users', 'users_last_login_attempt_at_index');
    await queryInterface.removeColumn('users', 'last_login_attempt_at');
  },
};
