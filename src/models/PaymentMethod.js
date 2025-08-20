/**
 * 📱 Modèle PaymentMethod - Gestion des méthodes de paiement
 * 
 * Ce modèle définit les méthodes de paiement disponibles dans l'application.
 * Supporte Mobile Money, cartes bancaires et virements.
 * 
 * Relations:
 * - hasMany: UserPaymentMethods, Transactions
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle PaymentMethod pour les moyens de paiement
const PaymentMethod = sequelize.define('PaymentMethod', {
  // Identifiant unique de la méthode de paiement
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Nom affiché de la méthode (ex: "MTN Mobile Money")
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Type de méthode de paiement
  type: {
    type: DataTypes.ENUM('mobile_money', 'card', 'bank'),
    allowNull: false
  },
  // Fournisseur du service (MTN, Orange, Visa, etc.)
  provider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Statut d'activation de la méthode
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,             // Horodatage pour gestion des méthodes
  tableName: 'payment_methods'  // Table des méthodes de paiement
});

module.exports = PaymentMethod;