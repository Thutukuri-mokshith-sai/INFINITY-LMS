const express = require('express');
const { 
    createAssignment,
    getCourseAssignments,
    getAssignmentDetails, 
    getSubmissionsByAssignment, 
    updateAssignment, 
    deleteAssignment, 
    submitAssignment,
    getAllSubmissionsForCourse,
    getStudentSubmission,
    updateStudentSubmission, // <-- NEW IMPORT
    deleteStudentSubmission // <-- NEW IMPORT
} = require('../controllers/assignmentSubmissionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const router = express.Router();

// Base path for this router is /api/assignments

// ----------------------------------------------------
// General Actions (Teacher & Student)
// ----------------------------------------------------

// GET /api/assignments/course/:courseId - Get all assignments for a course
router.get(
    '/course/:courseId',
    protect, 
    getCourseAssignments
);

// GET /api/assignments/:assignmentId - Get single assignment details (Used by both)
router.get(
    '/:assignmentId', 
    protect, 
    getAssignmentDetails
);


// ----------------------------------------------------
// Teacher Actions (Create, Update, Delete Assignment & View Submissions)
// ----------------------------------------------------

// POST /api/assignments/ - Create Assignment
router.post(
    '/',
    protect,
    restrictTo('Teacher', 'Super Admin'),
    createAssignment
);

// PATCH /api/assignments/:assignmentId - Update Assignment
router.patch( 
    '/:assignmentId', 
    protect,
    restrictTo('Teacher', 'Super Admin'),
    updateAssignment
);

// DELETE /api/assignments/:assignmentId - Delete Assignment
router.delete(
    '/:assignmentId', 
    protect,
    restrictTo('Teacher', 'Super Admin'),
    deleteAssignment
);

// GET /api/assignments/course/:courseId/submissions (View all submissions for a course)
router.get(
    '/course/:courseId/submissions',
    protect,
    restrictTo('Teacher', 'Super Admin'),
    getAllSubmissionsForCourse
);

// GET /api/assignments/:assignmentId/submissions (View all submissions for a single assignment)
router.get(
    '/:assignmentId/submissions', 
    protect,
    restrictTo('Teacher', 'Super Admin'),
    getSubmissionsByAssignment
);

// ----------------------------------------------------
// Student Actions (Submit, Update, Delete Assignment & View Own Submission)
// ----------------------------------------------------

// POST /api/assignments/:assignmentId/submit (Used for initial submission or resubmission after due date)
router.post(
    '/:assignmentId/submit',
    protect,
    restrictTo('Student'),
    submitAssignment
);

// GET /api/assignments/:assignmentId/my-submission
router.get(
    '/:assignmentId/my-submission',
    protect,
    restrictTo('Student'),
    getStudentSubmission
);

// PATCH /api/assignments/:assignmentId/my-submission
router.patch( // <-- NEW ROUTE: Update student's submission before due date
    '/:assignmentId/my-submission',
    protect,
    restrictTo('Student'),
    updateStudentSubmission
);

// DELETE /api/assignments/:assignmentId/my-submission
router.delete( // <-- NEW ROUTE: Delete student's submission before due date
    '/:assignmentId/my-submission',
    protect,
    restrictTo('Student'),
    deleteStudentSubmission
);

module.exports = router;