'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Vérifier si la colonne ipAddress existe déjà
    const tableDescription = await queryInterface.describeTable('logs');
    
    if (!tableDescription.ipAddress) {
      await queryInterface.addColumn('logs', 'ipAddress', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('✅ Colonne ipAddress ajoutée à la table logs');
    } else {
      console.log('⚠️ Colonne ipAddress existe déjà dans la table logs');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('logs', 'ipAddress');
  }
};