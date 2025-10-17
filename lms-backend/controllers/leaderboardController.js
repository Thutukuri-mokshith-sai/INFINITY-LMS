const { User, Course, Assignment, Enrollment, Submission } = require('../models');
const { Sequelize } = require('sequelize');

// GET /api/leaderboard/course/:courseId
exports.getCourseLeaderboard = async (req, res) => {
    const { courseId } = req.params;

    try {
        // 1️⃣ Fetch course and ensure it exists
        const course = await Course.findByPk(courseId, {
            attributes: ['id', 'title'],
            raw: true
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.'
            });
        }

        // 2️⃣ Calculate total max points of all assignments in this course
        const totalMaxPointsResult = await Assignment.findOne({
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('maxPoints')), 0), 'totalMaxPoints']
            ],
            where: { courseId },
            raw: true
        });
        const maxTotalPoints = parseInt(totalMaxPointsResult.totalMaxPoints, 10);

        // 3️⃣ Fetch all students enrolled in this course
        const students = await User.findAll({
            attributes: ['id', 'name'],
            include: [{
                model: Enrollment,
                as: 'Enrollments', // Must match alias in models
                attributes: [],
                where: { courseId }
            }],
            where: { role: 'Student' },
            raw: true
        });

        // 4️⃣ Fetch submission scores grouped by student
        const submissions = await Submission.findAll({
            attributes: [
                'studentId',
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('grade')), 0), 'totalScore'],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'assignmentsSubmitted']
            ],
            include: [{
                model: Assignment,
                as: 'Assignment', // Must match alias in models
                attributes: [],
                where: { courseId }
            }],
            group: ['studentId'],
            raw: true
        });

        // 5️⃣ Map submissions for easy lookup
        const submissionMap = {};
        submissions.forEach(s => {
            submissionMap[s.studentId] = {
                totalScore: parseInt(s.totalScore, 10),
                assignmentsSubmitted: parseInt(s.assignmentsSubmitted, 10)
            };
        });

        // 6️⃣ Build leaderboard with rank
        const leaderboard = students.map(student => {
            const data = submissionMap[student.id] || { totalScore: 0, assignmentsSubmitted: 0 };
            const scorePercentage = maxTotalPoints > 0 
                ? ((data.totalScore / maxTotalPoints) * 100).toFixed(1)
                : 0;

            return {
                id: student.id,
                name: student.name,
                totalScore: data.totalScore,
                assignmentsSubmitted: data.assignmentsSubmitted,
                scorePercentage: parseFloat(scorePercentage)
            };
        })
        .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name))
        .map((student, index, arr) => {
            // Calculate rank with ties
            if (index === 0) {
                student.rank = 1;
            } else {
                student.rank = student.totalScore === arr[index - 1].totalScore 
                    ? arr[index - 1].rank 
                    : index + 1;
            }
            return student;
        });

        // 7️⃣ Send response
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
