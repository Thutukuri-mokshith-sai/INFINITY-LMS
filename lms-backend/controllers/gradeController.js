// controllers/gradeController.js

const db = require('../models');
const { Op } = require('sequelize');

// Explicitly define models
const Submission = db.Submission;
const Assignment = db.Assignment;
const User = db.User;
const Enrollment = db.Enrollment;
const Course = db.Course; 
const SubmissionResource = db.SubmissionResource; 

// Helper function to calculate the overall course grade (unchanged)
const calculateOverallCourseGrade = async (studentId, courseId) => {
    const assignments = await Assignment.findAll({
        where: { courseId: courseId },
        attributes: ['id', 'maxPoints']
    });

    if (assignments.length === 0) {
        return { totalScore: 0, maxTotal: 0, percentage: 0, message: 'No assignments defined for this course.' };
    }

    const assignmentIds = assignments.map(a => a.id);
    const maxTotal = assignments.reduce((sum, a) => sum + a.maxPoints, 0);

    const submissions = await Submission.findAll({
        where: {
            studentId: studentId,
            assignmentId: { [Op.in]: assignmentIds },
            grade: { [Op.not]: null } 
        },
        attributes: ['grade']
    });

    const totalScore = submissions.reduce((sum, s) => sum + s.grade, 0);
    
    let percentage = 0;
    if (maxTotal > 0) {
        percentage = (totalScore / maxTotal) * 100;
    }

    return {
        totalScore: totalScore,
        maxTotal: maxTotal,
        percentage: parseFloat(percentage.toFixed(2))
    };
};

// ----------------------------------------------------------------------------------
// API 1 (C/U): Grade or regrade a specific student submission
// ----------------------------------------------------------------------------------
exports.gradeSubmission = async (req, res) => {
    const teacherId = req.user.id;
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;

    if (grade === undefined || grade === null) {
        return res.status(400).json({ message: 'Grade is required.' });
    }

    try {
        const submission = await Submission.findByPk(submissionId, {
            include: [{
                model: Assignment, 
                as: 'Assignment', 
                attributes: ['teacherId', 'maxPoints'] 
            }]
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }
        
        if (submission.Assignment.teacherId !== teacherId) {
            return res.status(403).json({
                message: 'You are not authorized to grade this assignment.'
            });
        }
        
        const maxPoints = submission.Assignment.maxPoints;
        const numericGrade = parseInt(grade);
        
        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > maxPoints) {
            return res.status(400).json({
                message: `Grade must be a number between 0 and ${maxPoints}.`
            });
        }

        submission.grade = numericGrade;
        submission.feedback = feedback || null;
        submission.gradedBy = teacherId;
        submission.gradedAt = new Date();

        await submission.save();

        res.status(200).json({
            status: 'success',
            message: 'Submission graded successfully.',
            data: submission
        });

    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to grade submission.',
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------
// API 4 (R): View all submissions/grades for a specific assignment
// ----------------------------------------------------------------------------------
exports.getAllAssignmentGrades = async (req, res) => {
    const teacherId = req.user.id;
    const { assignmentId } = req.params;

    try {
        const assignment = await Assignment.findByPk(assignmentId, {
            attributes: ['id', 'title', 'maxPoints', 'teacherId']
        });

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found.' });
        }

        if (assignment.teacherId !== teacherId) {
            return res.status(403).json({ message: 'You are not authorized to view grades for this assignment.' });
        }

        const submissions = await Submission.findAll({
            where: { assignmentId: assignmentId },
            attributes: ['id', 'grade', 'feedback', 'gradedAt', 'createdAt', 'studentComment', 'isLate'],
            include: [{
                model: User, 
                as: 'Student', 
                attributes: ['id', 'name', 'email']
            }, {
                model: User, 
                as: 'Grader', // <-- NOW CORRECTLY MATCHES THE NEW ASSOCIATION
                attributes: ['name']
            }, {
                model: SubmissionResource,
                as: 'SubmittedResources', 
                attributes: ['id', 'title', 'resourceLink']
            }],
            order: [[{ model: User, as: 'Student' }, 'name', 'ASC']]
        });

        res.status(200).json({
            status: 'success',
            assignmentTitle: assignment.title,
            maxPoints: assignment.maxPoints,
            data: submissions
        });

    } catch (error) {
        console.error('Get all assignment grades error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve assignment grades.',
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------
// API 2 (R): Student's grade for a specific assignment
// ----------------------------------------------------------------------------------
exports.getAssignmentGrade = async (req, res) => {
    const studentId = req.user.id;
    const { assignmentId } = req.params;

    try {
        const submission = await Submission.findOne({
            where: {
                studentId: studentId,
                assignmentId: assignmentId,
                grade: { [Op.not]: null }
            },
            attributes: ['grade', 'feedback', 'gradedAt'],
            include: [{
                model: Assignment,
                as: 'Assignment', 
                attributes: ['title', 'maxPoints']
            }, {
                model: User, 
                as: 'Grader', // <-- NOW CORRECTLY MATCHES THE NEW ASSOCIATION
                attributes: ['name', 'email']
            }]
        });

        if (!submission) {
            const existingSubmission = await Submission.findOne({
                where: { studentId: studentId, assignmentId: assignmentId },
                include: [{ model: Assignment, as: 'Assignment', attributes: ['title'] }] 
            });

            if (existingSubmission) {
                return res.status(200).json({
                    status: 'info',
                    message: 'Your submission has been received but is not graded yet.',
                    data: {
                        assignmentTitle: existingSubmission.Assignment ? existingSubmission.Assignment.title : 'N/A',
                        grade: null,
                        feedback: null
                    }
                });
            }

            return res.status(404).json({ message: 'No graded submission found for this assignment.' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                assignmentTitle: submission.Assignment.title,
                maxPoints: submission.Assignment.maxPoints,
                grade: submission.grade,
                feedback: submission.feedback,
                gradedBy: submission.Grader ? submission.Grader.name : 'N/A',
                gradedAt: submission.gradedAt
            }
        });

    } catch (error) {
        console.error('Get assignment grade error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve assignment grade.',
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------
// API 3 (R): Overall course grade calculation
// ----------------------------------------------------------------------------------
exports.getOverallCourseGrade = async (req, res) => {
    const studentId = req.user.id;
    const { courseId } = req.params;

    try {
        const enrollment = await Enrollment.findOne({
            where: { userId: studentId, courseId: courseId }
        });

        if (!enrollment) {
            return res.status(403).json({ message: 'You are not enrolled in this course.' });
        }
        
        const result = await calculateOverallCourseGrade(studentId, courseId);
        const course = await Course.findByPk(courseId, { attributes: ['title'] });

        res.status(200).json({
            status: 'success',
            data: {
                courseTitle: course ? course.title : `Course ID ${courseId}`,
                ...result,
                overallGrade: result.percentage >= 0
                    ? `${result.totalScore} / ${result.maxTotal} (${result.percentage}%)`
                    : 'N/A'
            }
        });

    } catch (error) {
        console.error('Get overall course grade error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to calculate overall course grade.',
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------
// API 5 (D): Remove a grade (unmark)
// ----------------------------------------------------------------------------------
exports.unmarkSubmissionGrade = async (req, res) => {
    const teacherId = req.user.id;
    const { submissionId } = req.params;

    try {
        const submission = await Submission.findByPk(submissionId, {
            include: [{
                model: Assignment,
                as: 'Assignment',
                attributes: ['teacherId']
            }]
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        if (submission.Assignment.teacherId !== teacherId) {
            return res.status(403).json({
                message: 'You are not authorized to unmark this submission.'
            });
        }
        
        submission.grade = null;
        submission.feedback = null;
        submission.gradedBy = null;
        submission.gradedAt = null;

        await submission.save();

        res.status(200).json({
            status: 'success',
            message: 'Submission grade removed (unmarked) successfully.',
            data: submission
        });

    } catch (error) {
        console.error('Unmark submission grade error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to unmark submission grade.',
            error: error.message
        });
    }
};

// ----------------------------------------------------------------------------------
// API 6 (R): Get details and grade for a specific submission by its ID.
// ----------------------------------------------------------------------------------
exports.getSubmissionGradeDetails = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role; 
    const { submissionId } = req.params;

    try {
        const submission = await Submission.findByPk(submissionId, {
            include: [
                { 
                    model: Assignment, 
                    as: 'Assignment', 
                    attributes: ['id', 'title', 'maxPoints', 'teacherId'] 
                },
                { 
                    model: SubmissionResource, 
                    as: 'SubmittedResources', 
                    attributes: ['id', 'title', 'resourceLink', 'fileType'] 
                },
                { 
                    model: User, 
                    as: 'Student', 
                    attributes: ['id', 'name'] 
                },
                { 
                    model: User, 
                    as: 'Grader', // <-- THIS IS THE FIXED ALIAS
                    attributes: ['name'] 
                }
            ]
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        const assignmentTeacherId = submission.Assignment.teacherId; 
        const submissionStudentId = submission.studentId;

        if (userRole === 'Student' && submissionStudentId !== userId) {
             return res.status(403).json({ message: 'You are not authorized to view this submission.' });
        }

        if (userRole === 'Teacher' && assignmentTeacherId !== userId) {
             return res.status(403).json({ message: 'You are not authorized to view this submission as it is not from your course.' });
        }

        const gradeData = {
            submissionId: submission.id,
            assignmentTitle: submission.Assignment.title,
            studentName: submission.Student.name,
            maxPoints: submission.Assignment.maxPoints,
            
            grade: submission.grade !== null ? submission.grade : 'N/A (Ungraded)',
            feedback: submission.feedback,
            studentComment: submission.studentComment, 
            submittedAt: submission.submittedAt, 
            SubmittedResources: submission.SubmittedResources, 
            
            gradedBy: submission.Grader ? submission.Grader.name : null,
            gradedAt: submission.gradedAt
        };

        res.status(200).json({
            status: 'success',
            message: submission.grade === null ? 'Submission found, but not yet graded.' : 'Submission grade retrieved successfully.',
            data: gradeData
        });

    } catch (error) {
        console.error('Get submission grade details error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve submission grade details.',
            error: error.message
        });
    }
};