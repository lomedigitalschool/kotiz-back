import { Model, DataTypes } from 'sequelize';

class Report extends Model {
  static associate(models) {
    // Le rapport est soumis par un utilisateur (UUID)
    Report.belongsTo(models.User, { foreignKey: 'reporterId', as: 'reporter' });
    // Le rapport peut être lié à une cagnotte (INTEGER)
    Report.belongsTo(models.Pull, { foreignKey: 'pullId', as: 'pull' });
    // Le rapport peut être lié à une contribution (UUID)
    Report.belongsTo(models.Contribution, { foreignKey: 'contributionId', as: 'contribution' });
  }
}

/**
 * Fonction d'initialisation du modèle Report (Signalement)
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof Report}
 */
function initReport(sequelize) {
  Report.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reporterId: {
      // Réfère Users.id (UUID)
      type: DataTypes.UUID, 
      allowNull: false,
      comment: 'ID de l\'utilisateur qui a soumis le rapport'
    },
    pullId: { 
      // Réfère Pulls.id (INTEGER)
      type: DataTypes.INTEGER, 
      allowNull: true,
      comment: 'ID de la cagnotte signalée (si type="pull")'
    },
    contributionId: { 
      // CORRECTION: Réfère Contributions.id (UUID)
      type: DataTypes.UUID, 
      allowNull: true,
      comment: 'ID de la contribution signalée (si type="contribution")'
    },
    type: {
      type: DataTypes.ENUM('pull', 'contribution'),
      allowNull: false,
      comment: 'Type d\'entité signalée',
      validate: {
        isIn: [['pull', 'contribution']]
      }
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Raison principale du signalement (ex: Fraude, Contenu inapproprié)',
      validate: {
        notEmpty: {
          msg: 'La raison du signalement est requise.'
        },
        len: [5, 255]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description détaillée fournie par l\'utilisateur',
      validate: {
        len: [0, 1000]
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Statut du traitement du signalement (En attente, Résolu, Rejeté)'
    },
    adminResponse: { type: DataTypes.TEXT, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true,
    validate: {
      correctlyLinked() {
        const isPullReport = this.type === 'pull';
        const isContributionReport = this.type === 'contribution';

        if (isPullReport && !this.pullId) {
          throw new Error('Un rapport de type "pull" doit être lié à un pullId.');
        }

        if (isContributionReport && !this.contributionId) {
          throw new Error('Un rapport de type "contribution" doit être lié à un contributionId.');
        }

        if (this.pullId && this.contributionId) {
          throw new Error('Un rapport ne peut pas être lié à la fois à un pull et à une contribution.');
        }

        if (isPullReport && this.contributionId) {
          throw new Error('Un rapport de type "pull" ne doit pas avoir de contributionId.');
        }
        if (isContributionReport && this.pullId) {
          throw new Error('Un rapport de type "contribution" ne doit pas avoir de pullId.');
        }
      }
    }
  });

  return Report;
}

export default initReport;
