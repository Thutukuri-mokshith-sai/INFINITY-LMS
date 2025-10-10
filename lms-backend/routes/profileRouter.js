// routes/profileRouter.js
const express = require('express');
const {
    createOrUpdateProfile,
    getOwnProfile,
} = require('../controllers/profileController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const router = express.Router();

// All profile routes require authentication
router.use(protect);

// 1. Create or Update own profile
// The profile type is determined by the user's role (extracted from 'req.user')
router.route('/')
    .post(
        restrictTo('Teacher', 'Student'), // Only Teachers and Students can manage their specific profiles
        createOrUpdateProfile
    )
    .put(
        restrictTo('Teacher', 'Student'),
        createOrUpdateProfile // Use the same controller for PUT (update)
    );

// 2. Get own profile, including basic user details
router.get(
    '/me',
    restrictTo('Teacher', 'Student', 'Super Admin'), // Admins can also view their own (which might just be User data)
    getOwnProfile
);


module.exports = router;