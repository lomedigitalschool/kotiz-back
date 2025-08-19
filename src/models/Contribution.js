// Modèle Contribution avec Sequelize
// 1. Import Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle Contribution
const Contribution = sequelize.define('Contribution', {
  id: {                                           // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  amount: {                                       // Montant de la contribution
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  anonymous: {                                    // Contribution anonyme ?
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  message: {                                      // Message du donateur
    type: DataTypes.TEXT,
    allowNull: true
  },
  paymentReference: {                             // Référence de paiement (ex: MOMO ID)
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,                               // createdAt & updatedAt
  tableName: 'contributions'
});

module.exports = Contribution;
