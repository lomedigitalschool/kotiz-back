// 1. Import Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle Notification
const Notification = sequelize.define('Notification', {
  id: {                                           // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {                                       // Titre de la notification
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {                                     // Contenu de la notification
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {                                        // Type de notification
    type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
    defaultValue: 'info'
  },
  status: {                                      // Statut : lue ou non
    type: DataTypes.ENUM('unread', 'read'),
    defaultValue: 'unread'
  }
}, {
  timestamps: true,                              // createdAt & updatedAt
  tableName: 'notifications'
});

module.exports = Notification;
