import { Model, DataTypes } from 'sequelize';

class Transaction extends Model {
  static associate(models) {
    Transaction.belongsTo(models.Contribution, { foreignKey: 'contributionId', as: 'contribution' });
    Transaction.belongsTo(models.PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });
  }
}

function initTransaction(sequelize) {
  Transaction.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    contributionId: { type: DataTypes.INTEGER, allowNull: true },
    paymentMethodId: { type: DataTypes.INTEGER, allowNull: true },
    transactionReference: { type: DataTypes.STRING, allowNull: false, unique: true },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    currency: { type: DataTypes.ENUM('XOF','EUR','USD'), defaultValue: 'XOF' },
    status: { type: DataTypes.ENUM('pending','completed','failed'), defaultValue: 'pending' },
    providerReference: { type: DataTypes.STRING, allowNull: true },
    providerResponse: { type: DataTypes.JSON, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true }
  }, {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    // Forcer Sequelize à ne pas inclure userId dans les requêtes
    defaultScope: {
      attributes: { exclude: ['userId'] }
    }
  });

  return Transaction;
}

export default initTransaction;
