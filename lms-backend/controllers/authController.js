// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const db = require('../models/index');
const User = db.User;
const generateOTP = require('../utils/otpGenerator');
const sgMail = require('@sendgrid/mail');

dotenv.config();

// --- START SendGrid Configuration ---
sgMail.setApiKey('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');

const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_NAME = 'INFINITY SQUAD LMS';

// Helper function for sending email
const sendVerificationEmail = async (user, purpose = 'Verification') => {
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = new Date(otpExpires);
    await user.save(); // Save OTP and expiry to the database

    const subject = `Your LMS ${purpose} Code`;
    const htmlContent = `
        <p>Hello ${user.name},</p>
        <p>Your one-time **${purpose}** code is:</p>
        <h2 style="color: #4CAF50;">${otp}</h2>
        <p>This code is valid for **10 minutes**.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Thank you,<br>${SENDER_NAME}</p>
    `;

    const msg = {
        to: user.email,
        from: {
            email: SENDER_EMAIL,
            name: SENDER_NAME,
        },
        subject: subject,
        html: htmlContent,
    };

    try {
        await sgMail.send(msg);
        console.log(`✅ Email sent successfully to ${user.email} for ${purpose}.`);
        return otp;
    } catch (error) {
        console.error('❌ Failed to send email:', error.response?.body || error.message);
        throw new Error('Could not send verification email. Check SendGrid configuration and API Key.');
    }
};

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

// ----------------------------------------------------
// 1. Register/Signup Logic
// ----------------------------------------------------
exports.registerUser = async (req, res) => {
    console.log(req.body);
    const { name, email, password, role, countryCode, phoneNumber } = req.body;

    if (!name || !email || !password || !role || !countryCode || !phoneNumber) {
        return res.status(400).json({ message: 'Please enter all required fields: name, email, password, role, country code, and phone number.' });
    }
    const validRoles = ['Student', 'Teacher', 'Super Admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    try {
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        user = await User.findOne({ where: { phoneNumber, countryCode } });
        if (user) {
            return res.status(400).json({ message: 'User with this phone number already exists.' });
        }

        user = await User.create({ 
            name, 
            email, 
            password, 
            role, 
            countryCode, 
            phoneNumber, 
            isVerified: false 
        });

        await sendVerificationEmail(user, 'Account Verification');

        res.status(201).json({
            message: 'Registration successful. OTP sent to your email for verification.',
            userId: user.id,
            email: user.email,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Server error during registration: ${error.message}` });
    }
};

// ----------------------------------------------------
// 2. OTP Verification Logic
// ----------------------------------------------------
exports.verifyOTP = async (req, res) => {
    const { identifier, otp } = req.body; // 'identifier' is assumed to be the user's email

    if (!identifier || !otp) {
        return res.status(400).json({ message: 'Please provide identifier (email) and OTP.' });
    }

    try {
        const user = await User.findOne({ where: { email: identifier } }); 

        if (!user) {
            return res.status(404).json({ message: 'Verification failed: User not found or invalid request.' });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'Account is already verified. Proceed to login.', isVerified: true });
        }

        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP provided.' });
        }

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
        console.error(error);
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
        let user;
        const searchIdentifier = identifier.replace(/^\+/, '');

        if (isEmail) {
            user = await User.findOne({ where: { email: searchIdentifier } });
        } else {
            user = await User.findOne({ where: { phoneNumber: searchIdentifier } });
        }

        if (!user) {
            return res.status(404).json({ message: 'Invalid credentials.' });
        }

        if (!user.isVerified) {
            await sendVerificationEmail(user, 'Account Verification'); 
            return res.status(403).json({ 
                message: 'Account not verified. A new verification OTP has been sent to your email.',
                requiresOTP: true 
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user.id, user.role);

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phoneNumber: user.phoneNumber },
        });

    } catch (error) {
        console.error(error);
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
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        await sendVerificationEmail(user, 'Password Reset');

        res.status(200).json({
            message: 'Password reset code has been sent to your email address.',
        });
    } catch (error) {
        console.error(error);
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
        
        if (user.otpExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired password reset OTP.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid password reset OTP.' });
        }

        user.password = newPassword; 
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        res.status(200).json({
            message: 'Password has been successfully reset. You can now log in.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

// ----------------------------------------------------
// 6. Resend OTP Verification Email Logic (NEW)
// ----------------------------------------------------
exports.resendOTP = async (req, res) => {
    const { email, purpose = 'Verification' } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide the user email address.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // Respond with a non-specific error to avoid user enumeration
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
        console.error(error);
        res.status(500).json({ message: `Server error during OTP resend: ${error.message}` });
    }
};