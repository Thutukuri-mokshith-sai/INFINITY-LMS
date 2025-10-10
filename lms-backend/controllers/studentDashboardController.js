// controllers/studentDashboardController.js
const db = require('../models/index');
const { Op } = require('sequelize');

const User = db.User;
const Course = db.Course;
const Enrollment = db.Enrollment;
const Assignment = db.Assignment;
const Submission = db.Submission;
const Material = db.Material;
const Forum = db.Forum;
const Thread = db.Thread;
const Notification = db.Notification;

// Helper function to calculate a simple course progress (e.g., based on assignments)
const calculateCourseProgress = (course, allAssignments, studentSubmissions) => {
    const courseAssignments = allAssignments.filter(a => a.courseId === course.id);
    const totalAssignments = courseAssignments.length;

    if (totalAssignments === 0) return 100;

    const submittedCount = courseAssignments.filter(assignment =>
        studentSubmissions.some(sub => sub.assignmentId === assignment.id)
    ).length;
    
    // Simple percentage completion based on submitted assignments
    return Math.min(100, Math.round((submittedCount / totalAssignments) * 100));
};

// Main controller to fetch all student dashboard data
exports.getStudentDashboardData = async (req, res) => {
    const userId = req.user.id; // Student ID from authMiddleware

    try {
        // --- 1. Fetch Enrolled Courses & Course IDs ---
        const enrollments = await Enrollment.findAll({
            where: { userId },
            attributes: ['courseId'],
            include: [{
                model: Course,
                as: 'Course',
                attributes: ['id', 'title', 'description', 'duration']
            }]
        });

        const enrolledCourseIds = enrollments.map(e => e.Course.id);
        
        // --- Execute all parallel queries ---
        const [
            allCourses,
            allAssignments,
            studentSubmissions,
            recentMaterials,
            recentThreads,
            recentNotifications,
            recentGrades
        ] = await Promise.all([
            // 2. Fetch All Courses (for Available Courses)
            Course.findAll({
                attributes: ['id', 'title', 'description', 'duration'],
                include: [{
                    model: User,
                    as: 'Teacher',
                    attributes: ['name']
                }]
            }),

            // 3. Fetch All Assignments for Enrolled Courses
            Assignment.findAll({
                where: { courseId: { [Op.in]: enrolledCourseIds } },
                attributes: ['id', 'title', 'dueDate', 'courseId'],
            }),

            // 4. Fetch All Student Submissions
            Submission.findAll({
                where: { studentId: userId },
                attributes: ['assignmentId'] // Only need ID to check for submission existence
            }),

            // 5. Fetch Recent Materials (Limit 3)
            Material.findAll({
                where: { courseId: { [Op.in]: enrolledCourseIds } },
                order: [['createdAt', 'DESC']],
                limit: 3,
                attributes: ['id', 'title', 'fileType', 'createdAt'],
                include: [{
                    model: Course,
                    as: 'Course',
                    attributes: ['title']
                }]
            }),

            // 6. Fetch Recent Threads (Limit 3)
            Forum.findAll({
                where: { courseId: { [Op.in]: enrolledCourseIds } },
                attributes: ['id'],
                include: [{
                    model: Thread,
                    as: 'Threads',
                    limit: 3,
                    order: [['createdAt', 'DESC']],
                    attributes: ['id', 'title', 'createdAt'],
                    include: [{
                        model: User,
                        as: 'Creator', // <-- FIX 1: CORRECTED ALIAS
                        attributes: ['name']
                    }]
                }, {
                    model: Course,
                    as: 'Course',
                    attributes: ['title']
                }]
            }),

            // 7. Fetch Recent Notifications (Limit 3)
            Notification.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                limit: 3,
                attributes: ['id', 'message', 'type', 'isRead', 'createdAt']
            }),

            // 8. Fetch Recent Grades (Limit 3)
            Submission.findAll({
                where: { 
                    studentId: userId,
                    grade: { [Op.not]: null } 
                },
                include: [{
                    model: Assignment,
                    as: 'Assignment',
                    attributes: ['title', 'maxPoints'],
                    include: [{
                        model: Course,
                        as: 'Course',
                        attributes: ['title']
                    }]
                }],
                order: [['gradedAt', 'DESC'], ['updatedAt', 'DESC']],
                limit: 3,
                attributes: ['id', 'grade', 'feedback', 'gradedAt']
            })
        ]);

        // --- Post-processing and Aggregation ---

        // 1. Enrolled Courses with Progress
        const enrolledCourses = enrollments.map(enrollment => {
            const courseData = enrollment.Course.toJSON();
            courseData.progress = calculateCourseProgress(
                courseData, 
                allAssignments, 
                studentSubmissions
            );
            return courseData;
        });

        // 2. Available Courses (Not Enrolled)
        const availableCourses = allCourses
            .filter(course => !enrolledCourseIds.includes(course.id))
            .map(course => course.toJSON());


        // 3. Pending Assignments (Action Items)
        const submittedAssignmentIds = studentSubmissions.map(s => s.assignmentId);
        const pendingAssignments = allAssignments
            .filter(assignment => !submittedAssignmentIds.includes(assignment.id))
            .map(assignment => {
                const course = enrolledCourses.find(c => c.id === assignment.courseId);
                return {
                    assignmentId: assignment.id,
                    title: assignment.title,
                    courseTitle: course ? course.title : 'Unknown Course',
                    dueDate: assignment.dueDate,
                };
            })
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)); // Sort by due date

        // 6. Consolidate recent threads, extracting from nested Forum structure
        const consolidatedRecentThreads = recentThreads.flatMap(forum => 
            forum.Threads.map(thread => ({
                id: thread.id,
                title: thread.title,
                courseTitle: forum.Course.title,
                createdBy: thread.Creator ? thread.Creator.name : 'Unknown User', // <-- FIX 2: CORRECTED PROPERTY ACCESS
                createdAt: thread.createdAt
            }))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3); 

        // --- Final Response ---
        res.status(200).json({
            dashboard: {
                enrolledCourses,
                availableCourses,
                pendingAssignments,
                recentMaterials: recentMaterials.map(m => ({
                    id: m.id,
                    title: m.title,
                    courseTitle: m.Course.title,
                    fileType: m.fileType,
                    createdAt: m.createdAt
                })),
                recentThreads: consolidatedRecentThreads,
                recentGrades: recentGrades.map(g => ({
                    assignmentTitle: g.Assignment.title,
                    courseTitle: g.Assignment.Course.title,
                    grade: g.grade,
                    maxPoints: g.Assignment.maxPoints,
                    gradedAt: g.gradedAt
                })),
                recentNotifications: recentNotifications,
            }
        });

    } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        // Ensure the error response is always returned in case of failure
        res.status(500).json({ message: 'Server error while fetching dashboard data.' });
    }
};