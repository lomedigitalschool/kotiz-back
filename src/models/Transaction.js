const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'XOF' },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'pending' },
  providerReference: { type: DataTypes.STRING },
  providerResponse: { type: DataTypes.TEXT }
}, {
  tableName: 'transactions',
  timestamps: true
});

module.exports = Transaction;
