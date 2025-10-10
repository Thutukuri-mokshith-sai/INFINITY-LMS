const db = require('../models');
const Course = db.Course;
const User = db.User;
const Enrollment = db.Enrollment;
const { Op } = require('sequelize');

// User Story 3: As a student, I want to enroll in a course.
exports.enrollInCourse = async (req, res) => {
    // 1. Get the current user (student) ID from the protect middleware (req.user)
    const studentId = req.user.id;
    const { courseId } = req.body;

    // Check if the student role is 'Student' is handled by restrictTo in the router
    if (!courseId) {
        return res.status(400).json({ message: 'Course ID is required for enrollment.' });
    }

    try {
        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 2. Check if the student is already enrolled (Sequelize provides a method for this)
        const [enrollment, created] = await Enrollment.findOrCreate({
            where: {
                userId: studentId,
                courseId: courseId,
            },
            defaults: {
                userId: studentId,
                courseId: courseId,
            }
        });

        if (!created) {
            return res.status(409).json({ 
                message: 'You are already enrolled in this course.',
                enrollmentDate: enrollment.enrollmentDate
            });
        }

        // 3. Success response
        res.status(201).json({ 
            status: 'success', 
            message: 'Successfully enrolled in the course.',
            enrollment
        });

    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to enroll in the course.', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------------------

// User Story 3: As a student, I want to see a list of courses I am enrolled in.
exports.getMyEnrolledCourses = async (req, res) => {
    const studentId = req.user.id;

    try {
        // Find the student user and include their enrolled courses
        const student = await User.findByPk(studentId, {
            // Sequelize many-to-many relationship fetch
            include: [{
                model: Course,
                as: 'EnrolledCourses', // Use the 'as' alias defined in index.js
                // Include the Course Teacher details
                include: [{
                    model: User,
                    as: 'Teacher',
                    attributes: ['id', 'name', 'email'], // Select only necessary teacher info
                }],
                // Optionally include the Enrollment details itself
                through: { attributes: ['enrollmentDate'] }
            }],
            attributes: [] // We only want the enrolled courses, not the user details
        });

        if (!student) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json({
            status: 'success',
            results: student.EnrolledCourses.length,
            data: {
                courses: student.EnrolledCourses,
            }
        });

    } catch (error) {
        console.error('Get enrolled courses error:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to retrieve enrolled courses.', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------------------

// User Story 3: As a teacher, I want to see a list of students enrolled in my course.
exports.getStudentsByCourse = async (req, res) => {
    const teacherId = req.user.id;
    const { courseId } = req.params;

    try {
        const course = await Course.findOne({
            where: {
                id: courseId
            }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // 1. Authorization: Check if the logged-in teacher is the owner of the course
        if (course.teacherId !== teacherId) {
            return res.status(403).json({ 
                message: 'You do not have permission to view students for this course.' 
            });
        }

        // 2. Fetch the course and include the list of enrolled students
        const courseWithStudents = await Course.findByPk(courseId, {
            // Sequelize many-to-many relationship fetch
            include: [{
                model: User,
                as: 'Students', // Use the 'as' alias defined in index.js
                attributes: ['id', 'name', 'email', 'role'],
                // Include the enrollment date
                through: { attributes: ['enrollmentDate'] } 
            }],
            attributes: ['id', 'title'] // Only select necessary course info
        });

        res.status(200).json({
            status: 'success',
            results: courseWithStudents.Students.length,
            data: {
                course: courseWithStudents.title,
                students: courseWithStudents.Students,
            }
        });

    } catch (error) {
        console.error('Get course students error:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to retrieve students for the course.', 
            error: error.message 
        });
    }
};