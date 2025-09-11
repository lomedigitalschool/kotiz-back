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
    
    // Exemple: "Orange Money", "TMoney", "Carte Bancaire"
    name: { type: DataTypes.STRING, allowNull: false },

    // Exemple: "SEMOA", "STRIPE", "PAYPAL"
    provider: { type: DataTypes.STRING, allowNull: true },

    // Pour activer/désactiver un moyen de paiement
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

    // Config spécifique au provider (API keys, endpoints…)
    config: { type: DataTypes.JSON, allowNull: true },

    // Code technique (utile pour l’API externe)
    code: { 
      type: DataTypes.ENUM('OM', 'TMONEY', 'CARD', 'PAYPAL'),
      allowNull: false,
      defaultValue: 'OM'
    }
  }, {
    sequelize,
    modelName: 'PaymentMethod',
    tableName: 'payment_methods',
    timestamps: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['isActive'] }
    ]
  });

  return PaymentMethod;
}

module.exports = initPaymentMethod;
