'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('logs');

    // Ajouter la colonne details si elle n'existe pas
    if (!tableDescription.details) {
      await queryInterface.addColumn('logs', 'details', {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('logs', 'details');
  }
};
