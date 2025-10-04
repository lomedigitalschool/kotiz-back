'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne currency
    await queryInterface.addColumn('contributions', 'currency', {
      type: Sequelize.ENUM('XOF','EUR','USD'),
      defaultValue: 'XOF',
      allowNull: false
    });

    // Ajouter la colonne status
    await queryInterface.addColumn('contributions', 'status', {
      type: Sequelize.ENUM('pending','completed','failed'),
      defaultValue: 'pending',
      allowNull: false
    });

    // Ajouter la colonne contributorName
    await queryInterface.addColumn('contributions', 'contributorName', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    });

    // Ajouter la colonne contributorEmail
    await queryInterface.addColumn('contributions', 'contributorEmail', {
      type: Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les colonnes dans l'ordre inverse
    await queryInterface.removeColumn('contributions', 'contributorEmail');
    await queryInterface.removeColumn('contributions', 'contributorName');
    await queryInterface.removeColumn('contributions', 'status');
    await queryInterface.removeColumn('contributions', 'currency');
  }
};

