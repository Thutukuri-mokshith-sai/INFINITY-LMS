// routes/studentDashboardRoutes.js
const express = require('express');
const { getStudentDashboardData } = require('../controllers/studentDashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); // Assuming these are available
const router = express.Router();

router.get(
    '/',
    protect, // Ensure user is logged in
    restrictTo('Student', 'Super Admin'), // Only Students (and Admins) can access the student dashboard
    getStudentDashboardData
);

module.exports = router;