// models/ForumParticipant.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumParticipant = sequelize.define('ForumParticipant', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    forumId: { // Foreign Key
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: { // Foreign Key
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('Student', 'Teacher'),
        allowNull: false,
    },
    joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    // Ensures a user can only be listed once per forum
    indexes: [{ unique: true, fields: ['forumId', 'userId'] }]
});

module.exports = ForumParticipant;