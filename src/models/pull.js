const { Model, DataTypes } = require('sequelize');

class Pull extends Model {
  static associate(models) {
    Pull.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
    Pull.hasMany(models.Contribution, { foreignKey: 'pullId', as: 'contributions' });
  }
}

function initPull(sequelize) {
  Pull.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le titre de la cagnotte est requis.' },
        len: { args: [5, 255], msg: 'Le titre doit avoir entre 5 et 255 caractères.' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: { args: [0, 2000], msg: 'La description ne peut pas dépasser 2000 caractères.' }
      }
    },
    goalAmount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      validate: {
        min: { args: 0.01, msg: 'Le montant cible doit être supérieur à zéro.' },
        isDecimal: { msg: 'Le montant cible doit être un nombre.' }
      }
    },
    currentAmount: {
      type: DataTypes.DECIMAL(12,2),
      defaultValue: 0,
      validate: {
        min: { args: 0, msg: 'Le montant actuel ne peut pas être négatif.' },
        isDecimal: { msg: 'Le montant actuel doit être un nombre.' }
      }
    },
    currency: {
      type: DataTypes.ENUM('XOF','EUR','USD'),
      defaultValue: 'XOF',
      allowNull: false,
      validate: {
        isIn: [['XOF','EUR','USD']]
      }
    },
    startDate: { type: DataTypes.DATE, allowNull: true, validate: { isDate: true } },
    deadline: { type: DataTypes.DATE, allowNull: true, validate: { isDate: true } },
    type: { type: DataTypes.ENUM('public','private'), defaultValue: 'public' },
    imageUrl: { type: DataTypes.STRING, allowNull: true, validate: { isUrl: true } },
    participantLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: { args: 1, msg: 'La limite de participants doit être au moins 1.' }
      }
    },
    status: {
      type: DataTypes.ENUM('pending','active','closed'),
      defaultValue: 'pending',
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/i, // Assure un format de slug propre
      }
    }
  }, {
    sequelize,
    modelName: 'Pull',
    tableName: 'pulls',
    timestamps: true,
    validate: {
      // Validation au niveau de l'instance pour les règles croisées
      dateLogic() {
        if (this.startDate && this.deadline && this.startDate > this.deadline) {
          throw new Error('La date de début ne peut pas être postérieure à la date limite.');
        }
      },
      amountsLogic() {
        // S'assurer que le montant courant ne dépasse jamais le montant cible lors de la création
        if (this.currentAmount > this.goalAmount) {
          throw new Error('Le montant actuel ne peut pas être supérieur au montant cible.');
        }
      }
    }
  });

  return Pull;
}

module.exports = initPull;