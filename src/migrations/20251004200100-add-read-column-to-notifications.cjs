'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('notifications');
    if (!tableDescription.read) {
      await queryInterface.addColumn('notifications', 'read', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notifications', 'read');
  }
};