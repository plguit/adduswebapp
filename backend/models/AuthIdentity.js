import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const AuthIdentity = sequelize.define('AuthIdentity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  provider: {
    type: DataTypes.ENUM('OTP', 'GOOGLE'),
    allowNull: false,
  },
  providerId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // E.g., phone number or google sub
  }
}, {
  tableName: 'auth_identities'
});

AuthIdentity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuthIdentity, { foreignKey: 'userId', as: 'identities' });

export default AuthIdentity;
