import { Model, DataTypes } from 'sequelize';

class User extends Model {
  /**
   * Définit les associations avec les autres modèles du système.
   * @param {object} models - Les modèles Sequelize disponibles.
   */
  static associate(models) {
    // Un utilisateur peut créer plusieurs cagnottes (Pulls)
    User.hasMany(models.Pull, { foreignKey: 'userId', as: 'pulls' });
    
    // Un utilisateur peut faire plusieurs contributions
    User.hasMany(models.Contribution, { foreignKey: 'userId', as: 'contributions' });
    
    // Un utilisateur est l'initiateur de plusieurs transactions (contributions, retraits, frais, etc.)
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    
    // Un utilisateur reçoit plusieurs notifications
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    
    // Un utilisateur peut avoir plusieurs méthodes de paiement enregistrées
    User.hasMany(models.UserPaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
    
    // Un utilisateur génère plusieurs logs d'activité (si Log existe)
    // NOTE: Cette association suppose l'existence du modèle Log.
    User.hasMany(models.Log, { foreignKey: 'userId', as: 'logs' });
    
    // Un utilisateur peut soumettre plusieurs dossiers KYC
    // NOTE: Cette association suppose l'existence du modèle Kyc.
    User.hasMany(models.Kyc, { foreignKey: 'userId', as: 'kycSubmissions' });
    
    // Un utilisateur peut soumettre des rapports (Signalements)
    // NOTE: Cette association suppose l'existence du modèle Report.
    User.hasMany(models.Report, { foreignKey: 'reporterId', as: 'reportedItems' });
  }
}

/**
 * Fonction d'initialisation du modèle User (Utilisateur)
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof User}
 */
function initUser(sequelize) {
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nom complet ou pseudonyme de l\'utilisateur',
      validate: {
        notEmpty: true,
        len: [2, 255] // Assure que le nom a une longueur raisonnable
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Peut être null si l'inscription se fait par téléphone
      validate: {
        isEmail: { // Validation du format de l'e-mail
          msg: 'Le format de l\'e-mail est invalide.'
        }
      }
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true, // Peut être null si l'inscription se fait par e-mail
      validate: {
        // Validation basique d'un numéro de téléphone
        is: {
          args: /^\+?[0-9]{8,15}$/,
          msg: 'Le format du numéro de téléphone est invalide.'
        }
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false, // Le hachage du mot de passe est obligatoire
      comment: 'Hash du mot de passe (via bcrypt)',
      validate: {
        notEmpty: {
          msg: 'Le hachage du mot de passe est requis.'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'), // Ajout du rôle "moderator"
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
      unique: true, 
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
    }
  });

  return User;
}

// Correction : Utilisation de l'exportation par défaut ES Module
export default initUser;
