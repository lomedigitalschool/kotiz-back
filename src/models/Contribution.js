const { Model, DataTypes } = require('sequelize');

class Contribution extends Model {
  static associate(models) {
    Contribution.belongsTo(models.User, { foreignKey: 'userId', as: 'contributor' });
    Contribution.belongsTo(models.Pull, { foreignKey: 'pullId', as: 'pull' });
    Contribution.hasOne(models.Transaction, { foreignKey: 'contributionId', as: 'transaction' });
  }
}

function initContribution(sequelize) {
  Contribution.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    pullId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    currency: { type: DataTypes.ENUM('XOF','EUR','USD'), defaultValue: 'XOF' },
    status: { type: DataTypes.ENUM('pending','completed','failed'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'Contribution',
    tableName: 'contributions',
    timestamps: true
  });

  return Contribution;
}

module.exports = initContribution;
