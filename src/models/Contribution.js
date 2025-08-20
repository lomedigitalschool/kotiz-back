/**
 * 💰 Modèle Contribution - Gestion des contributions aux cagnottes
 * 
 * Ce modèle gère les contributions financières des utilisateurs aux cagnottes.
 * Supporte les contributions anonymes et avec message personnalisé.
 * 
 * Relations:
 * - belongsTo: Cagnotte, User (optionnel pour anonymes)
 * - hasOne: Transaction
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle Contribution avec validation des montants
const Contribution = sequelize.define('Contribution', {
  // Identifiant unique de la contribution
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Montant de la contribution (validation > 0)
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 1  // Contribution minimum de 1 unité
    }
  },
  // Contribution anonyme (masque l'identité du contributeur)
  anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Message personnalisé du contributeur (optionnel)
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Référence de paiement du fournisseur (Mobile Money, etc.)
  paymentReference: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,           // Horodatage pour traçabilité
  tableName: 'contributions'  // Table des contributions financières
});

module.exports = Contribution;