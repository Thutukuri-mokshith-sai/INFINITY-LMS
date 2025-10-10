// routes/gradeRoutes.js

const express = require('express');
const {
    gradeSubmission,
    getAssignmentGrade,
    getOverallCourseGrade,
    getAllAssignmentGrades,
    unmarkSubmissionGrade,
    getSubmissionGradeDetails // Added for R by submissionId
} = require('../controllers/gradeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Base path for this router is likely /api/v1/grades

// ----------------------------------------------------
// Teacher/Admin Actions (Grading & Gradebook Management)
// ----------------------------------------------------

// API 1 (C/U): Grade or regrade a specific student submission
// PATCH /api/v1/grades/submission/:submissionId
router.patch(
    '/submission/:submissionId',
    protect,
    restrictTo('Teacher', 'Super Admin'),
    gradeSubmission
);

// API 4 (R - All): View all graded/ungraded submissions for a specific assignment (Teacher's Gradebook View)
// GET /api/v1/grades/assignment/:assignmentId/all
router.get(
    '/assignment/:assignmentId/all',
    protect,
    restrictTo('Teacher', 'Super Admin'),
    getAllAssignmentGrades
);

// API 5 (D): Remove/unmark a grade for a submission (sets grade to NULL)
// PATCH /api/v1/grades/submission/:submissionId/unmark
router.patch(
    '/submission/:submissionId/unmark',
    protect,
    restrictTo('Teacher', 'Super Admin'),
    unmarkSubmissionGrade
);


// ----------------------------------------------------
// General Actions (Read Single Submission Details)
// ----------------------------------------------------

// API 6 (R - Single Submission): Get detailed submission/grade info by submission ID
// Accessible by: Student (their own), Teacher (their course's), Admin (any)
// GET /api/v1/grades/submission/:submissionId
router.get(
    '/submission/:submissionId',
    protect,
    restrictTo('Student', 'Teacher', 'Super Admin'),
    getSubmissionGradeDetails
);


// ----------------------------------------------------
// Student/General Actions (Viewing Grades)
// ----------------------------------------------------

// API 2 (R - Single): View grade and feedback for a specific assignment (Student View)
// GET /api/v1/grades/assignment/:assignmentId
router.get(
    '/assignment/:assignmentId',
    protect,
    restrictTo('Student', 'Teacher', 'Super Admin'), 
    getAssignmentGrade
);

// API 3 (R - Course): View overall course grade
// GET /api/v1/grades/course/:courseId
router.get(
    '/course/:courseId',
    protect,
    restrictTo('Student', 'Teacher', 'Super Admin'), 
    getOverallCourseGrade
);

module.exports = router;