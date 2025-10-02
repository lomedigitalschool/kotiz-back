import { Model, DataTypes } from 'sequelize';

class Notification extends Model {
  static associate(models) {
    // Une notification appartient à un utilisateur
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

/**
 * Fonction d'initialisation du modèle Notification
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof Notification}
 */
function initNotification(sequelize) {
  Notification.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Clé étrangère vers la table User (si relation définie dans User.js)
      references: {
        model: 'User', // Nom du modèle Sequelize de l'utilisateur
        key: 'id',
      },
      validate: {
        notNull: {
          msg: 'L\'ID de l\'utilisateur est requis.'
        }
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'general' // ex: 'contribution', 'pull_update', 'system'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Le message de la notification ne peut pas être vide.'
        },
        len: {
          args: [1, 500],
          msg: 'Le message doit contenir entre 1 et 500 caractères.'
        }
      }
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de l\'entité liée (Pull, Transaction, etc.)'
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Lien de navigation dans l\'application'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    // Ajouter un index sur userId et read pour des requêtes rapides
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'read'] }
    ]
  });

  return Notification;
}

// Utilisation de l'exportation par défaut ES Module pour la cohérence du projet
export default initNotification;
