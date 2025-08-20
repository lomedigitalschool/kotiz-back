/**
 * 💳 Modèle Transaction - Gestion des transactions financières
 * 
 * Ce modèle gère les transactions liées aux contributions.
 * Il stocke les détails des paiements et les réponses des fournisseurs de paiement.
 * 
 * Relations:
 * - belongsTo: Contribution, PaymentMethod
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle Transaction pour le suivi des paiements
const Transaction = sequelize.define('Transaction', {
  // Identifiant unique de la transaction
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Montant de la transaction (validation >= 0)
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0  // Montant positif ou nul
    }
  },
  // Devise de la transaction
  currency: {
    type: DataTypes.ENUM('XOF', 'EUR', 'USD'),
    allowNull: false,
    defaultValue: 'XOF'
  },
  // Statut de la transaction dans le processus de paiement
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  // Référence unique du fournisseur de paiement
  providerReference: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Réponse complète du fournisseur (JSON sérialisé)
  providerResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,          // Horodatage pour audit financier
  tableName: 'transactions'  // Table des transactions financières
});

module.exports = Transaction;