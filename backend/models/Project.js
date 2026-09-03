import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Business from './Business.js';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  service: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Draft',
  },
  // We'll store complex JSON fields (like creativeBrief, deliverables) here for Phase 1
  creativeBrief: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  deliverables: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  tableName: 'projects'
});

Project.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });
Business.hasMany(Project, { foreignKey: 'businessId', as: 'projects' });

export default Project;
