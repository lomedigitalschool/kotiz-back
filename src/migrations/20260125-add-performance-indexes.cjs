'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Ajout d\'index de performance...');

    // Index pour les utilisateurs actifs (Dashboard)
    await queryInterface.addIndex('users', ['isBlocked'], {
      name: 'idx_users_active',
      where: {
        isBlocked: false
      }
    });

    // Index pour les utilisateurs vérifiés
    await queryInterface.addIndex('users', ['isVerified'], {
      name: 'idx_users_verified'
    });

    // Index pour les utilisateurs créés ce mois (stats)
    await queryInterface.addIndex('users', ['createdAt'], {
      name: 'idx_users_created_at'
    });

    // Index pour les cagnottes actives (Explorer)
    await queryInterface.addIndex('pulls', ['status'], {
      name: 'idx_pulls_status',
      where: {
        status: 'active'
      }
    });

    // Index pour les cagnottes par utilisateur (Dashboard)
    await queryInterface.addIndex('pulls', ['userId', 'status'], {
      name: 'idx_pulls_user_status'
    });

    // Index pour les cagnottes par type (Explorer)
    await queryInterface.addIndex('pulls', ['type', 'status'], {
      name: 'idx_pulls_type_status'
    });

    // Index pour la recherche dans les cagnottes
    await queryInterface.addIndex('pulls', ['title'], {
      name: 'idx_pulls_title',
      using: 'GIN',
      operator: 'gin_trgm_ops'
    });

    await queryInterface.addIndex('pulls', ['description'], {
      name: 'idx_pulls_description',
      using: 'GIN',
      operator: 'gin_trgm_ops'
    });

    // Index pour les contributions complétées (calcul des montants)
    await queryInterface.addIndex('contributions', ['status'], {
      name: 'idx_contributions_status',
      where: {
        status: 'completed'
      }
    });

    // Index pour les contributions par cagnotte
    await queryInterface.addIndex('contributions', ['pullId', 'status'], {
      name: 'idx_contributions_pull_status'
    });

    // Index pour les contributions par utilisateur
    await queryInterface.addIndex('contributions', ['userId', 'status'], {
      name: 'idx_contributions_user_status'
    });

    // Index pour les notifications non lues
    await queryInterface.addIndex('notifications', ['userId', 'status'], {
      name: 'idx_notifications_user_status'
    });

    // Index pour les transactions récentes
    await queryInterface.addIndex('transactions', ['createdAt'], {
      name: 'idx_transactions_created_at'
    });

    console.log('✅ Index de performance ajoutés');
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Suppression des index de performance...');

    await queryInterface.removeIndex('users', 'idx_users_active');
    await queryInterface.removeIndex('users', 'idx_users_verified');
    await queryInterface.removeIndex('users', 'idx_users_created_at');
    await queryInterface.removeIndex('pulls', 'idx_pulls_status');
    await queryInterface.removeIndex('pulls', 'idx_pulls_user_status');
    await queryInterface.removeIndex('pulls', 'idx_pulls_type_status');
    await queryInterface.removeIndex('pulls', 'idx_pulls_title');
    await queryInterface.removeIndex('pulls', 'idx_pulls_description');
    await queryInterface.removeIndex('contributions', 'idx_contributions_status');
    await queryInterface.removeIndex('contributions', 'idx_contributions_pull_status');
    await queryInterface.removeIndex('contributions', 'idx_contributions_user_status');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_status');
    await queryInterface.removeIndex('transactions', 'idx_transactions_created_at');

    console.log('✅ Index de performance supprimés');
  }
};