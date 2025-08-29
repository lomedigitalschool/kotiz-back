const { Model, DataTypes } = require('sequelize');

class Kyc extends Model {
  static associate(models) {
    // Un utilisateur peut avoir plusieurs KYC
    Kyc.belongsTo(models.User, { 
      foreignKey: 'userId',
      as: 'user'
    });
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
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    typePiece: {
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
    photoRecto: {
      type: DataTypes.STRING,
      allowNull: false
    },
    photoVerso: {
      type: DataTypes.STRING,
      allowNull: false
    },
    statutVerification: {
      type: DataTypes.ENUM('EN_ATTENTE', 'APPROUVE', 'REFUSE'),
      defaultValue: 'EN_ATTENTE'
    },
    commentaireAdmin: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    typeSubmission: {
      type: DataTypes.ENUM('PREMIERE_SOUMISSION', 'NOUVELLE_TENTATIVE', 'RENOUVELLEMENT', 'CORRECTION'),
      allowNull: false,
      defaultValue: 'PREMIERE_SOUMISSION'
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
