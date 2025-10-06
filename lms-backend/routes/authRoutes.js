// routes/authRoutes.js
const express = require('express');
const { 
    registerUser, 
    loginUser, 
    verifyOTP, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');
const router = express.Router();

// User Story 1: Registration & Login
router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);

// Forgot Password
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;