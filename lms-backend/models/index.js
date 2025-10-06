// models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Course = require('./Course');

// ----------------------------------------------------
// Define Associations
// ----------------------------------------------------

// User (Teacher) and Course: One-to-Many
User.hasMany(Course, {
  as: 'TaughtCourses',
  foreignKey: 'teacherId',
  onDelete: 'CASCADE'
});

Course.belongsTo(User, {
  as: 'Teacher',
  foreignKey: 'teacherId'
});


// ----------------------------------------------------
// Export objects
// ----------------------------------------------------

const db = {};
db.sequelize = sequelize;
db.User = User;
db.Course = Course;

db.sync = async (options) => {
    await sequelize.sync(options);
};

module.exports = db;