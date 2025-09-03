const { Model, DataTypes } = require('sequelize');

class Report extends Model {
  static associate(models) {
    Report.belongsTo(models.User, { foreignKey: 'reporterId', as: 'reporter' });
    Report.belongsTo(models.Pull, { foreignKey: 'pullId', as: 'pull' });
    Report.belongsTo(models.Contribution, { foreignKey: 'contributionId', as: 'contribution' });
  }
}

function initReport(sequelize) {
  Report.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reporterId: { type: DataTypes.INTEGER, allowNull: false },
    pullId: { type: DataTypes.INTEGER, allowNull: true },
    contributionId: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.ENUM('pull', 'contribution'), allowNull: false },
    reason: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'resolved', 'dismissed'), defaultValue: 'pending' },
    adminResponse: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true
  });

  return Report;
}

module.exports = initReport;