// models/Resource.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Resource = sequelize.define('Resource', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    entityId: { // ID of the Thread or Post this resource belongs to
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    entityType: { // 'Thread' or 'Post'
        type: DataTypes.ENUM('Thread', 'Post'),
        allowNull: false,
    },
    resourceLink: { // The URL or path to the stored file (e.g., S3 URL)
        type: DataTypes.STRING(1024),
        allowNull: false,
    },
    fileType: { // e.g., 'image/jpeg', 'application/pdf', 'document'
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    fileName: { // Original name of the file
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    // Timestamps are automatically added
});

module.exports = Resource;