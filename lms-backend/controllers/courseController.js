// controllers/courseController.js
const db = require('../models/index');
const Course = db.Course;
const User = db.User;

// 1. Teacher: Create a new course
exports.createCourse = async (req, res) => {
  const { title, description, duration, startDate, endDate } = req.body;
  const teacherId = req.user.id; // From authMiddleware

  if (!title || !duration || !startDate || !endDate) {
    return res.status(400).json({ message: 'Title, duration, start date, and end date are required.' });
  }

  // Optional: Validate that endDate is after startDate
  if (new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ message: 'End date must be after start date.' });
  }

  try {
    const newCourse = await Course.create({
      title,
      description,
      duration,
      startDate,
      endDate,
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
      include: [{
        model: User,
        as: 'Teacher',
        attributes: ['id', 'name', 'email'],
      }],
      attributes: ['id', 'title', 'description', 'duration', 'startDate', 'endDate', 'createdAt', 'teacherId']
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

// 3. Teacher: Update a course (New Functionality)
exports.updateCourse = async (req, res) => {
  const { id } = req.params;
  const teacherId = req.user.id; // From authMiddleware
  const updateData = req.body;

  try {
    const course = await Course.findOne({ where: { id, teacherId } });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or you are not authorized to update this course.' });
    }

    // Optional: Validate date consistency if both are provided
    if (updateData.startDate && updateData.endDate && new Date(updateData.endDate) < new Date(updateData.startDate)) {
      return res.status(400).json({ message: 'End date must be after start date.' });
    }

    const [updatedRows] = await Course.update(updateData, {
      where: { id, teacherId }
    });

    if (updatedRows === 0) {
      // This case should be rare since we already checked for existence, but ensures robustness
      return res.status(400).json({ message: 'Failed to update course.' });
    }

    const updatedCourse = await Course.findByPk(id);

    res.status(200).json({
      message: 'Course updated successfully.',
      course: updatedCourse
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'A course with this title already exists.' });
    }
    res.status(500).json({ message: 'Server error while updating course.' });
  }
};

// 4. Teacher: Delete a course (New Functionality)
exports.deleteCourse = async (req, res) => {
  const { id } = req.params;
  const teacherId = req.user.id; // From authMiddleware

  try {
    const deletedCount = await Course.destroy({
      where: { id, teacherId }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Course not found or you are not authorized to delete this course.' });
    }

    res.status(204).json(); // 204 No Content for successful deletion

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while deleting course.' });
  }
};

// 5. Teacher: Get courses by the authenticated teacher's ID (New Functionality)
exports.getCoursesByTeacher = async (req, res) => {
  const teacherId = req.user.id; // From authMiddleware

  try {
    const courses = await Course.findAll({
      where: { teacherId },
      attributes: ['id', 'title', 'description', 'duration', 'startDate', 'endDate', 'createdAt']
    });

    res.status(200).json({
      count: courses.length,
      courses,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching courses for the teacher.' });
  }
};

// 6. Teacher/Student: Get a Course by ID (New Functionality)
exports.getCourseById = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await Course.findOne({
      where: { id },
      include: [{
        model: User,
        as: 'Teacher',
        attributes: ['id', 'name', 'email'],
      }],
      attributes: ['id', 'title', 'description', 'duration', 'startDate', 'endDate', 'createdAt', 'teacherId']
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    res.status(200).json({
      course,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching the course.' });
  }
};