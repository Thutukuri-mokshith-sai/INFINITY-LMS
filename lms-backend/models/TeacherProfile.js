// models/TeacherProfile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Assuming this path is correct

const TeacherProfile = sequelize.define('TeacherProfile', {
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
    designation: {
        type: DataTypes.STRING(75),
        allowNull: true,
    },
    subject_area: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    years_experience: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
    },
    highest_degree: {
        type: DataTypes.STRING(75),
        allowNull: true,
    },
    photo_link: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    // Note: No hire_date or certification_id, per your request
});

module.exports = TeacherProfile;