// controllers/teacherDashboardController.js
const db = require('../models/index');
const { Op, literal, fn, col } = require('sequelize');

// Load all necessary models
const User = db.User;
const Course = db.Course;
const Assignment = db.Assignment;
const Submission = db.Submission;
const Enrollment = db.Enrollment;
const Forum = db.Forum;
const Thread = db.Thread;
const Post = db.Post;
const Like = db.Like;
const Notification = db.Notification;
const StudentProfile = db.StudentProfile; // Added StudentProfile

// --- Course Management Controllers ---

exports.createCourse = async (req, res) => {
    const teacherId = req.user.id; // Assuming teacher ID is available from auth middleware
    const { title, description, duration, startDate, endDate } = req.body;

    // Basic validation
    if (!title || !duration || !startDate || !endDate) {
        return res.status(400).json({ message: 'Missing required course fields: title, duration, startDate, endDate.' });
    }

    try {
        const newCourse = await Course.create({
            title,
            description,
            duration,
            startDate,
            endDate,
            teacherId
        });

        // Optional: Automatically create a dedicated forum for the new course
        await Forum.create({
            courseId: newCourse.id,
            title: `${title} Discussion Forum`,
            description: `A place to discuss all topics related to ${title}.`,
            createdById: teacherId,
        });

        res.status(201).json({ 
            message: 'Course and associated forum created successfully', 
            course: newCourse 
        });
    } catch (error) {
        console.error('Error creating course:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
             return res.status(409).json({ message: 'A course with this title already exists.' });
        }
        res.status(500).json({ message: 'Server error while creating course.' });
    }
};

// ---------------------------------------------------------------------

// --- Dashboard Data Controller ---

exports.getTeacherDashboardData = async (req, res) => {
    const teacherId = req.user.id; // Teacher ID from auth middleware

    try {
        // 1. Fetch Taught Courses
        const taughtCourses = await Course.findAll({
            where: { teacherId },
            attributes: ['id', 'title', 'duration', 'startDate', 'endDate'],
        });

        const taughtCourseIds = taughtCourses.map(c => c.id);

        // If the teacher has no courses, return early with zeroed data
        if (taughtCourseIds.length === 0) {
            return res.status(200).json({
                dashboard: {
                    totalCourses: 0,
                    pendingGrading: 0,
                    totalStudents: 0,
                    myCourses: [],
                    recentEnrollments: [],
                    recentPosts: [],
                    recentNotifications: [],
                }
            });
        }
        
        // 2. Parallel Queries for Metrics & Recent Activity
        const [
            pendingSubmissionsCount,
            totalStudentsCount,
            recentEnrollments,
            recentPosts,
            recentNotifications
        ] = await Promise.all([
            // A. Pending Submissions (Submissions without a grade)
            Submission.count({
                where: { grade: { [Op.is]: null } },
                include: [{
                    model: Assignment,
                    as: 'Assignment',
                    attributes: [],
                    where: { courseId: { [Op.in]: taughtCourseIds } }
                }]
            }),

            // B. Total Unique Students Enrolled in ALL Taught Courses
            Enrollment.count({
                where: { courseId: { [Op.in]: taughtCourseIds } },
                distinct: true,
                col: 'userId'
            }),

            // C. Recent Enrollments (Limit 4, get Student and Course info)
            Enrollment.findAll({
                where: { courseId: { [Op.in]: taughtCourseIds } },
                order: [['enrollmentDate', 'DESC']],
                limit: 4,
                attributes: ['enrollmentDate'],
                include: [
                    { model: User, as: 'Student', attributes: ['name'] },
                    { model: Course, as: 'Course', attributes: ['title'] }
                ]
            }),

            // D. Recent Forum Posts (Limit 4, join with Likes and Post Creator)
            Post.findAll({
                order: [['createdAt', 'DESC']],
                limit: 4,
                attributes: ['id', 'content', 'createdAt'],
                include: [
                    { 
                        model: User, as: 'Creator', attributes: ['name']
                    },
                    {
                        model: db.Thread, as: 'Thread', 
                        attributes: ['title', 'forumId'],
                        include: [{
                            model: db.Forum, as: 'Forum',
                            attributes: ['courseId'],
                            where: { courseId: { [Op.in]: taughtCourseIds } },
                            include: [{ model: db.Course, as: 'Course', attributes: ['title'] }]
                        }]
                    },
                    {
                        model: Like, as: 'Likes',
                        attributes: [] ,
                        // Using a simple join here; actual count will rely on post-processing logic
                    }
                ]
            }),

            // E. Recent Notifications to the Teacher (Limit 4)
            Notification.findAll({
                where: { userId: teacherId },
                order: [['createdAt', 'DESC']],
                limit: 4,
                attributes: ['id', 'message', 'type', 'isRead', 'createdAt']
            }),
        ]);

        // 3. Post-processing

        // Calculate Student Count Per Course
        const studentsPerCourse = await Enrollment.findAll({
            where: { courseId: { [Op.in]: taughtCourseIds } },
            attributes: [
                'courseId',
                [fn('COUNT', col('userId')), 'studentCount']
            ],
            group: ['courseId']
        });

        const studentCountMap = studentsPerCourse.reduce((acc, curr) => {
            acc[curr.courseId] = curr.get('studentCount');
            return acc;
        }, {});

        const myCourses = taughtCourses.map(course => ({
            id: course.id,
            title: course.title,
            duration: course.duration,
            students: studentCountMap[course.id] || 0
        }));

        // Process Recent Posts (Flatten and get basic info)
        const processedRecentPosts = recentPosts
            .filter(post => post.Thread && post.Thread.Forum) // Filter out posts without full context
            .map(post => ({
                id: post.id,
                contentSnippet: post.content.substring(0, 50) + '...',
                posterName: post.Creator.name, 
                courseTitle: post.Thread.Forum.Course.title,
                threadTitle: post.Thread.title,
                likesCount: post.Likes.length, 
                createdAt: post.createdAt,
            }));

        // Final Response
        res.status(200).json({
            dashboard: {
                totalCourses: taughtCourseIds.length,
                pendingGrading: pendingSubmissionsCount,
                totalStudents: totalStudentsCount,
                myCourses,
                recentEnrollments: recentEnrollments.map(e => ({
                    studentName: e.Student.name,
                    courseTitle: e.Course.title,
                    enrollmentDate: e.enrollmentDate,
                })),
                recentPosts: processedRecentPosts,
                recentNotifications: recentNotifications.map(n => ({
                    id: n.id,
                    message: n.message,
                    type: n.type,
                    createdAt: n.createdAt
                })),
            }
        });

    } catch (error) {
        console.error('Error fetching teacher dashboard data:', error);
        res.status(500).json({ message: 'Server error while fetching dashboard data.' });
    }
};

// ---------------------------------------------------------------------

// --- Student Management Controller (New) ---

/**
 * @desc Get a list of all unique students enrolled in the teacher's courses, 
 * along with the course title(s).
 * @route GET /teacher/students
 * @access Private (Teacher, Super Admin)
 */
exports.getTeacherStudents = async (req, res) => {
    const teacherId = req.user.id; // Teacher ID from auth middleware

    try {
        // 1. Find all courses taught by this teacher
        const taughtCourses = await Course.findAll({
            where: { teacherId },
            attributes: ['id']
        });
        const taughtCourseIds = taughtCourses.map(c => c.id);

        if (taughtCourseIds.length === 0) {
            return res.status(200).json({ 
                message: 'You are not currently teaching any courses.', 
                students: [] 
            });
        }

        // 2. Find enrollments for these courses, including student and course details
        const enrollments = await Enrollment.findAll({
            where: { courseId: { [Op.in]: taughtCourseIds } },
            attributes: ['courseId'],
            // Include Student details
            include: [
                {
                    model: User,
                    as: 'Student', // Assumes 'Student' is the correct alias for User in Enrollment model
                    attributes: ['id', 'name', 'email'],
                    include: [{
                        model: StudentProfile,
                        as: 'StudentProfile', // Assumes 'StudentProfile' is the correct alias in User model
                        attributes: ['phone_number', 'major']
                    }]
                },
                // Include Course details
                {
                    model: Course,
                    as: 'Course', // Assumes 'Course' is the correct alias for Course in Enrollment model
                    attributes: ['title']
                }
            ],
            order: [
                [{ model: User, as: 'Student' }, 'name', 'ASC'],
                [{ model: Course, as: 'Course' }, 'title', 'ASC']
            ]
        });

        // 3. Post-process to group courses by unique student
        const studentMap = new Map();

        enrollments.forEach(e => {
            const student = e.Student;
            const courseTitle = e.Course.title;

            // Use student.id to ensure uniqueness
            if (!studentMap.has(student.id)) {
                studentMap.set(student.id, {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    phone_number: student.StudentProfile ? student.StudentProfile.phone_number : null,
                    major: student.StudentProfile ? student.StudentProfile.major : null,
                    enrolledCourses: []
                });
            }

            studentMap.get(student.id).enrolledCourses.push(courseTitle);
        });

        const uniqueStudentsWithCourses = Array.from(studentMap.values());

        res.status(200).json({
            totalStudents: uniqueStudentsWithCourses.length,
            students: uniqueStudentsWithCourses
        });

    } catch (error) {
        console.error('Error fetching teacher student list:', error);
        res.status(500).json({ message: 'Server error while fetching student data.' });
    }
};

// ---------------------------------------------------------------------