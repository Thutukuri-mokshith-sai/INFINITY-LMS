const express = require('express');
const { 
    getTeacherDashboardData,
    createCourse, // Added for completeness if needed in the routes file
    getTeacherStudents // NEW: Import the new controller function
} = require('../controllers/teacherDashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Assuming these are available
const router = express.Router();

// Middleware applied to all routes in this file
router.use(protect); // Ensure user is logged in
router.use(restrictTo('Teacher', 'Super Admin')); // Only Teachers (and Admins) can access these routes

// ---------------------------------------------------------------------

/**
 * @route GET /teacher/dashboard
 * @desc Fetch all data for the teacher's main dashboard view.
 * @access Private (Teacher, Super Admin)
 */
router.get(
    '/dashboard',
    getTeacherDashboardData
);

// ---------------------------------------------------------------------

/**
 * @route GET /teacher/students
 * @desc Get a list of all unique students enrolled in the teacher's courses, 
 * along with the course title(s).
 * @access Private (Teacher, Super Admin)
 */
router.get(
    '/students', // The new route endpoint
    getTeacherStudents
);

// ---------------------------------------------------------------------

/**
 * @route POST /teacher/courses
 * @desc Create a new course.
 * @access Private (Teacher, Super Admin)
 */

module.exports = router;