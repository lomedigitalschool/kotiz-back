const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  action: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.STRING },
  ipAddress: { type: DataTypes.STRING }
}, {
  tableName: 'logs',
  timestamps: true
});

module.exports = Log;