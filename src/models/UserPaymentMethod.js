const { Model, DataTypes } = require('sequelize');

class UserPaymentMethod extends Model {
  static associate(models) {
    UserPaymentMethod.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    UserPaymentMethod.belongsTo(models.PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
  }
}

function initUserPaymentMethod(sequelize) {
  UserPaymentMethod.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    paymentMethodId: { type: DataTypes.INTEGER, allowNull: false },
    accountNumber: { type: DataTypes.STRING, allowNull: false },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
    status: { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' }
  }, {
    sequelize,
    modelName: 'UserPaymentMethod',
    tableName: 'user_payment_methods',
    timestamps: true
  });

  return UserPaymentMethod;
}

module.exports = initUserPaymentMethod;
