// routes/leaderboardRoutes.js

const express = require('express');
const { getCourseLeaderboard } = require('../controllers/leaderboardController');
const { protect } = require('../middleware/authMiddleware'); // Assuming 'protect' middleware exists
const router = express.Router();

// Base path for this router is /api/leaderboard

// GET /api/leaderboard/course/:courseId - Get the performance leaderboard for a specific course
// Accessible to any authenticated user (Student, Teacher, Admin)
router.get(
    '/course/:courseId',
    protect, 
    getCourseLeaderboard
);

module.exports = router;