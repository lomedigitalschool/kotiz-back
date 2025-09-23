const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static associate(models) {
    User.hasMany(models.Pull, { foreignKey: 'userId', as: 'pulls' });
    User.hasMany(models.Contribution, { foreignKey: 'userId', as: 'contributions' });
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    User.hasMany(models.UserPaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
    User.hasMany(models.Log, { foreignKey: 'userId', as: 'logs' });
    User.hasMany(models.Kyc, { foreignKey: 'userId', as: 'kycSubmissions' });
  }
}

function initUser(sequelize) {
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255] // Assure que le nom a une longueur raisonnable
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      validate: {
        isEmail: { // Validation du format de l'e-mail
          msg: 'Le format de l\'e-mail est invalide.'
        }
      }
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
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
      validate: {
        notEmpty: {
          msg: 'Le hachage du mot de passe est requis.'
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
      allowNull: false
    },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastLogin: { type: DataTypes.DATE, allowNull: true },
    resetToken: { type: DataTypes.STRING, allowNull: true },
    resetTokenExpiry: { type: DataTypes.DATE, allowNull: true },
    firebaseUid: { type: DataTypes.STRING, allowNull: true, unique: true },
    isPhoneVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    phoneVerifiedAt: { type: DataTypes.DATE, allowNull: true },
    passwordResetAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    validate: {
      // Validateur personnalisé pour assurer la présence d'un identifiant unique
      mustHaveUniqueIdentifier() {
        if (!this.email && !this.phone) {
          throw new Error('Un utilisateur doit avoir soit un e-mail, soit un numéro de téléphone.');
        }
      }
    }
  });

  return User;
}

module.exports = initUser;