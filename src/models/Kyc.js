const { Model, DataTypes } = require('sequelize');

class Kyc extends Model {
  static associate(models) {
    // Un KYC appartient à un utilisateur
    Kyc.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });

    // Un utilisateur peut avoir plusieurs KYC
    models.User.hasMany(Kyc, { foreignKey: 'userId', as: 'kycs' });
  }
}

function initKyc(sequelize) {
  Kyc.init({
    id: { 
      type: DataTypes.UUID, 
      defaultValue: DataTypes.UUIDV4, 
      primaryKey: true 
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    documentType: { 
      type: DataTypes.ENUM('CNI', 'PASSPORT', 'PERMIS_CONDUIRE'), 
      allowNull: false 
    },
    numeroPiece: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
    dateExpiration: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    documentUrlRecto: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    documentUrlVerso: { 
      type: DataTypes.STRING, 
      allowNull: false 
    },
    status: { 
      type: DataTypes.ENUM('EN_ATTENTE','APPROUVE','REFUSE'), 
      defaultValue: 'EN_ATTENTE' 
    },
    commentaireAdmin: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    }
  }, {
    sequelize,
    modelName: 'Kyc',
    tableName: 'kyc',
    timestamps: true
  });

  return Kyc;
}

module.exports = initKyc;
