'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('contributions');

    // Ajouter la colonne currency si elle n'existe pas
    if (!tableDescription.currency) {
      await queryInterface.addColumn('contributions', 'currency', {
        type: Sequelize.ENUM('XOF','EUR','USD'),
        defaultValue: 'XOF',
        allowNull: false
      });
    }

    // Ajouter la colonne status si elle n'existe pas
    if (!tableDescription.status) {
      await queryInterface.addColumn('contributions', 'status', {
        type: Sequelize.ENUM('pending','completed','failed'),
        defaultValue: 'pending',
        allowNull: false
      });
    }

    // Ajouter la colonne contributorName si elle n'existe pas
    if (!tableDescription.contributorName) {
      await queryInterface.addColumn('contributions', 'contributorName', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    // Ajouter la colonne contributorEmail si elle n'existe pas
    if (!tableDescription.contributorEmail) {
      await queryInterface.addColumn('contributions', 'contributorEmail', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes dans l'ordre inverse
    await queryInterface.removeColumn('contributions', 'contributorEmail');
    await queryInterface.removeColumn('contributions', 'contributorName');
    await queryInterface.removeColumn('contributions', 'status');
    await queryInterface.removeColumn('contributions', 'currency');
  }
};

