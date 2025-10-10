const express = require('express');
const {
    enrollInCourse,
    getMyEnrolledCourses,
    getStudentsByCourse
} = require('../controllers/enrollmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const router = express.Router();

// Base path for this router is likely /api/v1/enrollments

// ----------------------------------------------------
// Student Actions
// ----------------------------------------------------

// User Story 3: Enroll in a course
// POST /api/v1/enrollments/
router.post(
    '/',
    protect, // Must be logged in
    restrictTo('Student'), // Only students can enroll
    enrollInCourse
);

// User Story 3: View a list of courses the student is enrolled in
// GET /api/v1/enrollments/my-courses
router.get(
    '/my-courses',
    protect, // Must be logged in
    restrictTo('Student'), // Only students view their own enrolled courses
    getMyEnrolledCourses
);

// ----------------------------------------------------
// Teacher Actions
// ----------------------------------------------------

// User Story 3: View a list of students enrolled in a specific course
// GET /api/v1/enrollments/course/:courseId/students
router.get(
    '/course/:courseId/students',
    protect, // Must be logged in
    restrictTo('Teacher', 'Super Admin'), // Only teachers/admins can view student rosters
    getStudentsByCourse
);

module.exports = router;