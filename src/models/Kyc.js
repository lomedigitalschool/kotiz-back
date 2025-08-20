/**
 * ✅ Modèle Kyc - Vérification d'identité (Know Your Customer)
 * 
 * Ce modèle gère la vérification d'identité des utilisateurs.
 * Stocke les documents d'identité et leur statut de validation.
 * 
 * Relations:
 * - belongsTo: User (relation 1:1)
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Définition du modèle KYC pour la vérification d'identité
const Kyc = sequelize.define('Kyc', {
  // Identifiant UUID pour sécurité renforcée
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Type de pièce d'identité fournie
  typePiece: {
    type: DataTypes.ENUM('CNI', 'PASSPORT', 'PERMIS_CONDUIRE'),
    allowNull: false
  },
  // Numéro unique de la pièce d'identité
  numeroPiece: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Date d'expiration (doit être future)
  dateExpiration: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter: new Date().toISOString().split('T')[0]  // Validation future
    }
  },
  // URL de la photo recto de la pièce
  photoRecto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // URL de la photo verso de la pièce
  photoVerso: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Statut de vérification par l'administrateur
  statutVerification: {
    type: DataTypes.ENUM('EN_ATTENTE', 'APPROUVE', 'REFUSE'),
    defaultValue: 'EN_ATTENTE'
  },
  // Commentaire de l'administrateur (raison du refus, etc.)
  commentaireAdmin: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,  // Horodatage pour audit de vérification
  tableName: 'kyc'   // Table de vérification d'identité
});

module.exports = Kyc;