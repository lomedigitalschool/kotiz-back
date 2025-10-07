'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('contributions', 'paymentMethod', {
      type: Sequelize.ENUM('orange_money', 'mtn_money', 'moov_money', 'wave', 'flooz', 't_money', 'card', 'bank_transfer'),
      allowNull: true,
      validate: {
        isIn: [['orange_money', 'mtn_money', 'moov_money', 'wave', 'flooz', 't_money', 'card', 'bank_transfer']]
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('contributions', 'paymentMethod');
  }
};
