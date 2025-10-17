// controllers/gradeCenterController.js
const db = require('../models/index');
const { Op } = require('sequelize');
const moment = require('moment');

const Submission = db.Submission;
const Assignment = db.Assignment;
const Course = db.Course;
const User = db.User;

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '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');

const SENDER_EMAIL = '22781A33D2@svcet.edu.in';
const SENDER_NAME = 'INFINITY SQUAD LMS';

// ----------------------------------------------------
// 1. Get Pending Submissions
// ----------------------------------------------------
exports.getPendingSubmissions = async (req, res) => {
    const teacherId = req.user.id;

    try {
        const pendingSubmissions = await Submission.findAll({
            where: { grade: { [Op.is]: null } },
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

        if (!pendingSubmissions.length) {
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

// ----------------------------------------------------
// 2. Grade Submission with Email Notification
// ----------------------------------------------------
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
            include: [
                {
                    model: Assignment,
                    as: 'Assignment',
                    include: [
                        {
                            model: Course,
                            as: 'Course',
                            where: { teacherId }
                        }
                    ]
                },
                {
                    model: User,
                    as: 'Student'
                }
            ]
        });

        if (!submission || !submission.Assignment || !submission.Assignment.Course || !submission.Student) {
            return res.status(404).json({ message: 'Submission not found or you do not have permission to grade it.' });
        }

        const maxPoints = submission.Assignment.maxPoints;
        if (grade < 0 || grade > maxPoints) {
            return res.status(400).json({ message: `Grade must be between 0 and ${maxPoints}.` });
        }

        // Check Edit/Delete Window
        if (submission.grade !== null && submission.gradedAt) {
            const gradedMoment = moment(submission.gradedAt);
            const hoursSinceGraded = moment().diff(gradedMoment, 'hours');
            if (hoursSinceGraded >= 24) {
                return res.status(403).json({ message: 'Grading window closed. Grades can only be modified within 24 hours of initial grading.' });
            }
        }

        // Update Submission with grade
        const updatedSubmission = await submission.update({
            grade,
            feedback: feedback || null,
            gradedAt: moment().toISOString(),
            graderId: teacherId
        });

        // Send Email Notification to Student
        const student = submission.Student;
        const assignment = submission.Assignment;
        const course = assignment.Course;

        const emailSubject = `Graded: ${assignment.title} in ${course.title}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #4CAF50;">Assignment Graded</h2>
                <p>Hi ${student.name},</p>
                <p>Your submission for the assignment <strong>${assignment.title}</strong> in the course <strong>${course.title}</strong> has been graded by ${req.user.name}.</p>
                
                <table style="border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Grade:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${grade} / ${maxPoints}</td>
                    </tr>
                    ${feedback ? `
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Feedback:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${feedback}</td>
                    </tr>` : ''}
                    <tr>
                        <td style="padding: 8px; font-weight: bold; border: 1px solid #ddd;">Graded At:</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${moment(updatedSubmission.gradedAt).format('LLL')}</td>
                    </tr>
                </table>

                <p>Please <a href="${process.env.LMS_URL || '#'}" style="color: #4CAF50; text-decoration: none;">login to the LMS</a> to view your graded submission.</p>
                <p>Thank you,<br>${SENDER_NAME}</p>
            </div>
        `;

        try {
            await sgMail.send({
                to: student.email,
                from: { email: SENDER_EMAIL, name: SENDER_NAME },
                subject: emailSubject,
                html: emailHtml
            });
            console.log(`✅ Graded submission email sent to ${student.email}`);
        } catch (err) {
            console.error(`❌ Failed to send graded submission email to ${student.email}:`, err.response?.body || err.message);
        }

        res.status(200).json({
            message: 'Submission graded successfully and student notified.',
            submission: updatedSubmission
        });

    } catch (error) {
        console.error('Error grading submission:', error);
        res.status(500).json({ message: 'Server error while grading submission.' });
    }
};

// ----------------------------------------------------
// 3. Delete/Reset Grade
// ----------------------------------------------------
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
                    where: { teacherId }
                }]
            }]
        });

        if (!submission || !submission.Assignment || !submission.Assignment.Course) {
            return res.status(404).json({ message: 'Submission not found or you do not have permission to modify this grade.' });
        }

        if (submission.grade === null) {
            return res.status(400).json({ message: 'Submission has no grade to delete.' });
        }

        const gradedMoment = moment(submission.gradedAt);
        const hoursSinceGraded = moment().diff(gradedMoment, 'hours');
        if (hoursSinceGraded >= 24) {
            return res.status(403).json({ message: 'Grade can only be deleted (reset) within 24 hours of grading.' });
        }

        await submission.update({
            grade: null,
            feedback: null,
            gradedAt: null,
            graderId: null
        });

        res.status(200).json({
            message: 'Grade deleted successfully. Submission is now pending.',
            submissionId
        });

    } catch (error) {
        console.error('Error deleting grade:', error);
        res.status(500).json({ message: 'Server error while deleting grade.' });
    }
};

// ----------------------------------------------------
// 4. Get Grade Center Data (All submissions)
// ----------------------------------------------------
exports.getGradeCenterData = async (req, res) => {
    const teacherId = req.user.id;

    try {
        const submissions = await Submission.findAll({
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

        const processedSubmissions = submissions
            .filter(sub => sub.Assignment && sub.Assignment.Course)
            .map(sub => {
                let canEdit = false;
                if (sub.gradedAt) {
                    const hoursSinceGraded = now.diff(moment(sub.gradedAt), 'hours');
                    canEdit = hoursSinceGraded < 24;
                }

                return {
                    id: sub.id,
                    grade: sub.grade,
                    maxPoints: sub.Assignment.maxPoints,
                    feedback: sub.feedback,
                    submittedAt: sub.submittedAt,
                    gradedAt: sub.gradedAt,
                    studentComment: sub.studentComment,
                    canEdit,
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
