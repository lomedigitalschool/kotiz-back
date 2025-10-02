import { Model, DataTypes } from 'sequelize';

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
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    pullId: { type: DataTypes.INTEGER, allowNull: true },
    contributionId: { type: DataTypes.INTEGER, allowNull: true },
    type: {
      type: DataTypes.ENUM('pull', 'contribution'),
      allowNull: false,
      validate: {
        isIn: [['pull', 'contribution']]
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La raison du signalement est requise.'
        },
        len: [5, 255] // Une longueur minimale et maximale pour la raison
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 1000] // Longueur maximale pour la description
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      defaultValue: 'pending',
      allowNull: false
    },
    adminResponse: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true,
    validate: {
      // Validateur personnalisé pour assurer la cohérence entre le type et l'identifiant
      correctlyLinked() {
        if (this.type === 'pull' && !this.pullId) {
          throw new Error('Un rapport de type "pull" doit être lié à un pullId.');
        }
        if (this.type === 'contribution' && !this.contributionId) {
          throw new Error('Un rapport de type "contribution" doit être lié à un contributionId.');
        }
        if (this.pullId && this.contributionId) {
          throw new Error('Un rapport ne peut pas être lié à la fois à un pull et à une contribution.');
        }
      }
    }
  });

  return Report;
}

export default initReport;