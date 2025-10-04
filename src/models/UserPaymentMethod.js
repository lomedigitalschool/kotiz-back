import { Model, DataTypes } from 'sequelize';

class UserPaymentMethod extends Model {
  static associate(models) {
    // Association corrigée pour utiliser le bon modèle/alias
    UserPaymentMethod.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    UserPaymentMethod.belongsTo(models.PaymentMethod, { foreignKey: 'paymentMethodId', as: 'method' }); 
  }
}

function initUserPaymentMethod(sequelize) {
  UserPaymentMethod.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    // FIX CRUCIAL: Utiliser DataTypes.UUID pour correspondre à la clé primaire (id) de la table Users
    userId: { 
      type: DataTypes.UUID, 
      allowNull: false 
    },
    
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

export default initUserPaymentMethod;
