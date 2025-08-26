/**
 * 📋 Modèle Log - Journalisation des actions utilisateur
 * 
 * Ce modèle enregistre toutes les actions importantes des utilisateurs
 * pour l'audit, la sécurité et le débogage.
 * 
 * Relations:
 * - belongsTo: User
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle Log pour l'audit et la traçabilité
const Log = sequelize.define('Log', {
  // Identifiant unique du log
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Action effectuée (ex: 'pull_created', 'contribution_made')
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Type d'entité concernée (pull, Contribution, etc.)
  entityType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Adresse IP de l'utilisateur (sécurité)
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,  // Horodatage crucial pour l'audit
  tableName: 'logs'  // Table des journaux d'activité
});

module.exports = Log;