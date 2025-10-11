// ForgotPassword.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSpinner, FaPhone, FaLock, FaKey, FaQuestionCircle } from "react-icons/fa";

// Reusable Neon Input Component (No change)
const NeonInput = ({ type, placeholder, value, onChange, Icon, readOnly = false }) => (
    <div className={`input-group ${readOnly ? 'input-group-readonly' : ''}`}>
        <Icon className="input-icon" />
        <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={!readOnly}
            readOnly={readOnly}
        />
    </div>
);

// Password Strength Meter Component (No change)
const PasswordStrengthMeter = ({ strength }) => {
    let color = 'rgba(236, 253, 245, 0.4)';
    let width = '33.3%';
    if (strength.text === 'Medium') {
        color = 'orange';
        width = '66.6%';
    } else if (strength.text === 'Strong') {
        color = '#10b981'; 
        width = '100%';
    }

    return (
        <div className="password-strength-container">
            <div className="password-strength-bar">
                <div 
                    className="password-strength-fill" 
                    style={{ width: width, backgroundColor: color }}
                ></div>
            </div>
            <p className="password-strength-text" style={{ color: color }}>
                Strength: {strength.text}
            </p>
        </div>
    );
};

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState("request");
    // State variable explicitly named 'phoneNumber' for clarity
    const [phoneNumber, setPhoneNumber] = useState(""); 
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpTimerRef = useRef(null);

    // --- useEffect for Countdown Timer (No change) ---
    useEffect(() => {
        if (countdown > 0) {
            if (otpTimerRef.current) clearInterval(otpTimerRef.current);

            const timer = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);

            otpTimerRef.current = timer;

            return () => clearInterval(timer);
        } else if (countdown === 0 && otpTimerRef.current) {
            clearInterval(otpTimerRef.current);
            otpTimerRef.current = null;
        }
    }, [countdown]); // Removed 'step' from dependency array as it's not strictly needed here

    const startCountdown = () => setCountdown(60);

    // --- Password Strength Logic (No change) ---
    const getPasswordStrength = () => {
        if (newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[\W_]/.test(newPassword)) {
            return { text: "Strong", color: "#10b981" }; 
        } else if (newPassword.length >= 6 && (/[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword))) {
            return { text: "Medium", color: "orange" };
        }
        return { text: "Weak", color: "red" };
    };

    // ------------------------------------------------------------------
    // 🔥 ACTUAL API CALL HANDLERS (Updated to use 'phoneNumber' state)
    // ------------------------------------------------------------------

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        // Simple validation check before API call
        if (!phoneNumber) {
            setLoading(false);
            setMessage("Please enter your registered phone number.");
            return;
        }

        try {
            // Endpoint to request OTP: /forgot-password
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber }), // Use phoneNumber
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                // Success: Move to OTP step and start the countdown
                setMessage(data.message || "OTP sent to your phone.");
                setStep("otp");
                startCountdown();
            } else {
                // Failure: Display error message from the backend
                setMessage(data.message || "Error requesting OTP. Please check the phone number.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Network error. Could not connect to the server. Try again later.");
        }
    };

    const handleOTPVerification = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        const strength = getPasswordStrength();
        if (strength.text !== "Strong") { // Check for Strong password requirement
            setLoading(false);
            setMessage("For security, the new password must be Strong (8+ chars, uppercase, number, symbol).");
            return;
        }
        
        // Also check if OTP is entered
        if (!otp || otp.length < 6) {
            setLoading(false);
            setMessage("Please enter the 6-digit OTP.");
            return;
        }
        
        try {
            // Endpoint to verify OTP and reset password: /reset-password
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Pass all three required fields
                body: JSON.stringify({ phoneNumber, otp, newPassword }), 
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                // Success: Password reset, redirect to login
                setMessage(data.message || "Password successfully reset! Redirecting...");
                if (otpTimerRef.current) clearInterval(otpTimerRef.current);
                setTimeout(() => navigate("/login"), 2000);
            } else {
                // Failure: Invalid OTP or other error
                setMessage(data.message || "Password reset failed. Check OTP and password requirements.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Network error. Could not connect to the server. Try again later.");
        }
    };

    // 🔥 Resend logic uses the initial request OTP endpoint.
    const handleResendOTP = async () => {
        setLoading(true);
        setMessage("Requesting new OTP...");
        
        try {
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber }), // Resend uses the existing phone number
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "New OTP sent!");
                startCountdown(); // Restart the countdown timer
            } else {
                setMessage(data.message || "Failed to resend OTP.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Network error. Try again later.");
        }
    };

    // ------------------------------------------------------------------
    // 🔥 RENDER JSX (No functional changes, just ensuring variable names match)
    // ------------------------------------------------------------------

    return (
        <div className="forgot-container">
            {/* CSS STYLES (No Change) */}
            <style>{`
                :root {
                    --neon-color: #00FFFF; /* Electric Blue */
                    --dark-bg: #022c22;
                    --light-text: #ecfdf5;
                    --neon-shadow: 0 0 5px var(--neon-color), 0 0 10px var(--neon-color), 0 0 20px var(--neon-color);
                    --neon-shadow-small: 0 0 3px var(--neon-color), 0 0 6px var(--neon-color);
                }

                .forgot-container {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Poppins', sans-serif;
                    background: radial-gradient(circle at 50% 50%, #064e3b 10%, var(--dark-bg) 80%);
                    color: var(--light-text);
                }

                .forgot-left {
                    flex: 1;
                    background: linear-gradient(135deg, #064e3b, #065f46, #10b981, #34d399);
                    background-size: 400% 400%;
                    animation: gradientMove 10s ease infinite;
                    color: var(--light-text);
                    padding: 60px 40px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                }

                .forgot-left h1 {
                    font-size: 36px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                
                .left-panel-glow {
                    position: absolute;
                    bottom: -50px;
                    right: -50px;
                    width: 200px;
                    height: 200px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    filter: blur(50px);
                    animation: pulseGlow 5s infinite alternate;
                    z-index: -1;
                }

                .company-logo {
                    margin-bottom: 30px;
                    filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
                }

                .company-logo img {
                    width: 200px;
                    height:200px;
                    object-fit: contain;
                }

                .forgot-right {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                }
                
                .forgot-form {
                    width: 100%;
                    max-width: 450px; 
                    padding: 40px; 
                    background: rgba(0, 0, 0, 0.5); 
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px;
                    box-shadow: 0 0 25px rgba(0, 255, 255, 0.2); 
                    border: 1px solid rgba(0, 255, 255, 0.1);
                    z-index: 1;
                    animation: fadeIn 0.8s ease forwards;
                }

                .forgot-form h2 {
                    text-align: center;
                    font-size: 28px; 
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow);
                    margin-bottom: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .step-icon {
                    margin-right: 10px;
                    font-size: 24px;
                }

                .info-text {
                    text-align: center;
                    color: #a7f3d0;
                    margin-bottom: 30px;
                    font-size: 15px;
                }

                .input-group {
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 12px 15px;
                    margin-bottom: 20px;
                    box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
                    transition: all 0.3s ease;
                    border: 1px solid rgba(0, 255, 255, 0.1);
                }
                
                .input-group-readonly {
                    opacity: 0.7;
                    pointer-events: none; 
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px dashed rgba(0, 255, 255, 0.05);
                }

                .input-icon {
                    color: var(--neon-color);
                    font-size: 16px;
                    margin-right: 12px;
                    filter: drop-shadow(0 0 2px var(--neon-color));
                }

                .input-group:focus-within:not(.input-group-readonly) {
                    background: rgba(0, 255, 255, 0.1);
                    box-shadow: 
                        0 0 10px var(--neon-color), 
                        0 0 25px var(--neon-color), 
                        inset 0 0 10px rgba(0, 255, 255, 0.5); 
                    border: 1px solid var(--neon-color);
                }

                .input-group input {
                    border: none;
                    outline: none;
                    flex: 1;
                    padding-left: 0;
                    font-size: 16px;
                    background: transparent;
                    color: var(--light-text);
                    caret-color: var(--neon-color);
                }
                .input-group input::placeholder {
                    color: rgba(236, 253, 245, 0.5);
                }

                .btn-primary {
                    width: 100%;
                    padding: 14px;
                    background: var(--neon-color);
                    color: var(--dark-bg);
                    border: none;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: 700;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 15px var(--neon-color);
                    animation: neonPulse 2s infinite alternate;
                    margin-bottom: 10px; 
                }
                
                .btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    animation: none;
                    box-shadow: 0 0 5px var(--neon-color);
                }

                .btn-primary:hover:not(:disabled) {
                    background: #33ffff;
                    transform: translateY(-3px) scale(1.01);
                    box-shadow: 
                        0 0 5px var(--neon-color), 
                        0 0 35px var(--neon-color), 
                        0 0 70px var(--neon-color);
                }

                .resend-container {
                    text-align: center;
                    margin-bottom: 20px;
                }
                
                .btn-link {
                    background: none;
                    border: none;
                    color: #a7f3d0;
                    cursor: pointer;
                    font-size: 14px;
                    transition: 0.3s;
                    text-decoration: none;
                    padding: 5px;
                }

                .btn-link:hover:not(:disabled) {
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                }
                
                .btn-link:disabled {
                    color: rgba(255, 255, 255, 0.3);
                    cursor: not-allowed;
                }

                .message-box {
                    text-align: center;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    text-shadow: 0 0 3px rgba(0,0,0,0.5);
                }

                .password-strength-container {
                    margin-bottom: 20px;
                }

                .password-strength-bar {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 5px;
                }

                .password-strength-fill {
                    height: 100%;
                    transition: width 0.3s ease, background-color 0.3s ease;
                    border-radius: 4px;
                    box-shadow: 0 0 5px currentColor; 
                }

                .password-strength-text {
                    font-size: 12px;
                    font-weight: 600;
                    text-align: right;
                    transition: color 0.3s ease;
                    filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    font-size: 18px;
                    color: var(--dark-bg);
                }

                .neon-divider {
                    height: 1px;
                    background: linear-gradient(to right, transparent, var(--neon-color), transparent);
                    box-shadow: var(--neon-shadow-small);
                    margin: 25px 0 20px 0;
                }

                .links {
                    text-align: center;
                    font-size: 14px;
                }

                .links a {
                    color: #a7f3d0;
                    text-decoration: none;
                    transition: 0.3s;
                    padding: 5px;
                }
                
                .link-separator {
                    color: #4b5563;
                    margin: 0 5px;
                }

                .links a:hover {
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                }

                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes neonPulse {
                    0% { box-shadow: 0 0 15px var(--neon-color); }
                    100% { box-shadow: 0 0 5px var(--neon-color), 0 0 25px var(--neon-color); }
                }
                @keyframes pulseGlow {
                    0% { transform: scale(1); opacity: 0.2; }
                    100% { transform: scale(1.2); opacity: 0.4; }
                }

                @media (max-width: 768px) {
                    .forgot-container {
                        flex-direction: column;
                    }
                    .forgot-left {
                        min-height: 30vh;
                        padding: 40px 20px;
                        text-align: center;
                    }
                    .forgot-right {
                        flex: unset;
                        width: 100%;
                        min-height: 70vh;
                    }
                    .forgot-form {
                        max-width: 90%;
                        padding: 25px;
                    }
                }
            `}</style>

            <div className="forgot-left">
                <div className="company-logo">
                    {/* Assuming you have a logo.png in your public directory */}
                    <img src="/logo.png" alt="Company Logo" /> 
                </div>
                <h1>Account Recovery</h1>
                <p>
                    Recover your learning portal account with a secure verification process using your registered phone number.
                </p>
                <div className="left-panel-glow"></div>
            </div>

            <div className="forgot-right">
                <div className="forgot-form">
                    
                    {/* STEP 1: Request OTP */}
                    {step === "request" && (
                        <>
                            <h2><FaQuestionCircle className="step-icon" /> Phone Recovery</h2>
                            <p className="info-text">
                                Enter your **registered phone number** to receive a One-Time Password (OTP).
                            </p>
                            <form onSubmit={handleRequestOTP}>
                                <NeonInput
                                    type="tel"
                                    placeholder="Enter your phone number (e.g., +14085551234)"
                                    value={phoneNumber} 
                                    onChange={(e) => setPhoneNumber(e.target.value)} 
                                    Icon={FaPhone}
                                />
                                <button className="btn-primary" type="submit" disabled={loading}>
                                    {loading ? <FaSpinner className="spinner" /> : "Send Code"}
                                </button>
                            </form>
                        </>
                    )}

                    {/* STEP 2: Verify & Reset Password */}
                    {step === "otp" && (
                        <>
                            <h2><FaKey className="step-icon" /> Reset Password</h2>
                            <p className="info-text">
                                Code sent to **{phoneNumber}**. Enter the code and set a new password.
                            </p>
                            <form onSubmit={handleOTPVerification}>
                                {/* Read-only phone number input */}
                                <NeonInput 
                                    type="tel" 
                                    value={phoneNumber} 
                                    placeholder="Registered Phone"
                                    Icon={FaPhone} 
                                    readOnly 
                                />
                                {/* OTP Input */}
                                <NeonInput
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    Icon={FaKey}
                                />
                                {/* New Password Input */}
                                <NeonInput
                                    type="password"
                                    placeholder="Set new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    Icon={FaLock}
                                />
                                <PasswordStrengthMeter strength={getPasswordStrength()} />

                                <button className="btn-primary" type="submit" disabled={loading}>
                                    {loading ? <FaSpinner className="spinner" /> : "Reset Password"}
                                </button>

                                <div className="resend-container">
                                    <button 
                                        type="button" 
                                        className="btn-link"
                                        disabled={countdown > 0 || loading}
                                        onClick={handleResendOTP} 
                                    >
                                        {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Message */}
                    {message && (
                        <p className="message-box" style={{
                            color: /success|sent|reset/i.test(message) ? "var(--neon-color)" : "red",
                            border: /success|sent|reset/i.test(message) ? "1px solid var(--neon-color)" : "1px solid red",
                            boxShadow: /success|sent|reset/i.test(message) ? "var(--neon-shadow-small)" : "0 0 5px red"
                        }}>
                            {message}
                        </p>
                    )}

                    <div className="neon-divider"></div>

                    <div className="links">
                        <Link to="/login">Back to Login</Link>
                        <span className="link-separator"> | </span>
                        <Link to="/signup">Create New Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;