// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Used by your User model's 'comparePassword' and pre-save hooks
const dotenv = require('dotenv');
const db = require('../models/index');
const User = db.User;
const generateOTP = require('../utils/otpGenerator'); // Assuming this exists and works
const sgMail = require('@sendgrid/mail');

dotenv.config();

// --- START SendGrid Configuration (FIXED SENDER EMAIL) ---
// Using the same API key as your server.js
sgMail.setApiKey('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');

// 💡 FIX: Use the verified hardcoded email address or ensure SENDER_EMAIL is set in your .env
const SENDER_EMAIL = '22781A33D2@svcet.edu.in';
const SENDER_NAME = 'INFINITY SQUAD LMS';

// Helper function for sending email
const sendVerificationEmail = async (user, purpose = 'Verification') => {
    // 1. Generate OTP and expiry
    const otp = generateOTP();
    const OTP_VALID_MINUTES = 10;
    const otpExpires = Date.now() + OTP_VALID_MINUTES * 60 * 1000;

    // 2. Save OTP to the database
    user.otp = otp;
    user.otpExpires = new Date(otpExpires);
    await user.save(); 

    // 3. Construct the email
    const subject = `Your LMS ${purpose} Code`;
    const htmlContent = `
        <p>Hello ${user.name},</p>
        <p>Your one-time <strong>${purpose}<strong/> code is:</p>
        <h2 style="color: #4CAF50;">${otp}</h2>
        <p>This code is valid for **10 minutes**.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,<br>${SENDER_NAME}</p>
    `;

    const msg = {
        to: user.email,
        from: {
            email: SENDER_EMAIL, // Use the configured sender
            name: SENDER_NAME,
        },
        subject: subject,
        html: htmlContent,
    };

    // 4. Send the email and handle errors
    try {
        await sgMail.send(msg);
        console.log(`✅ Email sent successfully to ${user.email} for ${purpose}.`);
        return otp;
    } catch (error) {
        // Log the detailed error from SendGrid's response body for debugging
        console.error('❌ Failed to send email:', error.response?.body || error.message);
        throw new Error('Could not send verification email. Check SendGrid configuration and sender verification.');
    }
};

const generateToken = (id, role) => {
    // 💡 IMPROVEMENT: Ensure JWT_SECRET and JWT_EXPIRES_IN are set in .env
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// ----------------------------------------------------
// 1. Register/Signup Logic
// ----------------------------------------------------
exports.registerUser = async (req, res) => {
    const { name, email, password, role, countryCode, phoneNumber } = req.body;

    // Standard field validation
    if (!name || !email || !password || !role || !countryCode || !phoneNumber) {
        return res.status(400).json({ message: 'Please enter all required fields: name, email, password, role, country code, and phone number.' });
    }
    const validRoles = ['Student', 'Teacher', 'Super Admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    try {
        // Check for existing users (better to combine or chain finds)
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        user = await User.findOne({ where: { phoneNumber, countryCode } });
        if (user) {
            return res.status(400).json({ message: 'User with this phone number already exists.' });
        }

        // Create new user
        user = await User.create({ 
            name, 
            email, 
            password, // Password hashing should be handled by a Sequelize hook
            role, 
            countryCode, 
            phoneNumber, 
            isVerified: false 
        });

        // Send OTP
        await sendVerificationEmail(user, 'Account Verification');

        res.status(201).json({
            message: 'Registration successful. OTP sent to your email for verification.',
            userId: user.id,
            email: user.email,
        });

    } catch (error) {
        console.error('Error in registerUser:', error); // Better error logging
        // Check if the error is from the email sending function
        if (error.message.includes('Could not send verification email')) {
            return res.status(503).json({ 
                message: 'Registration successful, but failed to send verification email. Please try resending OTP.',
                userId: user?.id,
                email: user?.email
            });
        }
        res.status(500).json({ message: `Server error during registration: ${error.message}` });
    }
};

// ----------------------------------------------------
// 2. OTP Verification Logic
// ----------------------------------------------------
exports.verifyOTP = async (req, res) => {
    const { identifier, otp } = req.body; 

    if (!identifier || !otp) {
        return res.status(400).json({ message: 'Please provide identifier (email) and OTP.' });
    }

    try {
        const user = await User.findOne({ where: { email: identifier } }); 

        if (!user) {
            return res.status(404).json({ message: 'Verification failed: User not found.' });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'Account is already verified. Proceed to login.', isVerified: true });
        }

        // OTP validation checks
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Expired OTP. Please request a new one.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP provided.' });
        }

        // Successful verification
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = generateToken(user.id, user.role);

        res.status(200).json({
            message: 'Account successfully verified and logged in.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber },
        });
    } catch (error) {
        console.error('Error in verifyOTP:', error);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
};

// ----------------------------------------------------
// 3. Login Logic
// ----------------------------------------------------
exports.loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Please provide an email/phone number and password.' });
    }

    try {
        const isEmail = identifier.includes('@');
        const searchIdentifier = identifier.replace(/^\+/, '');

        let user;
        // Search by email or phone number
        if (isEmail) {
            user = await User.findOne({ where: { email: searchIdentifier } });
        } else {
            // NOTE: This assumes the user inputs the raw phone number (without country code) if not an email.
            // A more robust solution would require both countryCode and phoneNumber on login.
            user = await User.findOne({ where: { phoneNumber: searchIdentifier } }); 
        }

        if (!user) {
            return res.status(404).json({ message: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!user.isVerified) {
            // Resend OTP for verification upon login attempt
            await sendVerificationEmail(user, 'Account Verification'); 
            return res.status(403).json({ 
                message: 'Account not verified. A new verification OTP has been sent to your email.',
                requiresOTP: true 
            });
        }

        const token = generateToken(user.id, user.role);

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber },
        });

    } catch (error) {
        console.error('Error in loginUser:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
};

// ----------------------------------------------------
// 4. Forgot Password (Request Reset) Logic
// ----------------------------------------------------
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide your email address.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // 💡 SECURITY: Return a generic message to prevent user enumeration
            return res.status(200).json({ message: 'If a user exists, a password reset code has been sent to their email address.' });
        }

        await sendVerificationEmail(user, 'Password Reset');

        res.status(200).json({
            message: 'Password reset code has been sent to your email address.',
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: `Server error during password reset request: ${error.message}` });
    }
};

// ----------------------------------------------------
// 5. Reset Password Logic (using OTP via Email)
// ----------------------------------------------------
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Please provide email, OTP, and new password.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'Invalid request: User not found.' });
        }
        
        // OTP validation checks
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired password reset OTP.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid password reset OTP.' });
        }

        // Apply new password
        user.password = newPassword; // Hashing should occur via a Sequelize hook
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({
            message: 'Password has been successfully reset. You can now log in.',
        });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

// ----------------------------------------------------
// 6. Resend OTP Verification Email Logic
// ----------------------------------------------------
exports.resendOTP = async (req, res) => {
    const { email, purpose = 'Verification' } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide the user email address.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Keep the response generic for security
            return res.status(404).json({ message: 'User not found or ineligible for resend.' });
        }
        
        if (user.isVerified && purpose === 'Verification') {
            return res.status(400).json({ message: 'Account is already verified. Cannot resend verification code.' });
        }

        // Send a new OTP email
        await sendVerificationEmail(user, purpose); 

        let message = `New ${purpose} code has been successfully sent to your email.`;

        res.status(200).json({
            message: message,
            email: user.email,
        });

    } catch (error) {
        console.error('Error in resendOTP:', error);
        res.status(500).json({ message: `Server error during OTP resend: ${error.message}` });
    }
};