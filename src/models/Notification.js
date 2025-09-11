const { Model, DataTypes } = require('sequelize');

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
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    type: { 
      type: DataTypes.ENUM('INFO', 'PAYMENT', 'KYC', 'SYSTEM', 'ALERT'),
      defaultValue: 'INFO'
    },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['read'] }
    ]
  });

  return Notification;
}

module.exports = initNotification;
