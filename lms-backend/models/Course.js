// models/Course.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,  // or DataTypes.DATE if you need time info
    allowNull: false,
  },
  endDate: {
    type: DataTypes.DATEONLY,  // or DataTypes.DATE if you need time info
    allowNull: false,
  },
  teacherId: { // Foreign Key
    type: DataTypes.INTEGER,
    allowNull: false,
  }
});

module.exports = Course;
