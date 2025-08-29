// src/migrations/XXX-add-type-submission-to-kyc.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('kyc', 'typeSubmission', {
      type: Sequelize.ENUM('PREMIERE_SOUMISSION', 'NOUVELLE_TENTATIVE', 'RENOUVELLEMENT', 'CORRECTION'),
      allowNull: false,
      defaultValue: 'PREMIERE_SOUMISSION'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('kyc', 'typeSubmission');
  }
};