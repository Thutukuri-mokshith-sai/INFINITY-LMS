// routes/forumRoutes.js

const express = require('express');
const router = express.Router();
const forumController = require('../controllers/forumController');

// --- ASSUMED IMPORTS ---
// Using the auth structure from enrollmentRoutes.js
const { protect, restrictTo } = require('../middleware/authMiddleware'); 
// -----------------------

// ----------------------------------------------------
// 👩‍🏫 TEACHER & ADMIN Routes (Moderation & Creation)
// Role check: restrictTo('Teacher', 'Admin')
// ----------------------------------------------------

// Forums CRUD
router.post(
    '/forums', 
    protect, 
    restrictTo('Teacher', 'Admin'), 
    forumController.createForum
);
router.put(
    '/forums/:forumId', 
    protect, 
    restrictTo('Teacher', 'Admin'), 
    forumController.updateForum
);
router.delete(
    '/forums/:forumId', 
    protect, 
    restrictTo('Teacher', 'Admin'), 
    forumController.deleteForum
);

// Moderation (Delete ANY thread/post)
router.delete(
    '/threads/:threadId', 
    protect, 
    restrictTo('Teacher', 'Admin'), 
    forumController.deleteAnyThread
);
router.delete(
    '/posts/:postId', 
    protect, 
    restrictTo('Teacher', 'Admin'), 
    forumController.deleteAnyPost
);

// Announcements (Teacher/Admin Notification)
router.post(
    '/notifications/announcement', 
    protect, 
    restrictTo('Teacher', 'Admin'), 
    forumController.sendAnnouncement
);

// ----------------------------------------------------
// 🧑‍🎓 STUDENT & 👩‍🏫 TEACHER Shared Routes (Viewing)
// Access check: protect (Any authenticated user)
// ----------------------------------------------------

// Viewing Forum Structure
router.get('/forums/:courseId', protect, forumController.getForumByCourseId);
router.get('/forums/:forumId/threads', protect, forumController.getThreadsByForum);
router.get('/threads/:threadId', protect, forumController.getThreadWithPosts);

// Viewing Participation (Optional but included)
router.get('/forums/:forumId/participants', protect, forumController.getForumParticipants);

// Notifications
router.get('/notifications', protect, forumController.getNotifications);
router.put('/notifications/:notificationId/mark-read', protect, forumController.markNotificationAsRead);


// ----------------------------------------------------
// 🧑‍🎓 STUDENT Routes (Participation & Engagement)
// Role check for creation: restrictTo('Student', 'Teacher', 'Admin')
// ----------------------------------------------------

// Thread CRUD (No Attachments/Uploads)
router.post(
    '/forums/:forumId/threads', 
    protect, 
    restrictTo('Student', 'Teacher', 'Admin'), 
    forumController.createThread
);
router.put('/threads/:threadId', protect, forumController.updateOwnThread);
router.delete('/threads/:threadId', protect, forumController.deleteOwnThread);

// Post CRUD (No Attachments/Uploads)
router.post(
    '/threads/:threadId/posts', 
    protect, 
    restrictTo('Student', 'Teacher', 'Admin'), 
    forumController.createPost
);
router.put('/posts/:postId', protect, forumController.updateOwnPost);
router.delete('/posts/:postId', protect, forumController.deleteOwnPost);

// Likes
router.post('/threads/:threadId/like', protect, forumController.toggleThreadLike);
router.post('/posts/:postId/like', protect, forumController.togglePostLike);

module.exports = router;