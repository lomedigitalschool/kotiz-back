const { Model, DataTypes } = require('sequelize');

class Kyc extends Model {
  static associate(models) {
    Kyc.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

function initKyc(sequelize) {
  Kyc.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    documentType: { type: DataTypes.STRING, allowNull: false },
    documentUrl: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending','verified','rejected'), defaultValue: 'pending' }
  }, {
    sequelize,
    modelName: 'Kyc',
    tableName: 'kyc',
    timestamps: true
  });

  return Kyc;
}

module.exports = initKyc;
