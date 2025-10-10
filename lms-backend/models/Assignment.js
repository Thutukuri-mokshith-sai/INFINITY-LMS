// models/Assignment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('Assignment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true, // Instructions can be in the description
    },
    dueDate: {
        type: DataTypes.DATE, 
        allowNull: false,
    },
    maxPoints: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
    },
    // Foreign Key: courseId links the assignment to a specific course
    courseId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Optional: teacherId to track who created the assignment
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }
});

module.exports = Assignment;