const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static associate(models) {
    User.hasMany(models.Pull, { foreignKey: 'userId', as: 'pulls' });
    User.hasMany(models.Contribution, { foreignKey: 'userId', as: 'contributions' });
    User.hasMany(models.Transaction, { foreignKey: 'userId', as: 'transactions' });
    User.hasMany(models.Notification, { foreignKey: 'userId', as: 'notifications' });
    User.hasMany(models.UserPaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
    User.hasMany(models.Log, { foreignKey: 'userId', as: 'logs' });
    User.hasMany(models.Kyc, { foreignKey: 'userId', as: 'kyc' });
  }
}

function initUser(sequelize) {
  User.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true, unique: true },
    phone: { type: DataTypes.STRING, allowNull: true, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user', allowNull: false },
    avatarUrl: { type: DataTypes.STRING, allowNull: true },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastLogin: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });

  return User;
}

module.exports = initUser;
