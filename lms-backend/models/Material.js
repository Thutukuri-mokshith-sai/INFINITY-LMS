// models/Material.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  materialLink: {
    type: DataTypes.STRING, // Store the URL/link to the material
    allowNull: false,
    validate: {
      isUrl: true, // Optional: ensure it's a valid URL format
    }
  },
  fileType: { // e.g., 'PDF', 'PPT', 'DOCX', 'Video', 'Link'
    type: DataTypes.STRING,
    allowNull: true,
  },
  courseId: { // Foreign Key to Course
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id',
    }
  },
  uploadedBy: { // Foreign Key to User (the Teacher)
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
}, {
  // Optional: Order materials by creation date by default
  defaultScope: {
    order: [['createdAt', 'DESC']],
  }
});

module.exports = Material;