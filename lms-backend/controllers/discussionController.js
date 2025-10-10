// controllers/discussionController.js (FIXED)
const db = require('../models/index');
// Destructure the necessary models based on your index.js imports
const { Course, Forum, Thread, Post, Notification, User } = db;

/**
 * GET /api/discussions/course/:courseId/dashboard
 * Fetches discussion-related data for a specific course.
 * Accessible by any authenticated user (Student or Teacher)
 */
exports.getCourseDiscussionDashboard = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id; // From authMiddleware

    try {
        // 1. Fetch Course and associated Forum
        const courseData = await Course.findByPk(courseId, {
            attributes: ['id', 'title'],
            // FIX: Use the correct alias 'DiscussionForum'
            include: [{
                model: Forum,
                as: 'DiscussionForum', // <--- FIXED ALIAS
                attributes: ['id', 'title', 'description']
            }],
        });

        if (!courseData) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        
        // FIX: Access the Forum data using the correct alias
        const forum = courseData.DiscussionForum; // <--- FIXED ACCESSOR
        if (!forum) {
            return res.status(404).json({ message: `Discussion forum not found for course: ${courseData.title}.` });
        }

        // 2. Fetch Recent Threads (top 5) for the forum
        const recentThreads = await Thread.findAll({
            where: { forumId: forum.id },
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'title', 'createdAt'],
            // Assuming Thread.belongsTo(User) is defined with 'as: Creator'
            include: [{
                model: User,
                as: 'Creator', 
                attributes: ['id', 'name']
            }]
        });

        // 3. Fetch Recent Replies/Posts (top 5) for the forum
        const recentReplies = await Post.findAll({
            // Join Post to Thread to filter by forumId
            include: [{
                model: Thread,
                as: 'Thread', // Assuming Post.belongsTo(Thread) is defined with 'as: Thread'
                where: { forumId: forum.id },
                attributes: ['id', 'title']
            }, {
                model: User,
                as: 'Creator', // ✅ FIX: Changed 'Poster' to 'Creator' to match association
                attributes: ['id', 'name']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'content', 'createdAt'],
        });
        
        // 4. Fetch Recent Notifications for the authenticated user
        const recentNotifications = await Notification.findAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']],
            limit: 5,
            attributes: ['id', 'type', 'message', 'isRead', 'entityType', 'entityId', 'createdAt']
        });

        res.status(200).json({
            courseTitle: courseData.title,
            discussionForum: {
                id: forum.id,
                title: forum.title,
                description: forum.description
            },
            recentThreads,
            recentReplies: recentReplies.map(reply => ({
                id: reply.id,
                threadId: reply.Thread.id,
                threadTitle: reply.Thread.title,
                contentSnippet: reply.content.substring(0, 75) + (reply.content.length > 75 ? '...' : ''),
                poster: reply.Creator.name, // ✅ FIX: Changed 'reply.Poster' to 'reply.Creator'
                createdAt: reply.createdAt
            }))
        });

    } catch (error) {
        console.error('Error fetching course discussion data:', error);
        res.status(500).json({ message: 'Server error while fetching discussion data.' });
    }
};

// ---

/**
 * GET /api/discussions/dashboard
 * Fetches a consolidated discussion summary across ALL enrolled courses.
 * Accessible by any authenticated Student.
 */
exports.getOverallDiscussionDashboard = async (req, res) => {
    const userId = req.user.id; // From authMiddleware

    try {
        // 1. Find all courses the user is enrolled in.
        const userWithCourses = await User.findByPk(userId, {
            attributes: ['id'],
            include: [{
                model: Course,
                as: 'EnrolledCourses',
                attributes: ['id', 'title'],
                // FIX: Use the correct alias 'DiscussionForum'
                include: [{
                    model: Forum,
                    as: 'DiscussionForum', // <--- FIXED ALIAS
                    attributes: ['id', 'title', 'description']
                }],
            }],
        });

        if (!userWithCourses) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const enrolledCourses = userWithCourses.EnrolledCourses;
        const forumIds = enrolledCourses
            // FIX: Access the Forum data using the correct alias
            .map(course => course.DiscussionForum ? course.DiscussionForum.id : null) // <--- FIXED ACCESSOR
            .filter(id => id !== null);

        if (forumIds.length === 0) {
            return res.status(200).json({ 
                message: 'No active discussion forums found for your enrolled courses.', 
                recentThreads: [], 
                recentReplies: [],
                recentNotifications: []
            });
        }
        
        // 2. Fetch Recent Threads (top 10 overall) across all relevant forums
        const recentThreads = await Thread.findAll({
            where: { forumId: forumIds },
            order: [['createdAt', 'DESC']],
            limit: 10,
            attributes: ['id', 'title', 'createdAt', 'forumId'],
            include: [{
                model: User,
                as: 'Creator', 
                attributes: ['id', 'name']
            }, {
                // Assuming the association Thread.belongsTo(Forum) uses 'as: Forum'
                model: Forum, 
                as: 'Forum', 
                attributes: ['title'],
                include: [{
                    // Assuming the association Forum.belongsTo(Course) uses 'as: Course'
                    model: Course,
                    as: 'Course',
                    attributes: ['title']
                }]
            }]
        });

        // 3. Fetch Recent Replies/Posts (top 10 overall) across all relevant forums
        const recentReplies = await Post.findAll({
            include: [{
                model: Thread,
                as: 'Thread', 
                where: { forumId: forumIds },
                attributes: ['id', 'title', 'forumId'],
            }, {
                model: User,
                as: 'Creator', // ✅ FIX: Changed 'Poster' to 'Creator' to match association
                attributes: ['id', 'name']
            }],
            order: [['createdAt', 'DESC']],
            limit: 10,
            attributes: ['id', 'content', 'createdAt'],
        });
        
        // 4. Fetch Recent Notifications (top 10) for the authenticated user
        const recentNotifications = await Notification.findAll({
            where: { userId: userId },
            order: [['createdAt', 'DESC']],
            limit: 10,
            attributes: ['id', 'type', 'message', 'isRead', 'entityType', 'entityId', 'createdAt']
        });

        res.status(200).json({
            enrolledCoursesCount: enrolledCourses.length,
            recentThreads: recentThreads.map(thread => ({
                id: thread.id,
                title: thread.title,
                createdAt: thread.createdAt,
                creator: thread.Creator.name,
                // Accessing the course title through the nested includes
                courseTitle: thread.Forum.Course.title, 
                forumId: thread.forumId
            })),
            recentReplies: recentReplies.map(reply => ({
                id: reply.id,
                threadId: reply.Thread.id,
                threadTitle: reply.Thread.title,
                contentSnippet: reply.content.substring(0, 75) + (reply.content.length > 75 ? '...' : ''),
                poster: reply.Creator.name, // ✅ FIX: Changed 'reply.Poster' to 'reply.Creator'
                createdAt: reply.createdAt
            })),
            recentNotifications: recentNotifications.filter(n => n.type === 'new_reply' || n.type === 'thread_like' || n.type === 'new_thread')
        });

    } catch (error) {
        console.error('Error fetching overall discussion dashboard data:', error);
        res.status(500).json({ message: 'Server error while fetching overall discussion data.' });
    }
};