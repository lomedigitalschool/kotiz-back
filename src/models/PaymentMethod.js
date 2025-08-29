const { Model, DataTypes } = require('sequelize');

class PaymentMethod extends Model {
  static associate(models) {
    PaymentMethod.hasMany(models.Transaction, { foreignKey: 'paymentMethodId', as: 'transactions' });
    PaymentMethod.hasMany(models.UserPaymentMethod, { foreignKey: 'paymentMethodId', as: 'userMethods' });
  }
}

function initPaymentMethod(sequelize) {
  PaymentMethod.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    provider: { type: DataTypes.STRING, allowNull: true }
  }, {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: true
  });

  return PaymentMethod;
}

module.exports = initPaymentMethod;
