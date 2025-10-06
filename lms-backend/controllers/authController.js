// controllers/authController.js
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../models/index');
const User = db.User;
const generateOTP = require('../utils/otpGenerator');

// Setup Nodemailer transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper functions for Email and Token
const sendEmail = async (user, subject, htmlContent) => {
    const otp = generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    user.otp = otp;
    user.otpExpires = new Date(otpExpires);
    await user.save();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: subject,
        html: htmlContent.replace('{{otp}}', otp),
    };

    await transporter.sendMail(mailOptions);
    return otp;
};

const sendVerificationEmail = async (user) => {
    const subject = 'LMS Account Verification OTP';
    const htmlContent = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 450px; margin: 20px auto; text-align: center;">

    <h2 style="color: #333; font-weight: 300; margin-bottom: 30px;">
        One-Time Passcode
    </h2>

    <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
        Please enter this code to verify your account <strong style="color: #e67e22;"></strong>.
    </p>
    
    <div style="background-color: #e67e22; /* Orange/Gold Accent */ border-radius: 6px; padding: 25px 20px; margin: 20px 0; box-shadow: 0 6px 15px rgba(230, 126, 34, 0.4);">
        <p style="color: #fff; font-size: 18px; font-weight: bold; margin-top: 0;">VERIFICATION CODE</p>
        <h1 style="color: #fff; font-size: 44px; font-weight: 900; margin: 0; letter-spacing: 8px;">
            {{otp}}
        </h1>
    </div>
    <p style="color: #888; font-size: 14px; margin-top: 30px;">
        This code expires in 10 minutes.
    </p>
</div>`;
    return sendEmail(user, subject, htmlContent);
};

const sendPasswordResetEmail = async (user) => {
    const subject = 'LMS Password Reset Verification Code';
    const htmlContent = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f4f8; padding: 30px; border-radius: 10px; max-width: 600px; margin: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #FF5733; font-size: 28px; margin-bottom: 5px;">Password Reset</h1>
    <p style="color: #555; font-size: 16px;">You requested a password reset. Use the code below to reset your password.</p>
  </div>

  <div style="text-align: center; background: linear-gradient(90deg, #FF5733, #FF8D1A); padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #fff; font-size: 36px; letter-spacing: 4px; margin: 0;">{{otp}}</h2>
  </div>

  <p style="text-align: center; color: #555; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. Please ignore this email if you did not request a reset.</p>

  
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 40px;">If you did not request this, no action is required.</p>
</div>
`;

    return sendEmail(user, subject, htmlContent);
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// 1. Register/Signup Logic
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }
  const validRoles = ['Student', 'Teacher', 'Super Admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role specified.' });
  }

  try {
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    user = await User.create({ name, email, password, role, isVerified: false });
    await sendVerificationEmail(user);

    res.status(201).json({
      message: 'Registration successful. OTP sent to your email for verification.',
      userId: user.id,
      email: user.email
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// 2. OTP Verification Logic
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || user.isVerified) {
      return res.status(400).json({ message: 'User not found or already verified.' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      message: 'Account successfully verified and logged in.',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};


// 3. Login Logic
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      await sendVerificationEmail(user); 
      return res.status(403).json({ 
        message: 'Account not verified. A new verification OTP has been sent to your email.' 
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
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
// 4. Forgot Password (Request Reset) Logic
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide your email.' });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Return a generic message for security purposes
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // Send password reset email
    await sendPasswordResetEmail(user);

    res.status(200).json({
      message: 'Password reset instructions have been sent to your email.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password reset request.' });
  }
};

// 5. Reset Password Logic (using OTP)
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

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired password reset OTP.' });
    }

    // Update password (Model hook handles hashing)
    user.password = newPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};
