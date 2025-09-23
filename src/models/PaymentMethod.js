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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Le nom d'une méthode de paiement doit être unique
      validate: {
        notEmpty: {
          msg: 'Le nom du moyen de paiement est requis.'
        },
        len: [3, 100] // Validation de la longueur
      }
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false, // Le fournisseur devrait être obligatoire pour la traçabilité
      validate: {
        notEmpty: {
          msg: 'Le fournisseur du moyen de paiement est requis.'
        },
        len: [3, 100]
      }
    }
  }, {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: true
  });

  return PaymentMethod;
}

module.exports = initPaymentMethod;