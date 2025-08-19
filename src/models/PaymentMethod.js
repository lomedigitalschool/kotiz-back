// 1. Import Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle PaymentMethod
const PaymentMethod = sequelize.define('PaymentMethod', {
  id: {                                         // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {                                       // Nom du moyen de paiement
    type: DataTypes.STRING,
    allowNull: false                            // Obligatoire (ex: "MTN Mobile Money")
  },
  type: {                                       // Type : mobile_money, card, bank
    type: DataTypes.ENUM('mobile_money', 'card', 'bank'),
    allowNull: false
  },
  provider: {                                   // Fournisseur (MTN, Moov, Visa…)
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {                                   // Disponible ou désactivé ?
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,                             // createdAt & updatedAt
  tableName: 'payment_methods'
});

module.exports = PaymentMethod;
