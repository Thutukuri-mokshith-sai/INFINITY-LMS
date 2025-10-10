// models/SubmissionResource.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubmissionResource = sequelize.define('SubmissionResource', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // The link to the student's uploaded file (PDF, zip, deployed site URL)
    resourceLink: { 
        type: DataTypes.STRING, 
        allowNull: false,
        comment: 'URL to the uploaded file or external resource.',
    },
    // A brief label for the file (e.g., "Final Report", "Code ZIP")
    title: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    // Foreign Key: Links the file to the specific submission
    submissionId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: true, // e.g., 'PDF', 'DOCX', 'ZIP', 'External Link'
    }
});

module.exports = SubmissionResource;