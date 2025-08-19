// 1. Import Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle Log
const Log = sequelize.define('Log', {
  id: {                               // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {                           // Action effectuée (ex: création, modification, suppression)
    type: DataTypes.STRING,
    allowNull: false
  },
  entityType: {                       // Type d'entité affectée (User, Cagnotte, etc.)
    type: DataTypes.STRING,
    allowNull: false
  },
  ipAddress: {                        // Adresse IP de l'utilisateur ayant effectué l'action
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,                   // createdAt
  tableName: 'logs'
});

module.exports = Log;
// Note: updatedAt is not included as logs typically do not change after creation