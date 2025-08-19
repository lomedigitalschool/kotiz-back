// 1. Import Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle Transaction
const Transaction = sequelize.define('Transaction', {
  id: {                                           // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {                                       // Montant de la transaction
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  currency: {                                     // Devise utilisée (XOF, EUR…)
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {                                       // Statut de la transaction
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  providerReference: {                            // Référence renvoyée par l’opérateur (ex: MTN, Flooz, Visa)
    type: DataTypes.STRING,
    allowNull: true
  },
  providerResponse: {                             // Réponse brute (JSON, texte) du fournisseur de paiement
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,                               // createdAt & updatedAt
  tableName: 'transactions'
});

module.exports = Transaction;
