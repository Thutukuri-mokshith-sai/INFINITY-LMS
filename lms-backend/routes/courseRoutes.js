// routes/courseRoutes.js
const express = require('express');
const { createCourse, getAllCourses } = require('../controllers/courseController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const router = express.Router();

// User Story 2: Teacher Course Management (Create)
router.post(
  '/',
  protect, // Ensure user is logged in
  restrictTo('Teacher', 'Super Admin'), // Restrict creation to Teachers/Admins
  createCourse
);

// User Story 2: Student/Teacher Course Viewing
router.get(
  '/',
  protect, // Ensure user is logged in
  getAllCourses
);

module.exports = router;