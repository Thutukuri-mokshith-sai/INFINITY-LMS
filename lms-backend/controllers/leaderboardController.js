// controllers/leaderboardController.js

const { Course, Assignment, Submission, User } = require('../models'); // Assuming index.js exports these
const { sequelize } = require('../models'); // Import sequelize instance for raw queries/utilities
const { Op, literal, col } = require('sequelize');


/**
 * @desc    Get the overall assignment performance leaderboard for a course
 * @route   GET /api/leaderboard/course/:courseId
 * @access  Private (Authenticated users)
 */
exports.getCourseLeaderboard = async (req, res) => {
    const { courseId } = req.params;

    try {
        // 1. Check if the course exists and the user is authorized/enrolled (optional but good practice)
        // For simplicity, we'll only check if the course exists.
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 2. Calculate the maximum possible points for the course
        const maxTotalPointsResult = await Assignment.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('maxPoints')), 'maxTotalPoints']
            ],
            where: { courseId },
            raw: true,
        });
        const maxTotalPoints = parseFloat(maxTotalPointsResult.maxTotalPoints) || 0;

        // 3. Aggregate student scores using a JOIN query
        const studentScores = await User.findAll({
            attributes: [
                'id',
                'name',
                'email',
                [literal('SUM(CASE WHEN Submissions.grade IS NOT NULL THEN Submissions.grade ELSE 0 END)'), 'totalScore'],
                [literal('COUNT(DISTINCT Submissions.assignmentId)'), 'assignmentsSubmitted'],
            ],
            // Ensure we only include students who are enrolled in the course
            include: [
                {
                    model: Course,
                    as: 'EnrolledCourses',
                    through: { attributes: [] }, // Exclude Enrollment join table attributes
                    where: { id: courseId },
                    required: true, // Only include Users enrolled in this course
                },
                {
                    model: Submission,
                    as: 'StudentSubmissions',
                    attributes: [], // Don't select submission attributes
                    required: false, // Use LEFT JOIN to include students with 0 submissions
                    include: {
                        model: Assignment,
                        as: 'Assignment',
                        attributes: [],
                        where: { courseId: courseId }, // Filter submissions only for this course's assignments
                        required: true,
                    }
                }
            ],
            group: ['User.id', 'User.name', 'User.email'], // Group by user details
            order: [
                [literal('totalScore'), 'DESC'], // Sort by total score descending
                ['name', 'ASC'] // Secondary sort by name
            ],
            raw: true,
            subQuery: false, // Important for using ORDER and LIMIT with includes
        });

        // 4. Process and enhance the results
        const leaderboard = studentScores.map(student => {
            const totalScore = parseFloat(student.totalScore) || 0;
            const scorePercentage = maxTotalPoints > 0 ? (totalScore / maxTotalPoints) * 100 : 0;
            
            return {
                id: student.id,
                name: student.name,
                email: student.email,
                totalScore: totalScore.toFixed(2),
                maxPossibleScore: maxTotalPoints,
                scorePercentage: scorePercentage.toFixed(2) + '%',
                assignmentsSubmitted: parseInt(student.assignmentsSubmitted, 10),
            };
        });

        // 5. Send the response
        res.status(200).json({
            status: 'success',
            courseId: parseInt(courseId, 10),
            courseTitle: course.title,
            maxCoursePoints: maxTotalPoints,
            results: leaderboard.length,
            leaderboard,
        });

    } catch (error) {
        console.error('Error fetching course leaderboard:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to retrieve course leaderboard.', 
            error: error.message 
        });
    }
};