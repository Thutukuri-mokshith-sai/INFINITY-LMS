// models/StudentProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming this path is correct

const StudentProfile = sequelize.define('StudentProfile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // The userId column will be created automatically by the association
    
    phone_number: {
        type: DataTypes.STRING(15),
        allowNull: true,
    },
    major: {
        type: DataTypes.STRING(75),
        allowNull: true,
    },
    gpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00,
    },
    date_of_birth: {
        type: DataTypes.DATEONLY, // Use DATEONLY for just the date
        allowNull: true,
    },
    photo_link: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    // Note: No enrollment_year, per your request
});

module.exports = StudentProfile;