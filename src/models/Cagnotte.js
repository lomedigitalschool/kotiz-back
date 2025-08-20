/**
 * 🎯 Modèle Cagnotte - Gestion des cagnottes de collecte
 * 
 * Ce modèle gère les cagnottes créées par les utilisateurs pour collecter des fonds.
 * Chaque cagnotte peut être publique ou privée, avec validation des montants.
 * 
 * Relations:
 * - belongsTo: User (propriétaire)
 * - hasMany: Contributions
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle Cagnotte avec validation financière
const Cagnotte = sequelize.define('Cagnotte', {
  // Identifiant unique de la cagnotte
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Titre de la cagnotte (obligatoire)
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Description détaillée de la cagnotte
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Montant objectif à collecter (validation > 0)
  goalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 1  // Montant minimum de 1 unité
    }
  },
  // Devise de la cagnotte (XOF par défaut pour l'Afrique de l'Ouest)
  currency: {
    type: DataTypes.ENUM('XOF', 'EUR', 'USD'),
    allowNull: false,
    defaultValue: 'XOF'
  },
  // Date limite de collecte (optionnelle)
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Type de cagnotte: publique ou privée
  type: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'public'
  },
  // Image illustrative de la cagnotte
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Limite du nombre de participants (optionnel)
  participantLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Statut de la cagnotte dans son cycle de vie
  status: {
    type: DataTypes.ENUM('pending', 'active', 'closed'),
    defaultValue: 'pending'
  },
  // Lien de partage unique pour la cagnotte
  shareLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // URL du QR code pour accès rapide
  qrCodeUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Statut d'approbation par l'administrateur
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,        // Horodatage automatique
  tableName: 'cagnottes'   // Table dédiée aux cagnottes
});

module.exports = Cagnotte;