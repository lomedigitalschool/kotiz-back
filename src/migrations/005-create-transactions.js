'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      
      // FIX: Cette colonne DOIT être UUID pour référencer 'contributions.id'
      contributionId: {
        type: Sequelize.UUID, 
        allowNull: true,
        references: {
          model: 'contributions', // Assurez-vous que le nom de la table est 'contributions' ou 'Contributions'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // FIX: Cette colonne DOIT être UUID pour référencer 'users.id'
      userId: {
        type: Sequelize.UUID,
        allowNull: true, // Rendre nullable si les transactions anonymes sont possibles
        references: {
          model: 'users', // Assurez-vous que le nom de la table est 'users'
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Ceci reste INTEGER car 'payment_methods.id' est un INTEGER
      paymentMethodId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'payment_methods',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      transactionReference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      
      currency: {
        type: Sequelize.ENUM('XOF', 'EUR', 'USD'),
        defaultValue: 'XOF',
        allowNull: false
      },
      
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      
      providerReference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      providerResponse: {
        type: Sequelize.JSON, // JSON est généralement préféré pour les réponses d'API structurées
        allowNull: true
      },
      
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
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
    await queryInterface.dropTable('transactions');
  }
};
