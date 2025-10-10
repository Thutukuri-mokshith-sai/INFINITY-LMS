// controllers/gradeCenterController.js
const db = require('../models/index');
const { Op } = require('sequelize');
const moment = require('moment'); 

const Submission = db.Submission;
const Assignment = db.Assignment;
const Course = db.Course;
const User = db.User;

/**
 * @desc Fetch all submissions for the teacher's courses that are pending grading.
 * @route GET /grades/pending
 * @access Private (Teacher, Super Admin)
 */
exports.getPendingSubmissions = async (req, res) => {
    const teacherId = req.user.id;

    try {
        const pendingSubmissions = await Submission.findAll({
            where: { 
                grade: { [Op.is]: null } // Grade is NULL means pending
            },
            // FIX: Changed 'notes' to 'studentComment' based on the provided schema.
            attributes: ['id', 'submittedAt', 'studentComment'],
            include: [
                {
                    model: Assignment,
                    as: 'Assignment',
                    attributes: ['id', 'title', 'dueDate', 'maxPoints'],
                    include: [{
                        model: Course,
                        as: 'Course',
                        attributes: ['id', 'title'],
                        where: { teacherId } // Filter by the courses taught by this teacher
                    }]
                },
                {
                    model: User,
                    as: 'Student', // Assumes alias 'Student' in Submission model
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['submittedAt', 'DESC']]
        });

        if (pendingSubmissions.length === 0) {
            return res.status(200).json({ 
                message: 'Great! You have no assignments currently pending grading.',
                submissions: []
            });
        }

        res.status(200).json({
            totalPending: pendingSubmissions.length,
            submissions: pendingSubmissions
        });

    } catch (error) {
        console.error('Error fetching pending submissions:', error);
        res.status(500).json({ message: 'Server error while fetching pending submissions data.' });
    }
};

/**
 * @desc Grade a specific pending submission (CREATE/UPDATE operation)
 * @route POST /grades/:submissionId
 * @access Private (Teacher, Super Admin)
 */
exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    const teacherId = req.user.id;

    if (grade === undefined || grade === null) {
        return res.status(400).json({ message: 'Grade is required.' });
    }

    try {
        const submission = await Submission.findOne({
            where: { id: submissionId },
            include: [{
                model: Assignment,
                as: 'Assignment',
                include: [{
                    model: Course,
                    as: 'Course',
                    where: { teacherId } // Ensure the submission belongs to the teacher's course
                }]
            }]
        });

        if (!submission || !submission.Assignment || !submission.Assignment.Course) {
            return res.status(404).json({ message: 'Submission not found or you do not have permission to grade it.' });
        }

        const maxPoints = submission.Assignment.maxPoints;
        if (grade < 0 || grade > maxPoints) {
            return res.status(400).json({ message: `Grade must be between 0 and ${maxPoints}.` });
        }

        // 1. Check Edit/Delete Window (For UPDATE operation only)
        if (submission.grade !== null && submission.gradedAt) {
            const gradedMoment = moment(submission.gradedAt);
            const now = moment();
            const hoursSinceGraded = now.diff(gradedMoment, 'hours');

            if (hoursSinceGraded >= 24) {
                // If it's an update and over 24 hours, deny access
                return res.status(403).json({ message: 'Grading window closed. Grades can only be modified within 24 hours of initial grading.' });
            }
        }
        // Note: For initial grading (grade is null), the 24h limit doesn't apply.

        // 2. Perform Grading (CREATE/UPDATE)
        const newSubmission = await submission.update({
            grade: grade,
            feedback: feedback || null,
            gradedAt: moment().toISOString(), // Update gradedAt timestamp
            graderId: teacherId
        });

        res.status(200).json({ 
            message: 'Submission graded successfully.', 
            submission: newSubmission 
        });

    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({ message: 'Server error while grading submission.' });
    }
};


/**
 * @desc Delete (un-grade/reset) a specific submission's grade.
 * @route DELETE /grades/:submissionId
 * @access Private (Teacher, Super Admin)
 */
exports.deleteGrade = async (req, res) => {
    const { submissionId } = req.params;
    const teacherId = req.user.id;

    try {
        const submission = await Submission.findOne({
            where: { id: submissionId },
            include: [{
                model: Assignment,
                as: 'Assignment',
                include: [{
                    model: Course,
                    as: 'Course',
                    where: { teacherId } // Ensure the submission belongs to the teacher's course
                }]
            }]
        });

        if (!submission || !submission.Assignment || !submission.Assignment.Course) {
            return res.status(404).json({ message: 'Submission not found or you do not have permission to modify this grade.' });
        }
        
        // Check if grade exists
        if (submission.grade === null) {
             return res.status(400).json({ message: 'Submission has no grade to delete.' });
        }

        // Check Edit/Delete Window
        const gradedMoment = moment(submission.gradedAt);
        const now = moment();
        const hoursSinceGraded = now.diff(gradedMoment, 'hours');

        if (hoursSinceGraded >= 24) {
            return res.status(403).json({ message: 'Grade can only be deleted (reset) within 24 hours of grading.' });
        }

        // Delete the grade by setting fields back to null/default
        await submission.update({
            grade: null,
            feedback: null,
            gradedAt: null,
            graderId: null
        });

        res.status(200).json({ 
            message: 'Grade deleted successfully. Submission is now pending.',
            submissionId: submissionId 
        });

    } catch (error) {
        console.error('Error deleting grade:', error);
        res.status(500).json({ message: 'Server error while deleting grade.' });
    }
};

/**
 * @desc Fetch all graded and pending submissions for all teacher's courses (Grade Center View)
 * @route GET /grades/center
 * @access Private (Teacher, Super Admin)
 */
exports.getGradeCenterData = async (req, res) => {
    const teacherId = req.user.id;

    try {
        const submissions = await Submission.findAll({
            // Only select columns that exist in the database
            attributes: ['id', 'grade', 'feedback', 'submittedAt', 'gradedAt', 'studentComment'], 
            include: [
                {
                    model: Assignment,
                    as: 'Assignment',
                    attributes: ['id', 'title', 'maxPoints'],
                    include: [{
                        model: Course,
                        as: 'Course',
                        attributes: ['id', 'title'],
                        where: { teacherId }
                    }]
                },
                {
                    model: User,
                    as: 'Student',
                    attributes: ['id', 'name', 'email']
                }
            ],
            order: [['submittedAt', 'DESC']]
        });

        const now = moment();

        // Process submissions to determine edit status
        const processedSubmissions = submissions
            .filter(sub => sub.Assignment && sub.Assignment.Course) // Ensure data integrity
            .map(sub => {
                let canEdit = false;
                if (sub.gradedAt) {
                    const gradedMoment = moment(sub.gradedAt);
                    const hoursSinceGraded = now.diff(gradedMoment, 'hours');
                    canEdit = hoursSinceGraded < 24;
                }
                
                return {
                    id: sub.id,
                    grade: sub.grade,
                    maxPoints: sub.Assignment.maxPoints,
                    feedback: sub.feedback,
                    submittedAt: sub.submittedAt,
                    gradedAt: sub.gradedAt,
                    // Pass the student's comment/note
                    studentComment: sub.studentComment, 
                    canEdit: canEdit,
                    status: sub.grade === null ? 'PENDING' : 'GRADED',
                    student: {
                        id: sub.Student.id,
                        name: sub.Student.name
                    },
                    assignment: {
                        id: sub.Assignment.id,
                        title: sub.Assignment.title
                    },
                    course: {
                        id: sub.Assignment.Course.id,
                        title: sub.Assignment.Course.title
                    }
                };
            });

        res.status(200).json({
            totalSubmissions: processedSubmissions.length,
            gradeCenterData: processedSubmissions
        });

    } catch (error) {
        console.error('Error fetching grade center data:', error);
        res.status(500).json({ message: 'Server error while fetching grade center data.' });
    }
};