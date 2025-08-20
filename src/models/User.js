/**
 * 👤 Modèle User - Gestion des utilisateurs
 * 
 * Ce modèle définit la structure des utilisateurs de l'application Kotiz.
 * Il gère les comptes utilisateurs et administrateurs avec authentification sécurisée.
 * 
 * Relations:
 * - hasMany: Cagnottes, Contributions, Notifications, UserPaymentMethods, Logs
 * - hasOne: Kyc (vérification d'identité)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle User avec validation et sécurité
const User = sequelize.define('User', {
  // Identifiant unique auto-incrémenté
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Nom complet de l'utilisateur (obligatoire)
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Email unique pour l'authentification
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  // Numéro de téléphone unique (optionnel)
  phone: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  // Mot de passe haché avec bcrypt (sécurité)
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Rôle utilisateur: 'user' ou 'admin'
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false
  },
  // URL de l'avatar (photo de profil)
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Statut de vérification du compte
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Date de dernière connexion
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,      // Ajoute createdAt et updatedAt automatiquement
  tableName: 'users'     // Nom explicite de la table en base
});

module.exports = User;