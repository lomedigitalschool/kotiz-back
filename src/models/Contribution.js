import { Model, DataTypes } from 'sequelize';

class Contribution extends Model {
  static associate(models) {
    Contribution.belongsTo(models.User, { foreignKey: 'userId', as: 'contributor' });
    Contribution.belongsTo(models.Pull, { foreignKey: 'pullId', as: 'Pull' });
    Contribution.hasOne(models.Transaction, { foreignKey: 'contributionId', as: 'transaction' });
  }
}

function initContribution(sequelize) {
  Contribution.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true }, // Permettre les contributions anonymes
    pullId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(12,2), allowNull: false, validate: { min: 0 } },
    currency: { type: DataTypes.ENUM('XOF','EUR','USD'), defaultValue: 'XOF' },
    status: { type: DataTypes.ENUM('pending','completed','failed'), defaultValue: 'pending' },
    // Champs pour les contributions anonymes
    contributorName: { type: DataTypes.STRING, allowNull: true },
    contributorEmail: { type: DataTypes.STRING, allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true }
  }, {
    sequelize,
    modelName: 'Contribution',
    tableName: 'contributions',
    timestamps: true
  });

  return Contribution;
}

export default initContribution;
