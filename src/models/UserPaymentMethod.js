// 1. Import Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle UserPaymentMethod
const UserPaymentMethod = sequelize.define('UserPaymentMethod', {
  id: {                                           // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accountNumber: {                                // Identifiant de compte (numéro momo, IBAN, n° carte)
    type: DataTypes.STRING,
    allowNull: false
  },
  isDefault: {                                    // Méthode par défaut ?
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {                                       // Statut de la méthode
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,                               // createdAt & updatedAt
  tableName: 'user_payment_methods'
});

module.exports = UserPaymentMethod;
