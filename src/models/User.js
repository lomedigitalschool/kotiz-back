// Modèle User avec Sequelize
// 1. Import des outils Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle User
const User = sequelize.define('User', {
  id: {                                        // Identifiant unique
    type: DataTypes.INTEGER,                   // Type entier
    primaryKey: true,                          // Clé primaire
    autoIncrement: true                        // Auto-incrément
  },
  name: {                                      // Nom complet
    type: DataTypes.STRING,
    allowNull: false                           // obligatoire
  },
  email: {                                     // Email
    type: DataTypes.STRING,
    unique: true,                              // Unique
    allowNull: false
  },
  phone: {                                     // Téléphone
    type: DataTypes.STRING,
    unique: true,                              // Unique
    allowNull: true
  },
  passwordHash: {                              // Mot de passe (haché)
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {                                      // Rôle : user ou admin
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user'
  },
  avatarUrl: {                                 // Photo de profil
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {                                // Email/téléphone vérifié
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastLogin: {                                 // Dernière connexion
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,                            // createdAt & updatedAt automatiques
  tableName: 'users'                           // Nom exact de la table
});

module.exports = User;
