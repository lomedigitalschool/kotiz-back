import { Model, DataTypes } from 'sequelize';

class Pull extends Model {
  static associate(models) {
    Pull.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
    Pull.hasMany(models.Contribution, { foreignKey: 'pullId', as: 'contributions' });
  }
}

function initPull(sequelize) {
  Pull.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'L\'ID de l\'utilisateur est requis.'
        }
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 255] // Titre entre 3 et 255 caractères
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000] // Description limitée à 2000 caractères
      }
    },
    goalAmount: {
      type: DataTypes.DECIMAL(12,2),
      allowNull: false,
      validate: {
        min: 100, // Montant minimum de 100
        max: 10000000 // Montant maximum de 10 millions
      }
    },
    currentAmount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
    currency: {
      type: DataTypes.ENUM('XOF','EUR','USD','GNF','NGN','GHS','KES'),
      defaultValue: 'XOF',
      allowNull: false,
      validate: {
        isIn: {
          args: [['XOF','EUR','USD','GNF','NGN','GHS','KES']],
          msg: 'Devise non supportée.'
        }
      }
    },
    startDate: { type: DataTypes.DATE, allowNull: true },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isAfter: {
          args: new Date().toISOString(),
          msg: 'La date limite doit être dans le futur.'
        }
      }
    },
    type: {
      type: DataTypes.ENUM('public','private'),
      defaultValue: 'public',
      validate: {
        isIn: {
          args: [['public','private']],
          msg: 'Le type doit être public ou privé.'
        }
      }
    },
    imageUrl: { type: DataTypes.STRING, allowNull: true },
    participantLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10000
      }
    },
    status: {
      type: DataTypes.ENUM('pending','active','closed','suspended'),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending','active','closed','suspended']],
          msg: 'Statut invalide.'
        }
      }
    },
    slug: { type: DataTypes.STRING, allowNull: true, unique: true }
  }, {
    sequelize,
    modelName: 'Pull',
    tableName: 'pulls',
    timestamps: true,
    validate: {
      // Validateur personnalisé pour s'assurer que la date de début est avant la date limite
      startBeforeDeadline() {
        if (this.startDate && this.deadline && this.startDate >= this.deadline) {
          throw new Error('La date de début doit être antérieure à la date limite.');
        }
      }
    }
  });

  return Pull;
}

export default initPull;
