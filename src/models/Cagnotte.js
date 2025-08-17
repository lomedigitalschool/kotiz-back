const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cagnotte = sequelize.define('Cagnotte', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  goalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'XOF' },
  deadline: { type: DataTypes.DATE },
  type: { type: DataTypes.ENUM('public', 'private'), allowNull: false, defaultValue: 'public' },
  imageUrl: { type: DataTypes.STRING },
  participant_limit: { type: DataTypes.INTEGER },
  status: { type: DataTypes.ENUM('active', 'closed', 'pending'), defaultValue: 'pending' },
  shareLink: { type: DataTypes.STRING },
  qrCodeUrl: { type: DataTypes.STRING },
  isApproved: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'cagnottes',
  timestamps: true
});

module.exports = Cagnotte;
