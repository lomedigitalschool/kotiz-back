'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('contributions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        allowNull: true
      },
<<<<<<< HEAD
      cagnotteId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'cagnottes',
=======
      pullId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'pulls',
>>>>>>> 44ab4540fad1424416fa9dbdaf603e099b6c8893
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