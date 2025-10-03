import { Model } from 'sequelize';

// We define the model as a function that accepts sequelize and DataTypes.
// This prevents it from trying to access the global 'db' object immediately.
export default (sequelize, DataTypes) => {
  class Contribution extends Model {
    /**
     * The associate method is called by your main index file *after* all models
     * have been loaded, resolving the circular dependency issue.
     * 'models' here is the complete set of initialized models (the 'db' object).
     */
    static associate(models) {
      // Establish relationships here, using 'models' instead of 'db'
      Contribution.belongsTo(models.User, {
        foreignKey: 'contributorId',
        as: 'Contributor'
      });
      
      Contribution.belongsTo(models.Pull, {
        foreignKey: 'pullId',
        as: 'pull' // Using 'pull' as alias to match your controller usage
      });
      
      // Contribution has a one-to-one relationship with Transaction
      Contribution.hasMany(models.Transaction, {
        foreignKey: 'contributionId',
        as: 'transactions' // Using 'transactions' as alias to match your controller usage
      });
    }
  }

  Contribution.init({
    // ✅ CORRECTION: Définir explicitement l'ID comme UUID pour éviter le conflit de type avec contributorId (UUID)
    id: { 
        type: DataTypes.UUID, 
        primaryKey: true, 
        defaultValue: DataTypes.UUIDV4 
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'pending',
      allowNull: false
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    contributorName: {
        type: DataTypes.STRING,
        allowNull: true, // Used for anonymous contributions
    },
    contributorEmail: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    paymentReference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Contribution',
    tableName: 'Contributions', // Ensure this matches your query if you use raw SQL
    timestamps: true,
  });

  return Contribution;
};
