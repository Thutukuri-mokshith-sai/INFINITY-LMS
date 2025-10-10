// models/Forum.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Forum = sequelize.define('Forum', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    courseId: { // Foreign Key: Links to the Course table
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Assuming one forum per course
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdById: { // Foreign Key: Links to the User table (Teacher/Admin)
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    // Timestamps (createdAt, updatedAt) are automatically added by default
});

module.exports = Forum;