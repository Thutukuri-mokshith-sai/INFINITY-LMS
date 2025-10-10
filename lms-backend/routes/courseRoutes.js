// routes/courseRoutes.js
const express = require('express');
const {
  createCourse,
  getAllCourses,
  updateCourse,
  deleteCourse,
  getCoursesByTeacher,
  getCourseById // Added
} = require('../controllers/courseController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const router = express.Router();

// User Story 2: Teacher Course Management (Create)
router.post(
  '/',
  protect, // Ensure user is logged in
  restrictTo('Teacher', 'Super Admin'), // Restrict creation to Teachers/Admins
  createCourse
);

// User Story 2: Student/Teacher Course Viewing (All Courses)
router.get(
  '/',
  protect, // Ensure user is logged in
  getAllCourses
);

// 5. Teacher: Get courses by the authenticated teacher's ID (New Route)
router.get(
  '/my-courses',
  protect, // Ensure user is logged in
  restrictTo('Teacher', 'Super Admin'), // Only Teachers/Admins can view their own courses
  getCoursesByTeacher
);

// 6. Teacher/Student: Get a Course by ID (New Route) - Added to the route chain
// 3. Teacher: Update a course by ID
// 4. Teacher: Delete a course by ID
router.route('/:id')
  .get(
    protect, // Ensure user is logged in
    getCourseById // Accessible to any authenticated user (Student or Teacher)
  )
  .put(
    protect, // Ensure user is logged in
    restrictTo('Teacher', 'Super Admin'), // Restrict update to Teachers/Admins
    updateCourse
  )
  .delete(
    protect, // Ensure user is logged in
    restrictTo('Teacher', 'Super Admin'), // Restrict deletion to Teachers/Admins
    deleteCourse
  );


module.exports = router;