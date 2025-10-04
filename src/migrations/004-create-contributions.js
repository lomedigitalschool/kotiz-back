'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('contributions', {
      id: {
        type: Sequelize.UUID, // 🎯 CORRECTION : Changé de INTEGER à UUID
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4 // Ajouté pour générer automatiquement l'UUID
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: 1
        }
      },
      anonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      paymentReference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      userId: {
        type: Sequelize.UUID, // 🎯 CORRECTION : Changé de INTEGER à UUID (référence users.id)
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
      pullId: {
        type: Sequelize.UUID, // 🎯 CORRECTION : Changé de INTEGER à UUID (en supposant que pulls.id est aussi un UUID)
        references: {
          model: 'pulls',
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
    await queryInterface.dropTable('contributions');
  }
};
