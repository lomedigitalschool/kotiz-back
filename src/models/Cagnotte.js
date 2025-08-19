// 1. Import des outils Sequelize
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 2. Définition du modèle Cagnotte
const Cagnotte = sequelize.define('Cagnotte', {
  id: {                                         // Identifiant unique
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {                                      // Titre de la cagnotte
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {                                // Description
    type: DataTypes.TEXT,
    allowNull: true
  },
  goalAmount: {                                 // Objectif en argent
    type: DataTypes.DECIMAL(12, 2),             // Exemple : 10000.50
    allowNull: false
  },
  currency: {                                   // Devise utilisée
    type: DataTypes.STRING,
    allowNull: false
  },
  deadline: {                                   // Date limite
    type: DataTypes.DATE,
    allowNull: true
  },
  type: {                                       // Type : public ou privé
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'public'
  },
  imageUrl: {                                   // Illustration
    type: DataTypes.STRING,
    allowNull: true
  },
  participantLimit: {                           // Nombre max de participants
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {                                     // Statut de la cagnotte
    type: DataTypes.ENUM('pending', 'active', 'closed'),
    defaultValue: 'pending'
  },
  shareLink: {                                  // Lien de partage
    type: DataTypes.STRING,
    allowNull: true
  },
  qrCodeUrl: {                                  // QR code associé
    type: DataTypes.STRING,
    allowNull: true
  },
  isApproved: {                                 // Validation par l’admin
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,                             // createdAt & updatedAt
  tableName: 'cagnottes'
});

module.exports = Cagnotte;
// Export du modèle Cagnotte