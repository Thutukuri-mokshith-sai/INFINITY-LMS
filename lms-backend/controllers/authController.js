// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Vonage } = require('@vonage/server-sdk');
const dotenv = require('dotenv');
const db = require('../models/index');
const User = db.User;
const generateOTP = require('../utils/otpGenerator');

dotenv.config();

// --- START Vonage Configuration ---
const VONAGE_API_KEY = process.env.VONAGE_API_KEY || '9278200e';
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET || 'zb6LV8qp88qsPjaQ';
const VONAGE_SENDER_ID = process.env.VONAGE_SENDER_ID || 'VonageAPI';

const vonage = new Vonage({
    apiKey: VONAGE_API_KEY,
    apiSecret: VONAGE_API_SECRET,
});

const formatPhoneNumber = (countryCode, phoneNumber) => {
    const rawNumber = phoneNumber.replace(/^\+/, '');
    const code = countryCode.replace(/^\+/, '');
    if (rawNumber.startsWith(code)) return rawNumber;
    return `${code}${rawNumber}`;
};
// --- END Vonage Configuration ---

const sendVerificationSMS = async (user, purpose = 'Verification') => {
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000;

    user.otp = otp;
    user.otpExpires = new Date(otpExpires);
    await user.save();

    const fullPhoneNumber = formatPhoneNumber(user.countryCode, user.phoneNumber);
    const textMessage = `Your LMS ${purpose} Code is: ${otp}. It expires in 10 minutes.`;

    try {
        const response = await vonage.sms.send({
            to: fullPhoneNumber,
            from: VONAGE_SENDER_ID,
            text: textMessage
        });

        if (response.messages[0].status === '0') {
            console.log('✅ SMS sent successfully:', response.messages[0]);
        } else {
            console.error(`❌ Vonage SMS Error (${response.messages[0].status}):`, response.messages[0]['error-text']);
            throw new Error(`SMS delivery failed: ${response.messages[0]['error-text']}`);
        }

        return otp;
    } catch (error) {
        console.error('❌ Failed to send SMS:', error);
        throw new Error('Could not send verification SMS.');
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
        // Check if user already exists by email
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Check if user already exists by phone number and country code
        user = await User.findOne({ where: { phoneNumber, countryCode } });
        if (user) {
            return res.status(400).json({ message: 'User with this phone number already exists.' });
        }

        // ✅ Save raw phone number and countryCode
        user = await User.create({ 
            name, 
            email, 
            password, 
            role, 
            countryCode, 
            phoneNumber, 
            isVerified: false 
        });

        await sendVerificationSMS(user, 'Account Verification');

        res.status(201).json({
            message: 'Registration successful. OTP sent to your phone number for verification.',
            userId: user.id,
            fullPhoneNumber: formatPhoneNumber(user.countryCode, user.phoneNumber),
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
    const { identifier, otp } = req.body; 

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
            await sendVerificationSMS(user, 'Account Verification'); 
            return res.status(403).json({ 
                message: 'Account not verified. A new verification OTP has been sent to your phone number.',
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
    const { phoneNumber, countryCode } = req.body;

    if (!phoneNumber || !countryCode) {
        return res.status(400).json({ message: 'Please provide your country code and phone number.' });
    }

    const searchNumber = phoneNumber.replace(/^\+/, '');

    try {
        const user = await User.findOne({ where: { phoneNumber: searchNumber, countryCode } });

        if (!user) {
            return res.status(404).json({ message: 'User with this phone number does not exist.' });
        }

        await sendVerificationSMS(user, 'Password Reset');

        res.status(200).json({
            message: 'Password reset code has been sent to your phone number via SMS.',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Server error during password reset request: ${error.message}` });
    }
};

// ----------------------------------------------------
// 5. Reset Password Logic (using OTP)
// ----------------------------------------------------
exports.resetPassword = async (req, res) => {
    const { phoneNumber, countryCode, otp, newPassword } = req.body;

    if (!phoneNumber || !countryCode || !otp || !newPassword) {
        return res.status(400).json({ message: 'Please provide phone number, country code, OTP, and new password.' });
    }

    const searchNumber = phoneNumber.replace(/^\+/, '');

    try {
        const user = await User.findOne({ where: { phoneNumber: searchNumber, countryCode } });

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
