'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('notifications');
    if (tableDescription.status) {
      await queryInterface.removeColumn('notifications', 'status');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('notifications', 'status', {
      type: Sequelize.ENUM('unread', 'read'),
      defaultValue: 'unread',
      allowNull: false
    });
  }
};