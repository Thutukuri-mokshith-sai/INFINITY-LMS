const { User, Course, Enrollment, Assignment, Submission } = require('../models/index');
const { Sequelize } = require('sequelize');

// GET /api/leaderboard/course/:courseId
exports.getCourseLeaderboard = async (req, res) => {
    const { courseId } = req.params;

    try {
        // 1. Get Course Details (Title and Max Points)
        const course = await Course.findByPk(courseId, {
            attributes: ['title'],
            include: [{
                model: Assignment,
                attributes: [
                    [Sequelize.fn('SUM', Sequelize.col('maxPoints')), 'maxTotalPoints']
                ]
            }]
        });

        if (!course) {
            return res.status(404).json({ 
                success: false, 
                message: 'Course not found.' 
            });
        }

        // The max points calculation is nested under Assignments
        const maxTotalPoints = course.Assignments[0] ? 
                               course.Assignments[0].dataValues.maxTotalPoints || 0 : 
                               0;

        if (maxTotalPoints === 0) {
             return res.status(200).json({
                success: true,
                courseTitle: course.title,
                maxCoursePoints: 0,
                leaderboard: [],
                message: 'No assignments found for this course, leaderboard is empty.'
            });
        }


        // 2. Fetch Leaderboard Data
        const leaderboardData = await User.findAll({
            attributes: [
                'id',
                'name',
                // Calculate the SUM of grades received by the student for this course's assignments
                [
                    Sequelize.literal(`
                        (SELECT SUM(S.grade) FROM Submissions AS S
                         INNER JOIN Assignments AS A ON S.assignmentId = A.id
                         WHERE S.studentId = User.id
                           AND A.courseId = ${courseId}
                           AND S.grade IS NOT NULL)
                    `), 
                    'totalScore'
                ],
                // Count the number of graded submissions for this course
                [
                    Sequelize.literal(`
                        (SELECT COUNT(S.id) FROM Submissions AS S
                         INNER JOIN Assignments AS A ON S.assignmentId = A.id
                         WHERE S.studentId = User.id
                           AND A.courseId = ${courseId}
                           AND S.grade IS NOT NULL)
                    `), 
                    'assignmentsSubmitted'
                ]
            ],
            include: [{
                model: Enrollment,
                attributes: [],
                where: { courseId: courseId }
            }],
            where: {
                role: 'Student'
            },
            // Filter out students who have no submissions/score
            having: Sequelize.literal('totalScore IS NOT NULL AND totalScore > 0'), 
            group: ['User.id', 'User.name'],
            order: [
                [Sequelize.literal('totalScore'), 'DESC'], // Primary sort: Highest score first
                ['name', 'ASC'] // Secondary sort: Alphabetical by name
            ],
            raw: true, // Return raw JSON objects
        });

        // 3. Process and Rank the Data
        let rank = 1;
        let lastScore = null;

        const rankedLeaderboard = leaderboardData.map((student, index) => {
            const totalScore = student.totalScore || 0;
            const scorePercentage = maxTotalPoints > 0 
                                     ? ((totalScore / maxTotalPoints) * 100).toFixed(1) 
                                     : 0;
            
            // Handle ties: students with the same score get the same rank
            if (lastScore !== totalScore) {
                rank = index + 1;
            }
            lastScore = totalScore;

            return {
                id: student.id,
                name: student.name,
                totalScore: totalScore,
                scorePercentage: parseFloat(scorePercentage),
                assignmentsSubmitted: student.assignmentsSubmitted || 0,
                rank: rank
            };
        });

        res.status(200).json({
            success: true,
            courseTitle: course.title,
            maxCoursePoints: maxTotalPoints,
            leaderboard: rankedLeaderboard
        });

    } catch (error) {
        console.error('Leaderboard calculation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve course leaderboard.', 
            error: error.message 
        });
    }
};