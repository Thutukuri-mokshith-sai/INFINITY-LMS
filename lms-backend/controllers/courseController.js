// controllers/courseController.js
const db = require('../models/index');
const Course = db.Course;
const User = db.User;

// 1. Teacher: Create a new course
exports.createCourse = async (req, res) => {
  const { title, description, duration } = req.body;
  const teacherId = req.user.id; // From authMiddleware

  if (!title || !duration) {
    return res.status(400).json({ message: 'Title and duration are required.' });
  }

  try {
    const newCourse = await Course.create({
      title,
      description,
      duration,
      teacherId
    });

    res.status(201).json({
      message: 'Course created successfully.',
      course: newCourse,
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'A course with this title already exists.' });
    }
    res.status(500).json({ message: 'Server error while creating course.' });
  }
};

// 2. Student/Teacher: View list of available courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      // Include the Teacher's details using the defined association alias
      include: [{
        model: User,
        as: 'Teacher',
        attributes: ['id', 'name', 'email'],
      }],
      attributes: ['id', 'title', 'description', 'duration', 'createdAt']
    });

    res.status(200).json({
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching courses.' });
  }
};