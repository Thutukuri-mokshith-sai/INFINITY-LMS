const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    // The foreign keys (userId and courseId) will be added automatically 
    // when we define the associations in index.js using 'through: Enrollment'.
    // If you prefer to define them explicitly:
    /*
    userId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    courseId: { 
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    */
    enrollmentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Automatically record the enrollment time
        allowNull: false,
    },
    // Optional: Add a constraint to ensure a student can only enroll once
    // This is better handled in the association definition or API logic.
}, {
    // Optional: Define a unique index constraint for performance and data integrity
    indexes: [
        {
            unique: true,
            fields: ['userId', 'courseId'] // Ensures one student per course
        }
    ]
});

module.exports = Enrollment;