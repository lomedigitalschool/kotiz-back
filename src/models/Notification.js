import { Model, DataTypes } from 'sequelize';

class Notification extends Model {
  static associate(models) {
    // Une notification appartient à un utilisateur destinataire
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'recipient' });
  }
}

/**
 * Fonction d'initialisation du modèle Notification
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof Notification}
 */
function initNotification(sequelize) {
  Notification.init({
    id: { 
      type: DataTypes.UUID, // Changé de INTEGER à UUID
      primaryKey: true, 
      defaultValue: DataTypes.UUIDV4 
    },
    userId: {
      type: DataTypes.UUID, // Changé de INTEGER à UUID
      allowNull: false,
      // Clé étrangère vers la table User
      references: {
        model: 'User', 
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
      allowNull: false, // Je recommande de rendre le type obligatoire
      defaultValue: 'general', // ex: 'contribution', 'pull_update', 'system'
      comment: 'Type de l\'événement pour le rendu (ex: contribution, message)'
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
    isRead: { // Renommé de 'read' à 'isRead'
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_read', // Ajout d'un champ snake_case pour la DB
    },
    referenceId: {
      type: DataTypes.UUID, // Changé de INTEGER à UUID
      allowNull: true,
      comment: 'ID de l\'entité liée (Pull, Transaction, etc.)'
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Lien de navigation dans l\'application (URL relative)'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    // Ajouter un index sur userId et isRead pour des requêtes rapides
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'is_read'] }
    ]
  });

  return Notification;
}

// Utilisation de l'exportation par défaut ES Module pour la cohérence du projet
export default initNotification;
