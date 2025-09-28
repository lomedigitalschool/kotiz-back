'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter le champ typeSubmission
    await queryInterface.addColumn('kyc', 'typeSubmission', {
      type: Sequelize.ENUM('PREMIERE_SOUMISSION', 'NOUVELLE_TENTATIVE', 'RENOUVELLEMENT', 'CORRECTION'),
      allowNull: false,
      defaultValue: 'PREMIERE_SOUMISSION'
    });

    // Ajouter le champ submissionDate
    await queryInterface.addColumn('kyc', 'submissionDate', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
    });

    // Ajouter le champ isActive
    await queryInterface.addColumn('kyc', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    // Supprimer la contrainte unique sur numeroPiece pour permettre plusieurs soumissions
    await queryInterface.removeConstraint('kyc', 'kyc_numeroPiece_key');
    
    // Ajouter un index composite pour éviter les doublons actifs
    await queryInterface.addIndex('kyc', ['userId', 'numeroPiece', 'isActive'], {
      name: 'kyc_user_piece_active_idx',
      unique: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer l'index composite
    await queryInterface.removeIndex('kyc', 'kyc_user_piece_active_idx');
    
    // Remettre la contrainte unique sur numeroPiece
    await queryInterface.addConstraint('kyc', {
      fields: ['numeroPiece'],
      type: 'unique',
      name: 'kyc_numeroPiece_key'
    });

    // Supprimer les nouveaux champs
    await queryInterface.removeColumn('kyc', 'isActive');
    await queryInterface.removeColumn('kyc', 'submissionDate');
    await queryInterface.removeColumn('kyc', 'typeSubmission');
  }
};