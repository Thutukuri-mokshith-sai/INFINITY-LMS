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
    },
    
    // ======== NEW FIELDS FOR SIMILARITY CHECK / PLAGIARISM TRACKING ========
    maxSimilarityScore: { // Stores the highest similarity score (e.g., 0.85 for 85%)
        type: DataTypes.FLOAT,
        allowNull: true, 
        comment: 'Maximum similarity score found against other submissions for the same assignment.',
    },
    copiedFromStudentId: { // ID of the student whose submission was most similar
        type: DataTypes.INTEGER,
        allowNull: true, // Null if similarity is low or no match found
        comment: 'ID of the student with the most similar submission (Foreign Key to User).',
    }
    // ======================================================================
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