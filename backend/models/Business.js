import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Business = sequelize.define('Business', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'businesses'
});

Business.belongsTo(User, { foreignKey: 'ownerUserId', as: 'owner' });
User.hasMany(Business, { foreignKey: 'ownerUserId', as: 'businesses' });

export default Business;
