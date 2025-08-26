const { Model, DataTypes } = require('sequelize');

class Notification extends Model {
  static associate(models) {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

function initNotification(sequelize) {
  Notification.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
  });

  return Notification;
}

module.exports = initNotification;
