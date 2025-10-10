// routes/discussionRoutes.js (Updated & Correct)
const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
    getCourseDiscussionDashboard,
    getOverallDiscussionDashboard // This function MUST be properly exported from the controller
} = require('../controllers/discussionController'); // <--- Controller path
const router = express.Router();

/**
 * GET /api/discussions/dashboard
 * Get the consolidated discussion data for all enrolled courses.
 */
router.get(
    '/dashboard', // Path: /api/discussions/dashboard
    protect, // Middleware to ensure authentication
    getOverallDiscussionDashboard // Ensure this is a FUNCTION
);

/**
 * GET /api/discussions/course/:courseId/dashboard
 * Get the discussion data for a specific course dashboard.
 */
router.get(
    '/course/:courseId/dashboard',
    protect, 
    getCourseDiscussionDashboard
);

module.exports = router;