const { User, Course, Assignment, Enrollment, Submission } = require('../models');
const { Sequelize } = require('sequelize');

// GET /api/leaderboard/course/:courseId
exports.getCourseLeaderboard = async (req, res) => {
    const { courseId } = req.params;

    try {
        // 1️⃣ Fetch course info
        const course = await Course.findByPk(courseId, {
            attributes: ['id', 'title'],
            raw: true,
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.'
            });
        }

        // 2️⃣ Calculate total max points
        const totalMaxPointsResult = await Assignment.findOne({
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('maxPoints')), 0), 'totalMaxPoints']
            ],
            where: { courseId },
            raw: true
        });
        const maxTotalPoints = parseInt(totalMaxPointsResult.totalMaxPoints, 10);

        // 3️⃣ Fetch enrolled students using correct alias
        const students = await User.findAll({
            attributes: ['id', 'name'],
            include: [{
                model: Enrollment,
                as: 'Enrollments', // Must match alias in User model
                attributes: [],
                where: { courseId }
            }],
            where: { role: 'Student' }
        });

        // 4️⃣ Fetch submission scores
        const submissions = await Submission.findAll({
            attributes: [
                'studentId',
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('grade')), 0), 'totalScore'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'assignmentsSubmitted']
            ],
            include: [{
                model: Assignment,
                attributes: [],
                where: { courseId }
            }],
            group: ['studentId'],
            raw: true
        });

        // 5️⃣ Map submission scores
        const submissionMap = {};
        submissions.forEach(s => {
            submissionMap[s.studentId] = {
                totalScore: parseInt(s.totalScore, 10),
                assignmentsSubmitted: parseInt(s.assignmentsSubmitted, 10)
            };
        });

        // 6️⃣ Build leaderboard with rank
        let leaderboard = students.map(student => {
            const data = submissionMap[student.id] || { totalScore: 0, assignmentsSubmitted: 0 };
            const scorePercentage = maxTotalPoints > 0
                ? ((data.totalScore / maxTotalPoints) * 100).toFixed(1)
                : 0;
            return {
                id: student.id,
                name: student.name,
                totalScore: data.totalScore,
                scorePercentage: parseFloat(scorePercentage),
                assignmentsSubmitted: data.assignmentsSubmitted
            };
        });

        // Sort descending by totalScore
        leaderboard.sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

        // Assign rank with ties
        let rank = 1;
        leaderboard.forEach((student, index) => {
            if (index > 0 && student.totalScore < leaderboard[index - 1].totalScore) {
                rank = index + 1;
            }
            student.rank = rank;
        });

        res.status(200).json({
            success: true,
            courseTitle: course.title,
            maxCoursePoints: maxTotalPoints,
            leaderboard
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
