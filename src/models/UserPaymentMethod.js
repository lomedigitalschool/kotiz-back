/**
 * 🔗 Modèle UserPaymentMethod - Association utilisateurs et méthodes de paiement
 * 
 * Ce modèle gère l'association entre les utilisateurs et leurs méthodes de paiement.
 * Stocke les numéros de compte et définit les méthodes par défaut.
 * 
 * Relations:
 * - belongsTo: User, PaymentMethod
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Table de liaison utilisateurs <-> méthodes de paiement
const UserPaymentMethod = sequelize.define('UserPaymentMethod', {
  // Identifiant unique de l'association
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Numéro de compte/téléphone pour la méthode
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Méthode de paiement par défaut de l'utilisateur
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Statut de la méthode pour cet utilisateur
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,                   // Horodatage des associations
  tableName: 'user_payment_methods'  // Table de liaison
});

module.exports = UserPaymentMethod;