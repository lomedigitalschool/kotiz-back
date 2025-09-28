'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    // Ajouter les nouvelles devises à l'ENUM currency de la table pulls
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_pulls_currency" ADD VALUE IF NOT EXISTS 'GNF';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_pulls_currency" ADD VALUE IF NOT EXISTS 'NGN';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_pulls_currency" ADD VALUE IF NOT EXISTS 'GHS';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_pulls_currency" ADD VALUE IF NOT EXISTS 'KES';
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL ne permet pas de supprimer des valeurs d'un ENUM
    // Cette migration est donc irréversible
    console.log('Migration irréversible: impossible de supprimer des valeurs d\'un ENUM PostgreSQL');
  }
};