// routes/gradeCenterRoutes.js
const express = require('express');
const { 
    getPendingSubmissions, 
    gradeSubmission, 
    deleteGrade,
    getGradeCenterData
} = require('../controllers/gradeCenterController');
const { protect, restrictTo } = require('../middleware/authMiddleware'); 
const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(protect);
router.use(restrictTo('Teacher', 'Super Admin')); // Only teachers can manage grades

// 1. Fetch all pending submissions (for the Grading Queue view)
router.get('/pending', getPendingSubmissions);

// 2. Fetch all submissions (Graded and Pending) for the main Grade Center view
router.get('/center', getGradeCenterData);

// 3. Create or Update a grade (uses the same endpoint with POST/PUT semantics)
// The controller handles the 24-hour business logic
router.post('/:submissionId', gradeSubmission); 

// 4. Delete/Reset a grade (only allowed within 24 hours of grading)
router.delete('/:submissionId', deleteGrade);

module.exports = router;