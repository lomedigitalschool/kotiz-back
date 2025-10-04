'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_payment_methods', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      // CORRECTION CRUCIALE : Le type doit être UUID pour correspondre à la clé 'id' de la table 'users'
      userId: {
        type: Sequelize.UUID,
        allowNull: false, // Assurez-vous qu'elle est NON NULL pour cette table
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        // J'ai remplacé 'SET NULL' par 'CASCADE' ou 'RESTRICT' si userId est NOT NULL (ce qui est logique ici)
        // Si 'userId' est `NOT NULL` (comme défini dans le modèle corrigé précédemment), il est préférable d'utiliser 'CASCADE' pour la synchronisation, ou même 'RESTRICT'.
        onDelete: 'CASCADE' 
      },
      paymentMethodId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'payment_methods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_payment_methods');
  }
};
