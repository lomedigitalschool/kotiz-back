/**
 * 🔔 Modèle Notification - Gestion des notifications utilisateur
 * 
 * Ce modèle gère les notifications envoyées aux utilisateurs.
 * Supporte différents types et statuts de lecture.
 * 
 * Relations:
 * - belongsTo: User
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle Notification pour la communication
const Notification = sequelize.define('Notification', {
  // Identifiant unique de la notification
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Titre de la notification
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Contenu détaillé de la notification
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  // Type de notification pour l'affichage (couleur, icône)
  type: {
    type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
    defaultValue: 'info'
  },
  // Statut de lecture par l'utilisateur
  status: {
    type: DataTypes.ENUM('unread', 'read'),
    defaultValue: 'unread'
  }
}, {
  timestamps: true,           // Horodatage pour tri chronologique
  tableName: 'notifications'  // Table des notifications
});

module.exports = Notification;