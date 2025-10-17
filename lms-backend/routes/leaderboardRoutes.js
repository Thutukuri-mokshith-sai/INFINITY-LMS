const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 
// Assuming you have 'protect' middleware to ensure the user is logged in

// GET /api/leaderboard/course/:courseId
router.get('/course/:courseId', protect, leaderboardController.getCourseLeaderboard);

module.exports = router;