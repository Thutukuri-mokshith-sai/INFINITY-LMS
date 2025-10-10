// models/Like.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Like = sequelize.define('Like', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: { // Who liked the entity
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    entityId: { // ID of the Thread or Post being liked
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    entityType: { // 'Thread' or 'Post'
        type: DataTypes.ENUM('Thread', 'Post'),
        allowNull: false,
    }
}, {
    // Ensures a user can only like a specific entity (Thread/Post) once
    indexes: [{ unique: true, fields: ['userId', 'entityId', 'entityType'] }]
});

module.exports = Like;