// models/Post.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    threadId: { // Foreign Key: Links to the Thread table
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    userId: { // Foreign Key: Links to the User table (Poster)
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    content: {
        // FIX IS HERE: Changed 'DataTypesNotification' to 'DataTypes'
        type: DataTypes.TEXT, 
        allowNull: false,
    },
}, {
    // Timestamps are automatically added
});

module.exports = Post;