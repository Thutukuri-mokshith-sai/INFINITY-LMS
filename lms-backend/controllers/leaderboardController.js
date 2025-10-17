// controllers/leaderboardController.js

const { Submission, Assignment, User, Enrollment } = require('../models');
const { Op } = require('sequelize');

exports.getCourseLeaderboard = async (req, res) => {
    try {
        const courseId = parseInt(req.params.courseId);

        if (!courseId) {
            return res.status(400).json({ message: 'Invalid course ID' });
        }

        // Step 1: Aggregate total score and count of submitted assignments per student
        const submissionsData = await Submission.findAll({
            attributes: [
                'studentId',
                [Submission.sequelize.fn('COALESCE', Submission.sequelize.fn('SUM', Submission.sequelize.col('grade')), 0), 'totalScore'],
                [Submission.sequelize.fn('COUNT', Submission.sequelize.col('Submission.id')), 'assignmentsSubmitted'],
            ],
            include: [
                {
                    model: Assignment,
                    as: 'Assignment', // must match alias defined in models
                    attributes: [],
                    where: { courseId: courseId }
                }
            ],
            group: ['Submission.studentId'],
            raw: true,
        });

        // Step 2: Fetch student names
        const studentIds = submissionsData.map(s => s.studentId);
        const students = await User.findAll({
            where: { id: { [Op.in]: studentIds } },
            attributes: ['id', 'name'],
            raw: true,
        });

        // Map student names
        const leaderboard = submissionsData.map(s => {
            const student = students.find(st => st.id === s.studentId);
            return {
                studentId: s.studentId,
                name: student ? student.name : 'Unknown',
                totalScore: parseInt(s.totalScore),
                assignmentsSubmitted: parseInt(s.assignmentsSubmitted),
            };
        });

        // Step 3: Sort by totalScore descending
        leaderboard.sort((a, b) => b.totalScore - a.totalScore);

        // Step 4: Assign ranks
        let rank = 1;
        leaderboard.forEach((student, index) => {
            if (index > 0 && student.totalScore < leaderboard[index - 1].totalScore) {
                rank = index + 1;
            }
            student.rank = rank;
            student.scorePercentage = ((student.totalScore / (student.assignmentsSubmitted * 100)) * 100).toFixed(2);
        });

        res.json({ leaderboard });

    } catch (err) {
        console.error('Leaderboard calculation error:', err);
        res.status(500).json({ message: 'Error calculating leaderboard', error: err.message });
    }
};
