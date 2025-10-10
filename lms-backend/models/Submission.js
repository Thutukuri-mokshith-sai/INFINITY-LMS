// models/Submission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // Foreign Key: Links the submission to the specific assignment
    assignmentId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Foreign Key: Links the submission to the student who submitted it
    studentId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    // Optional comment from the student (replaces the old single-content field)
    studentComment: { 
        type: DataTypes.TEXT,
        allowNull: true,
    },
    submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Records the time of submission
        allowNull: false,
    },
    isLate: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    // Fields for Grading (Platinum Level)
    grade: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null until graded
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true, // Null until graded
    },
    gradedBy: {
        type: DataTypes.INTEGER, // Teacher's ID
        allowNull: true,
    },
    gradedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    // Constraint to ensure a student can only submit once per assignment
    indexes: [
        {
            unique: true,
            fields: ['assignmentId', 'studentId']
        }
    ]
});

module.exports = Submission;