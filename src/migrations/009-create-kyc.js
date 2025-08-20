'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('kyc', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      typePiece: {
        type: Sequelize.ENUM('CNI', 'PASSPORT', 'PERMIS_CONDUIRE'),
        allowNull: false
      },
      numeroPiece: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      dateExpiration: {
        type: Sequelize.DATE,
        allowNull: false
      },
      photoRecto: {
        type: Sequelize.STRING,
        allowNull: false
      },
      photoVerso: {
        type: Sequelize.STRING,
        allowNull: false
      },
      statutVerification: {
        type: Sequelize.ENUM('EN_ATTENTE', 'APPROUVE', 'REFUSE'),
        defaultValue: 'EN_ATTENTE'
      },
      commentaireAdmin: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
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
    await queryInterface.dropTable('kyc');
  }
};