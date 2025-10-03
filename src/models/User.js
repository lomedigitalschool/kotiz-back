import { Model, Op } from 'sequelize'; // ✅ CORRECTION: Importation de Op ici

/**
 * Classe représentant le modèle User.
 */
class User extends Model {
  /**
   * Définit les associations avec les autres modèles du système.
   * @param {object} models - Les modèles Sequelize disponibles.
   */
  static associate(models) {
    // Un utilisateur peut créer plusieurs cagnottes (Pulls)
    User.hasMany(models.Pull, { foreignKey: 'userId', as: 'pulls' });
    
    // Un utilisateur peut faire plusieurs contributions
    // Note: L'association est faite via 'contributorId' dans Contribution.js
    User.hasMany(models.Contribution, { foreignKey: 'contributorId', as: 'contributions' });
    
    // Un utilisateur est l'initiateur de plusieurs transactions (contributions, retraits, frais, etc.)
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    
    // Un utilisateur reçoit plusieurs notifications
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    
    // Un utilisateur peut avoir plusieurs méthodes de paiement enregistrées
    User.hasMany(models.UserPaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
    
    // Un utilisateur génère plusieurs logs d'activité
    User.hasMany(models.Log, { foreignKey: 'userId', as: 'logs' });
    
    // Un utilisateur peut soumettre plusieurs dossiers KYC
    User.hasMany(models.Kyc, { foreignKey: 'userId', as: 'kycSubmissions' });
    
    // Un utilisateur peut soumettre des rapports (Signalements)
    User.hasMany(models.Report, { foreignKey: 'reporterId', as: 'reportedItems' });
  }
}

/**
 * Fonction d'initialisation du modèle User (Utilisateur)
 * * @param {import('sequelize').Sequelize} sequelize 
 * @param {import('sequelize').DataTypes} DataTypes 
 * @returns {typeof User}
 */
function initUser(sequelize, DataTypes) { // DataTypes est maintenant passé par index.js
  
  // NOTE : Op (Operator) est maintenant importé en haut du fichier, ce bloc est donc supprimé.
  // const { Op } = require('sequelize'); 

  User.init({
    // ✅ CORRIGÉ : Utilisation de DataTypes.UUID pour correspondre à contributorId de Contribution.js
    id: { 
        type: DataTypes.UUID, 
        primaryKey: true, 
        defaultValue: DataTypes.UUIDV4 
    }, 
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nom complet ou pseudonyme de l\'utilisateur',
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: {
          msg: 'Le format de l\'e-mail est invalide.'
        }
      }
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        is: {
          args: /^\+?[0-9]{8,15}$/,
          msg: 'Le format du numéro de téléphone est invalide.'
        }
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hash du mot de passe (via bcrypt)',
      validate: {
        notEmpty: {
          msg: 'Le hachage du mot de passe est requis.'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      defaultValue: 'user',
      allowNull: false
    },
    avatarUrl: { type: DataTypes.STRING, allowNull: true, comment: 'URL de la photo de profil' },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'Compte vérifié (email ou téléphone)' },
    isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'Statut de blocage du compte' },
    lastLogin: { type: DataTypes.DATE, allowNull: true, comment: 'Dernière connexion' },
    resetToken: { type: DataTypes.STRING, allowNull: true, comment: 'Token pour la réinitialisation de mot de passe' },
    resetTokenExpiry: { type: DataTypes.DATE, allowNull: true, comment: 'Expiration du token de réinitialisation' },
    firebaseUid: { 
      type: DataTypes.STRING, 
      allowNull: true, 
      comment: 'UID Firebase (pour authentification ou services tiers)' 
    },
    isPhoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'Téléphone vérifié' },
    phoneVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    passwordResetAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    validate: {
      // Validateur personnalisé pour assurer la présence d'un identifiant unique (e-mail ou téléphone)
      mustHaveUniqueIdentifier() {
        if (!this.email && !this.phone) {
          throw new Error('Un utilisateur doit avoir soit un e-mail, soit un numéro de téléphone.');
        }
      }
    },
    // Ajout d'un index unique explicite pour 'firebaseUid' conditionnel
    indexes: [
        {
            unique: true,
            fields: ['firebaseUid'],
            where: { // Ne crée la contrainte que si la valeur n'est pas NULL (pour PostgreSQL)
                firebaseUid: {
                    [Op.ne]: null // Utilisation de Op.ne
                }
            }
        }
    ]
  });

  return User;
}

// Correction : Utilisation de l'exportation par défaut ES Module
export default initUser;
