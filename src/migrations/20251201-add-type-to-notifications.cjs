'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Ajouter la colonne type à la table notifications
      await queryInterface.addColumn('notifications', 'type', {
        type: Sequelize.ENUM('info', 'success', 'warning', 'error'),
        defaultValue: 'info',
        allowNull: false
      });
      
      console.log('✅ Colonne type ajoutée à notifications');
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate column')) {
        console.log('⚠️ Colonne type existe déjà dans notifications');
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notifications', 'type');
  }
};