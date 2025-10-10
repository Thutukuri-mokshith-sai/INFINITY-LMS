// models/Thread.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Thread = sequelize.define('Thread', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    forumId: { // Foreign Key: Links to the Forum table
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: { // Foreign Key: Links to the User table (Creator)
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    // Timestamps are automatically added
});

module.exports = Thread;