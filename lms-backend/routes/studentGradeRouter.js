const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { Course, Assignment, Submission, Enrollment } = require('../models');

// ✅ Get all grades for the logged-in student
router.get('/my-grades', protect, restrictTo('Student'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1️⃣ Find all courses the student is enrolled in
    const enrollments = await Enrollment.findAll({
      where: { userId: studentId },
      include: [
        {
          model: Course,
          as: 'Course',
          include: [
            {
              model: Assignment,
              as: 'Assignments',
              include: [
                {
                  model: Submission,
                  as: 'Submissions',
                  where: { studentId },
                  required: false // Include even if no submission yet
                }
              ]
            }
          ]
        }
      ]
    });

    // 2️⃣ Format the data
    const result = enrollments.map(enrollment => {
      const course = enrollment.Course;
      const courseTitle = course.title;

      const assignmentGrades = {};
      let total = 0;
      let count = 0;

      course.Assignments.forEach(assignment => {
        const submission = assignment.Submissions[0];
        const grade = submission ? submission.grade : null;
        assignmentGrades[assignment.title] = grade;

        if (grade !== null && grade !== undefined) {
          total += grade;
          count++;
        }
      });

      const overallGrade = count > 0 ? parseFloat((total / count).toFixed(2)) : null;

      return {
        courseTitle,
        grades: assignmentGrades,
        overallGrade
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error fetching student grades:', error);
    res.status(500).json({ message: 'Failed to fetch student grades', error: error.message });
  }
});

module.exports = router;
