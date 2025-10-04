import { Model, DataTypes } from 'sequelize';

class Kyc extends Model {
  static associate(models) {
    // La clé étrangère userId doit pointer vers la clé primaire id de User.
    // Les deux colonnes (userId ici et id dans User) doivent avoir le même type (UUID).
    Kyc.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  }
}

/**
 * Fonction d'initialisation du modèle Kyc (Know Your Customer)
 * @param {import('sequelize').Sequelize} sequelize 
 * @returns {typeof Kyc}
 */
function initKyc(sequelize) {
  Kyc.init({
    id: { 
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true 
    },
    typeSubmission: {
      type: DataTypes.ENUM('PREMIERE_SOUMISSION', 'NOUVELLE_TENTATIVE', 'RENOUVELLEMENT', 'CORRECTION'),
      allowNull: false,
      defaultValue: 'PREMIERE_SOUMISSION'
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
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    userId: {
      // CORRECTION: Changement de INTEGER à UUID pour correspondre à la clé primaire de la table Users
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Kyc',
    tableName: 'kyc',
    timestamps: true
  });

  return Kyc;
}

export default initKyc;
