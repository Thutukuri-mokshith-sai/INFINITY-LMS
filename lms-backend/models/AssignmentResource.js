// models/AssignmentResource.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssignmentResource = sequelize.define('AssignmentResource', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // The link to the file (PDF, video, image, etc.)
    resourceLink: { 
        type: DataTypes.STRING, 
        allowNull: false,
    },
    // A brief label for the link (e.g., "Guidelines PDF", "Sample Code")
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Foreign Key: Links the resource to the specific assignment
    assignmentId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: true, // e.g., 'PDF', 'DOCX', 'Video Link'
    }
});

module.exports = AssignmentResource;