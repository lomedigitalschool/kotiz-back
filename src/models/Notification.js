import { Model, DataTypes } from 'sequelize';

class Notification extends Model {
  static associate(models) {
    // Une notification appartient à un utilisateur destinataire
    Notification.belongsTo(models.User, { 
        foreignKey: 'userId', 
        as: 'recipient' 
        // L'association n'a pas besoin de la référence 'targetKey', 'model', 'name' ici, 
        // car le foreignKey est défini dans la colonne ci-dessous.
    });
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
      type: DataTypes.UUID, 
      primaryKey: true, 
      defaultValue: DataTypes.UUIDV4 
    },
    userId: {
      type: DataTypes.UUID, 
      allowNull: false,
      // C'est ICI que nous forçons la référence à la table réelle de la BDD ('users')
      references: {
        model: 'users', // DOIT ÊTRE EN MINUSCULES et au pluriel
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
      allowNull: false, 
      defaultValue: 'general', 
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
    isRead: { 
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      field: 'is_read', 
    },
    referenceId: {
      type: DataTypes.UUID, 
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
    indexes: [
      { fields: ['userId'] },
      { fields: ['userId', 'is_read'] }
    ]
  });

  return Notification;
}

export default initNotification;
