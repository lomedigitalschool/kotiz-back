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
    read: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    getterMethods: {
      isRead() {
        return this.read;
      }
    }
  });

  return Notification;
}

export default initNotification;
