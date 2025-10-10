// controllers/forumController.js

const db = require('../models/index');
const { 
    Forum, Thread, Post, User, Course, 
    Notification, Like, Resource, ForumParticipant 
} = db;
const { Op } = require('sequelize');


// ====================================================
// PRIVATE HELPERS (Updated: Removed saveResources)
// ====================================================

// Utility function to check enrollment/access (Assumed to exist)
const isEnrolled = async (userId, courseId) => {
    const enrollment = await db.Enrollment.findOne({ where: { userId, courseId } });
    return !!enrollment;
};

// Helper to create a notification
const createNotification = async (recipientId, type, message, entityId, entityType) => {
    // Note: We skip self-notification check here, but it's handled in the caller functions (e.g., toggleLike)
    await Notification.create({ 
        userId: recipientId, 
        type, 
        message, 
        entityId, 
        entityType 
    });
};

// ====================================================
// 👩‍🏫 TEACHER/ADMIN Controllers (CRUD & Moderation)
// ====================================================

// POST /api/forums
exports.createForum = async (req, res) => {
    const { courseId, title, description } = req.body;
    const createdById = req.user.id;

    // NOTE: This check should ideally allow Admins/Super Admins access too, 
    // but preserving original logic restricting to course teacher.
    const course = await Course.findOne({ where: { id: courseId, teacherId: createdById } });
    if (!course) {
        return res.status(403).json({ message: 'Access denied: Course not found or user is not the teacher' });
    }

    try {
        const forum = await Forum.create({ courseId, title, description, createdById });
        res.status(201).json({ message: 'Forum created successfully', forum });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Forum already exists for this course' });
        }
        res.status(500).json({ message: 'Error creating forum', error: error.message });
    }
};

// PUT /api/forums/:forumId
exports.updateForum = async (req, res) => {
    const { forumId } = req.params;
    const { title, description } = req.body;
    const teacherId = req.user.id;

    try {
        const [updated] = await Forum.update(
            { title, description },
            { where: { id: forumId, createdById: teacherId } } // Restrict to creator
        );
        if (updated === 0) {
            return res.status(404).json({ message: 'Forum not found or unauthorized' });
        }
        res.status(200).json({ message: 'Forum updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating forum', error: error.message });
    }
};

// DELETE /api/forums/:forumId
exports.deleteForum = async (req, res) => {
    const { forumId } = req.params;
    const teacherId = req.user.id;

    try {
        const deleted = await Forum.destroy({ where: { id: forumId, createdById: teacherId } });
        if (deleted === 0) {
            return res.status(404).json({ message: 'Forum not found or unauthorized' });
        }
        res.status(200).json({ message: 'Forum deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting forum', error: error.message });
    }
};

// DELETE /api/threads/:threadId (Moderation)
exports.deleteAnyThread = async (req, res) => {
    const { threadId } = req.params;
    try {
        const deleted = await Thread.destroy({ where: { id: threadId } });
        if (deleted === 0) {
            return res.status(404).json({ message: 'Thread not found' });
        }
        res.status(200).json({ message: 'Thread deleted successfully (Moderation)' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting thread', error: error.message });
    }
};

// DELETE /api/posts/:postId (Moderation)
exports.deleteAnyPost = async (req, res) => {
    const { postId } = req.params;
    try {
        const deleted = await Post.destroy({ where: { id: postId } });
        if (deleted === 0) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.status(200).json({ message: 'Post deleted successfully (Moderation)' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
};

// ====================================================
// 🧑‍🎓 STUDENT & 👩‍🏫 TEACHER Shared Controllers (Viewing)
// ====================================================
// GET /api/forums/:courseId
exports.getForumByCourseId = async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    try {
        // 🔹 Fetch the course first
        const course = await Course.findByPk(courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // 🔹 Role-based access handling
        if (role === 'Teacher') {
            // Allow teacher if they own the course
            if (course.teacherId !== userId) {
                return res.status(403).json({
                    message: 'Access denied: You are not the assigned teacher for this course'
                });
            }
        } else if (role === 'Admin' || role === 'Super Admin') {
            // Admins & Super Admins always allowed
            console.log('Admin access granted');
        } else {
            // Students must be enrolled
            const enrolled = await isEnrolled(userId, courseId);
            if (!enrolled) {
                return res.status(403).json({
                    message: 'Access denied: You are not enrolled in this course'
                });
            }
        }

        // 🔹 Fetch the forum for the course
        const forum = await Forum.findOne({
            where: { courseId },
            include: [
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['id', 'name', 'role']
                }
            ]
        });

        if (!forum) {
            return res.status(404).json({ message: 'Forum not found for this course' });
        }

        // 🔹 Success response
        res.status(200).json(forum);

    } catch (error) {
        console.error('Error retrieving forum:', error);
        res.status(500).json({
            message: 'Error retrieving forum',
            error: error.message
        });
    }
};

// GET /api/forums/:forumId/threads
exports.getThreadsByForum = async (req, res) => {
    const { forumId } = req.params;

    try {
        const threads = await Thread.findAll({
            where: { forumId },
            include: [
                { model: User, as: 'Creator', attributes: ['id', 'name', 'role'] },
                { model: Resource, as: 'Resources' },
                { model: Like, as: 'Likes', attributes: ['id'] }, // Count likes
                { model: Post, as: 'Posts', attributes: ['id'] } // Count posts
            ],
            order: [['updatedAt', 'DESC']]
        });
        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving threads', error: error.message });
    }
};

// GET /api/threads/:threadId
exports.getThreadWithPosts = async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({
            where: { id: threadId },
            include: [
                { model: User, as: 'Creator', attributes: ['id', 'name', 'role'] },
                { model: Resource, as: 'Resources' },
                { model: Like, as: 'Likes', attributes: ['userId'] }, // Get liker IDs
                {
                    model: Post,
                    as: 'Posts',
                    include: [
                        { model: User, as: 'Creator', attributes: ['id', 'name', 'role'] },
                        { model: Resource, as: 'Resources' },
                        { model: Like, as: 'Likes', attributes: ['userId'] } // Get liker IDs
                    ],
                    order: [['createdAt', 'ASC']]
                }
            ],
        });

        if (!thread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        res.status(200).json(thread);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving thread', error: error.message });
    }
};

// GET /api/forums/:forumId/participants
exports.getForumParticipants = async (req, res) => {
    const { forumId } = req.params;
    try {
        const participants = await ForumParticipant.findAll({
            where: { forumId },
            include: [{ model: User, as: 'User', attributes: ['id', 'name', 'role'] }]
        });
        res.status(200).json(participants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching participants', error: error.message });
    }
};


// ====================================================
// 🧑‍🎓 STUDENT Controllers (Participation)
// ====================================================

// POST /api/forums/:forumId/threads
exports.createThread = async (req, res) => {
    const { forumId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;
    // const files = req.files || []; // REMOVED FILE LOGIC

    try {
        const thread = await Thread.create({ forumId, userId, title, content });
        // await saveResources(thread.id, 'Thread', files); // REMOVED FILE LOGIC

        const newThread = await Thread.findByPk(thread.id, {
            // REMOVED Resource include since no resources are being saved
        });

        // Optional: Add the user to ForumParticipant if not already there
        await ForumParticipant.findOrCreate({
            where: { forumId, userId },
            defaults: { role: req.user.role === 'Teacher' ? 'Teacher' : 'Student' }
        });

        res.status(201).json({ message: 'Thread created successfully', thread: newThread });
    } catch (error) {
        res.status(500).json({ message: 'Error creating thread', error: error.message });
    }
};

// PUT /api/threads/:threadId
exports.updateOwnThread = async (req, res) => {
    const { threadId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    try {
        const [updated] = await Thread.update(
            { title, content, updatedAt: new Date() },
            { where: { id: threadId, userId } }
        );

        if (updated === 0) {
            return res.status(403).json({ message: 'Thread not found or unauthorized to edit' });
        }
        res.status(200).json({ message: 'Thread updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating thread', error: error.message });
    }
};

// DELETE /api/threads/:threadId
exports.deleteOwnThread = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;

    try {
        const deleted = await Thread.destroy({ where: { id: threadId, userId } });
        if (deleted === 0) {
            return res.status(403).json({ message: 'Thread not found or unauthorized to delete' });
        }
        res.status(200).json({ message: 'Thread deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting thread', error: error.message });
    }
};

// POST /api/threads/:threadId/posts
exports.createPost = async (req, res) => {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    // const files = req.files || []; // REMOVED FILE LOGIC

    try {
        const post = await Post.create({ threadId, userId, content });
        await Thread.update({ updatedAt: new Date() }, { where: { id: threadId } });
        // await saveResources(post.id, 'Post', files); // REMOVED FILE LOGIC
        
        const newPost = await Post.findByPk(post.id, {
            // REMOVED Resource include since no resources are being saved
        });

        // NOTIFICATION: Notify the thread creator
        const thread = await Thread.findByPk(threadId);
        if (thread && thread.userId !== userId) {
            await createNotification(
                thread.userId, 
                'new_reply', 
                `${req.user.name} replied to your thread: "${thread.title.substring(0, 30)}..."`, 
                post.id, 
                'Post'
            );
        }

        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        res.status(500).json({ message: 'Error creating post', error: error.message });
    }
};

// PUT /api/posts/:postId
exports.updateOwnPost = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    try {
        const [updated] = await Post.update(
            { content, updatedAt: new Date() },
            { where: { id: postId, userId } }
        );

        if (updated === 0) {
            return res.status(403).json({ message: 'Post not found or unauthorized to edit' });
        }
        res.status(200).json({ message: 'Post updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating post', error: error.message });
    }
};

// DELETE /api/posts/:postId
exports.deleteOwnPost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const deleted = await Post.destroy({ where: { id: postId, userId } });
        if (deleted === 0) {
            return res.status(403).json({ message: 'Post not found or unauthorized to delete' });
        }
        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting post', error: error.message });
    }
};


// ====================================================
// 🔔 NOTIFICATION Controllers
// ====================================================

// GET /api/notifications
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit notifications fetched
        });
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// PUT /api/notifications/:notificationId/mark-read
exports.markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        const [updated] = await Notification.update(
            { isRead: true },
            { where: { id: notificationId, userId: req.user.id } }
        );
        if (updated === 0) {
            return res.status(404).json({ message: 'Notification not found or not owned by user' });
        }
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
};

// POST /api/notifications/announcement (Teacher/Admin Announcement)
exports.sendAnnouncement = async (req, res) => {
    const { courseId, message } = req.body;
    
    // Check if the user is the teacher of the course
    // NOTE: An Admin role check should ideally be added here for full 'restrictTo' compatibility
    const course = await Course.findByPk(courseId);
    if (!course || (course.teacherId !== req.user.id && req.user.role !== 'Admin' && req.user.role !== 'Super Admin')) {
        return res.status(403).json({ message: 'Access denied: Only authorized personnel (Teacher/Admin) can send announcements for this course' });
    }

    const enrollments = await db.Enrollment.findAll({ where: { courseId } });
    const userIds = enrollments.map(e => e.userId);

    const notifications = userIds.map(userId => ({
        userId,
        type: 'forum_announcement',
        message: `[Announcement] ${message}`,
        entityType: 'Course',
        entityId: courseId,
        isRead: false
    }));
    
    try {
        await Notification.bulkCreate(notifications);
        res.status(201).json({ message: `Announcement sent to ${userIds.length} users.` });
    } catch (error) {
        res.status(500).json({ message: 'Error sending announcement', error: error.message });
    }
};


// ====================================================
// ❤️ LIKE Controllers
// ====================================================

// POST /api/threads/:threadId/like
exports.toggleThreadLike = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;
    const entityType = 'Thread';

    try {
        const existingLike = await Like.findOne({ 
            where: { userId, entityId: threadId, entityType } 
        });
        const thread = await Thread.findByPk(threadId);

        if (existingLike) {
            await existingLike.destroy();
            return res.status(200).json({ message: 'Thread unliked', liked: false });
        } else {
            const like = await Like.create({ userId, entityId: threadId, entityType });
            
            // NOTIFICATION: Notify the thread creator
            if (thread && thread.userId !== userId) {
                await createNotification(
                    thread.userId, 
                    'thread_like', 
                    `${req.user.name} liked your thread: "${thread.title.substring(0, 30)}..."`, 
                    thread.id, 
                    'Thread'
                );
            }
            
            return res.status(201).json({ message: 'Thread liked', liked: true, like });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error toggling thread like', error: error.message });
    }
};

// POST /api/posts/:postId/like
exports.togglePostLike = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    const entityType = 'Post';

    try {
        const existingLike = await Like.findOne({ 
            where: { userId, entityId: postId, entityType } 
        });
        const post = await Post.findByPk(postId);

        if (existingLike) {
            await existingLike.destroy();
            return res.status(200).json({ message: 'Post unliked', liked: false });
        } else {
            const like = await Like.create({ userId, entityId: postId, entityType });
            
            // NOTIFICATION: Notify the post creator
            if (post && post.userId !== userId) {
                await createNotification(
                    post.userId, 
                    'post_like', 
                    `${req.user.name} liked your reply.`, 
                    post.id, 
                    'Post'
                );
            }
            
            return res.status(201).json({ message: 'Post liked', liked: true, like });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error toggling post like', error: error.message });
    }
};