import { Model, DataTypes } from 'sequelize';

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

function initNotification(sequelize) {
  Notification.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'L\'ID de l\'utilisateur est requis.'
        }
      }
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
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
  });

  return Notification;
}

module.exports = initNotification;