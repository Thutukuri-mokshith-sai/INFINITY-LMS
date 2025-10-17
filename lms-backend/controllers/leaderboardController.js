const { User, Course, Assignment, Enrollment, Submission } = require('../models');
const { Sequelize } = require('sequelize');

// GET /api/leaderboard/course/:courseId
exports.getCourseLeaderboard = async (req, res) => {
    const { courseId } = req.params;

    try {
        // 1️⃣ Fetch course and total max points
        const course = await Course.findByPk(courseId, {
            attributes: ['id', 'title'],
            include: [{
                model: Assignment,
                as: 'Assignments', // Ensure this alias matches your model association
                attributes: [],
                required: false
            }],
            raw: true,
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.'
            });
        }

        // Sum all assignment maxPoints for this course
        const totalMaxPointsResult = await Assignment.findOne({
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('maxPoints')), 0), 'totalMaxPoints']
            ],
            where: { courseId },
            raw: true
        });
        const maxTotalPoints = parseInt(totalMaxPointsResult.totalMaxPoints, 10);

        // 2️⃣ Fetch students enrolled in this course
        const students = await User.findAll({
            attributes: ['id', 'name'],
            include: [{
                model: Enrollment,
                attributes: [],
                where: { courseId }
            }],
            where: { role: 'Student' },
            raw: true
        });

        // 3️⃣ Fetch submission scores
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

        // Map submission scores by studentId for easy lookup
        const submissionMap = {};
        submissions.forEach(s => {
            submissionMap[s.studentId] = {
                totalScore: parseInt(s.totalScore, 10),
                assignmentsSubmitted: parseInt(s.assignmentsSubmitted, 10)
            };
        });

        // 4️⃣ Build leaderboard array with rank
        let rank = 1;
        let lastScore = null;
        const leaderboard = students
            .map(student => {
                const data = submissionMap[student.id] || { totalScore: 0, assignmentsSubmitted: 0 };
                const scorePercentage = maxTotalPoints > 0 
                    ? ((data.totalScore / maxTotalPoints) * 100).toFixed(1)
                    : 0;

                if (lastScore !== data.totalScore) rank = leaderboard.length + 1;
                lastScore = data.totalScore;

                return {
                    id: student.id,
                    name: student.name,
                    totalScore: data.totalScore,
                    scorePercentage: parseFloat(scorePercentage),
                    assignmentsSubmitted: data.assignmentsSubmitted,
                    rank
                };
            })
            .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

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
