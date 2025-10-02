import { Model, DataTypes } from 'sequelize';

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

function initNotification(sequelize) {
  Notification.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { type: DataTypes.ENUM('info', 'success', 'warning', 'error'), defaultValue: 'info' },
    status: { type: DataTypes.ENUM('unread', 'read'), defaultValue: 'unread' }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    // Exclure les colonnes qui n'existent pas en base
    defaultScope: {
      attributes: { exclude: ['read'] }
    }
  });

  return Notification;
}

export default initNotification;
