// models/Notification.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: { // Who receives the notification
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: { // e.g., 'new_reply', 'thread_like', 'forum_announcement'
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    message: { // Notification text (e.g., "Jane replied to your thread")
        type: DataTypes.TEXT,
        allowNull: false,
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    // Optional: ID of the entity that triggered the notification (e.g., PostId or ThreadId)
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true, 
    },
    entityType: { // e.g., 'Post', 'Thread'
        type: DataTypes.STRING(50),
        allowNull: true,
    }
}, {
    // Timestamps (createdAt, updatedAt) are automatically added
});

module.exports = Notification;