import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSpinner, FaEnvelope, FaLock, FaKey, FaQuestionCircle, FaRobot, FaEye, FaEyeSlash } from "react-icons/fa";

// Reusable Neon Input Component
const NeonInput = ({ type, placeholder, value, onChange, Icon, readOnly = false, showPasswordToggle = false }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputType = showPasswordToggle && showPassword ? "text" : type;

    return (
        <div
            className={`input-group ${isFocused ? 'focused' : ''} ${readOnly ? 'input-group-readonly' : ''}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        >
            <Icon className="input-icon" />
            <input
                type={inputType}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                required={!readOnly}
                readOnly={readOnly}
            />
            {showPasswordToggle && (
                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
            )}
        </div>
    );
};

// Password Strength Meter Component
const PasswordStrengthMeter = ({ strength }) => {
    let color = '#FF3366';
    let width = '33.3%';
    if (strength.text === 'Medium') {
        color = '#FFD700';
        width = '66.6%';
    } else if (strength.text === 'Strong') {
        color = '#39FF14';
        width = '100%';
    }

    return (
        <div className="password-strength-container">
            <div className="password-strength-bar">
                <div 
                    className="password-strength-fill" 
                    style={{ width: width, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                ></div>
            </div>
            <p className="password-strength-text" style={{ color: color, textShadow: `0 0 5px ${color}` }}>
                Strength: {strength.text}
            </p>
        </div>
    );
};

// --- Custom Hook for Password Recovery Logic ---
const BASE_URL = "https://lms-backend-foaq.onrender.com/api/auth";

const usePasswordRecovery = (navigate) => {
    const [step, setStep] = useState("request");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const otpTimerRef = useRef(null);

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
    }, [countdown]);

    const startCountdown = useCallback(() => setCountdown(60), []);

    const getPasswordStrength = useCallback(() => {
        if (newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[\W_]/.test(newPassword)) {
            return { text: "Strong", color: "#39FF14" };
        } else if (newPassword.length >= 6 && (/[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword))) {
            return { text: "Medium", color: "#FFD700" };
        }
        return { text: "Weak", color: "#FF3366" };
    }, [newPassword]);

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        if (!email || !email.includes('@')) {
            setLoading(false);
            setMessage("Please enter a valid email address.");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "Password reset code sent to your email.");
                setStep("otp");
                startCountdown();
            } else {
                setMessage(data.message || "Error requesting code. Please check your email address.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Network error. The matrix is unstable. Try again later.");
        }
    };

    const handleOTPVerification = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        const strength = getPasswordStrength();
        if (strength.text !== "Strong") {
            setLoading(false);
            setMessage("For security, the new password must be Strong (8+ chars, uppercase, number, symbol).");
            return;
        }

        if (!otp || otp.length !== 6) {
            setLoading(false);
            setMessage("Please enter the 6-digit OTP.");
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "Password successfully reset! Redirecting...");
                if (otpTimerRef.current) clearInterval(otpTimerRef.current);
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setMessage(data.message || "Password reset failed. Check OTP and password requirements.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Network error. Could not connect to the server. Try again later.");
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        setMessage("Requesting new code...");
        
        try {
            const res = await fetch(`${BASE_URL}/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "New code sent!");
                startCountdown();
            } else {
                setMessage(data.message || "Failed to resend code.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Network error. Try again later.");
        }
    };

    return {
        step,
        email,
        setEmail,
        otp,
        setOtp,
        newPassword,
        setNewPassword,
        message,
        loading,
        countdown,
        getPasswordStrength,
        handleRequestOTP,
        handleOTPVerification,
        handleResendOTP,
    };
};

// --- Main ForgotPassword Component ---
const ForgotPassword = () => {
    const navigate = useNavigate();
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [leftPanelTilt, setLeftPanelTilt] = useState({ x: 0, y: 0 });
    
    const {
        step,
        email,
        setEmail,
        otp,
        setOtp,
        newPassword,
        setNewPassword,
        message,
        loading,
        countdown,
        getPasswordStrength,
        handleRequestOTP,
        handleOTPVerification,
        handleResendOTP,
    } = usePasswordRecovery(navigate);

    const handleRightMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleLeftMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const tiltX = (y - centerY) / centerY * -5;
        const tiltY = (x - centerX) / centerX * 5;

        setLeftPanelTilt({ x: tiltX, y: tiltY });
    };

    const handleLeftMouseLeave = () => {
        setLeftPanelTilt({ x: 0, y: 0 });
    };

    return (
        <>
            <div className="login-container">
                {/* Left Panel - 3D Parallax Effect */}
                <div 
                    className="login-left"
                    onMouseMove={handleLeftMouseMove}
                    onMouseLeave={handleLeftMouseLeave}
                    style={{
                        transform: `perspective(1000px) rotateX(${leftPanelTilt.x}deg) rotateY(${leftPanelTilt.y}deg)`,
                        transition: 'transform 0.1s ease-out',
                    }}
                >
                    <div className="company-logo">
                        <img src="/logo.jpg" alt="Company Logo" />
                    </div>
                    <h1>Account Recovery Portal <FaRobot className="title-icon"/></h1>
                    <p className="subtitle">
                        Reset your access credentials. Your learning journey continues.
                    </p>
                    <div className="abstract-visual data-lines"></div>
                    <div className="left-panel-glow"></div>
                    <div className="geometric-pattern"></div>
                </div>

                {/* Right Panel - Recovery Form */}
                <div className="login-right" onMouseMove={handleRightMouseMove}>
                    <div
                        className="neon-aurora-spotlight"
                        style={{
                            left: mousePosition.x + "px",
                            top: mousePosition.y + "px",
                        }}
                    ></div>
                    <div className="glitch-overlay"></div>
                    
                    <div className="login-form">
                        <h2 className="mode-title">
                            {step === "request" ? "Recovery Request" : "Verification"}
                        </h2>
                        
                        {message && (
                            <p className={`auth-message ${message.includes('Success') || message.includes('sent') || message.includes('reset') ? 'success' : 'error'}`}>
                                {message}
                            </p>
                        )}

                        {/* STEP 1: Request OTP */}
                        {step === "request" && (
                            <form onSubmit={handleRequestOTP}>
                                <p className="info-text">
                                    Enter your registered email to receive a secure recovery code.
                                </p>
                                <NeonInput
                                    type="email"
                                    placeholder="Digital Email Address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    Icon={FaEnvelope}
                                />
                                <button className="btn-primary" type="submit" disabled={loading}>
                                    {loading ? <FaSpinner className="spinner" /> : "Send Recovery Code"}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: Verify & Reset Password */}
                        {step === "otp" && (
                            <form onSubmit={handleOTPVerification}>
                                <p className="info-text">
                                    Code sent to <strong>{email}</strong>
                                </p>
                                <NeonInput 
                                    type="email"
                                    value={email}
                                    placeholder="Registered Email"
                                    Icon={FaEnvelope}
                                    readOnly 
                                />
                                <NeonInput
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    Icon={FaKey}
                                />
                                <NeonInput
                                    type="password"
                                    placeholder="New Encrypted Key (Password)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    Icon={FaLock}
                                    showPasswordToggle={true}
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
                        )}

                        <div className="neon-divider glitch-divider"></div>

                        <div className="links">
                            <Link to="/login">Back to Login</Link>
                            <span className="link-separator"> | </span>
                            <Link to="/signup">Create Account</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* STYLES - Matching Login.js */}
            <style>{`
                /* NEON COLOR DEFINITIONS */
                :root {
                    --neon-color: #00FFFF;
                    --neon-alt-color: #FF00FF;
                    --dark-bg: #020C18;
                    --light-text: #E0F7FA;
                    --neon-shadow: 0 0 8px var(--neon-color), 0 0 25px var(--neon-color), 0 0 60px rgba(0,255,255,0.7);
                    --neon-shadow-small: 0 0 4px var(--neon-color), 0 0 12px var(--neon-color);
                    --success-color: #39FF14;
                    --error-color: #FF3366;
                }

                /* Base Container & Fonts */
                .login-container {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Share Tech Mono', monospace;
                    background: radial-gradient(circle at 15% 15%, #001f3f, var(--dark-bg));
                    overflow: hidden;
                    position: relative;
                }

                /* Left Panel - 3D Parallax Effect */
                .login-left {
                    flex: 1;
                    background: linear-gradient(135deg, #003366, #005f73, #009999, #00cccc);
                    background-size: 400% 400%;
                    animation: gradientMove 15s ease infinite alternate, neonFlicker 8s infinite alternate;
                    color: var(--light-text);
                    padding: 80px 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    z-index: 1;
                    text-shadow: 2px 2px 10px rgba(0,0,0,0.8);
                    border-right: 2px solid rgba(0,255,255,0.1);
                    perspective: 1000px;
                    transition: transform 0.1s ease-out;
                }

                .login-left h1 {
                    font-size: 48px;
                    margin-bottom: 20px;
                    color: var(--light-text);
                    text-shadow: 2px 2px 5px rgba(0,0,0,0.8);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    animation: textPulse 3s infinite;
                }

                .login-left .title-icon {
                    font-size: 40px;
                    filter: drop-shadow(0 0 10px var(--neon-color));
                    color: var(--neon-color);
                }

                .login-left .subtitle {
                    font-size: 20px;
                    color: rgba(224, 247, 250, 0.8);
                    line-height: 1.6;
                }

                .company-logo {
                    margin-bottom: 40px;
                    filter: drop-shadow(0 0 15px rgba(0,255,255, 0.6));
                    animation: floatLogo 6s ease-in-out infinite;
                }

                .company-logo img {
                    width: 220px;
                    height: 220px;
                    border-radius: 50%;
                    box-shadow: 0 0 20px rgba(0,255,255, 0.6);
                    border: 3px solid var(--neon-color);
                    animation: rotateGlow 10s linear infinite;
                }

                /* Abstract Visual Elements */
                .abstract-visual {
                    position: absolute;
                    opacity: 0.2;
                    z-index: -1;
                }
                .data-lines {
                    width: 150%;
                    height: 100%;
                    background:
                        linear-gradient(90deg, transparent 0%, rgba(0,255,255, 0.2) 50%, transparent 100%),
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 10px,
                            rgba(0,255,255, 0.1) 10px,
                            rgba(0,255,255, 0.1) 12px
                        );
                    transform: rotate(-5deg) translateX(-20%);
                    animation: dataFlow 20s linear infinite;
                }

                .left-panel-glow {
                    position: absolute;
                    bottom: -50px;
                    right: -50px;
                    width: 200px;
                    height: 200px;
                    background: rgba(0,255,255, 0.15);
                    border-radius: 50%;
                    filter: blur(60px);
                    animation: pulseGlow 5s infinite alternate;
                    z-index: -1;
                }

                /* Right Panel - Interactive & Glitch */
                .login-right {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                    background: radial-gradient(circle at 80% 80%, rgba(2, 12, 24, 0.8), var(--dark-bg));
                }
                
                .neon-aurora-spotlight {
                    position: absolute;
                    width: 400px;
                    height: 400px;
                    background: var(--neon-color);
                    border-radius: 50%;
                    opacity: 0.08;
                    filter: blur(120px);
                    pointer-events: none;
                    transform: translate(-50%, -50%);
                    transition: transform 0.08s ease-out;
                    z-index: 0;
                    animation: auroraPulse 4s infinite alternate;
                }
                
                .glitch-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 2;
                    animation: subtleGlitch 10s linear infinite;
                    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect x="0" y="0" width="100%" height="100%" fill="none" stroke="%2300FFFF" stroke-width="0.5" opacity="0.1"/></svg>');
                    background-repeat: repeat;
                    background-size: 20px 20px;
                }

                /* Form Card - Glassmorphism & Neon */
                .login-form {
                    width: 100%;
                    max-width: 420px;
                    padding: 45px;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(30px) saturate(150%);
                    -webkit-backdrop-filter: blur(30px) saturate(150%);
                    border-radius: 30px;
                    box-shadow: 0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 15px rgba(0,255,255,0.2);
                    border: 2px solid rgba(0, 255, 255, 0.25);
                    z-index: 3;
                    animation: fadeIn 1s ease forwards;
                    position: relative;
                }
                .login-form::before {
                    content: '';
                    position: absolute;
                    top: -2px; left: -2px; right: -2px; bottom: -2px;
                    background: linear-gradient(45deg, var(--neon-color), var(--neon-alt-color));
                    z-index: -1;
                    filter: blur(8px);
                    opacity: 0.4;
                    animation: formBorderGlow 3s infinite alternate;
                    border-radius: 30px;
                }

                .mode-title {
                    font-size: 38px;
                    color: var(--light-text);
                    text-shadow: none;
                    margin-bottom: 30px;
                    letter-spacing: 2px;
                    text-align: center;
                }

                .info-text {
                    text-align: center;
                    color: rgba(224, 247, 250, 0.7);
                    margin-bottom: 30px;
                    font-size: 15px;
                    line-height: 1.5;
                }

                /* Input Groups */
                .input-group {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.08);
                    border-radius: 15px;
                    padding: 14px 18px;
                    margin-bottom: 25px;
                    box-shadow: inset 0 3px 10px rgba(0,0,0,0.7);
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border: 1px solid rgba(0, 255, 255, 0.15);
                }

                .input-group-readonly {
                    opacity: 0.6;
                    pointer-events: none;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px dashed rgba(0, 255, 255, 0.1);
                }

                .input-group.focused {
                    background: rgba(0, 255, 255, 0.2);
                    box-shadow:
                        0 0 15px var(--neon-color),
                        0 0 40px var(--neon-color),
                        inset 0 0 12px rgba(0, 255, 255, 0.6);
                    border: 2px solid var(--neon-color);
                    transform: translateY(-2px);
                }
                
                .input-icon {
                    font-size: 18px;
                    margin-right: 15px;
                    filter: drop-shadow(0 0 5px var(--neon-color));
                    color: var(--neon-color);
                }

                .password-toggle-icon {
                    position: absolute;
                    right: 18px;
                    color: rgba(0,255,255, 0.7);
                    cursor: pointer;
                    transition: color 0.3s ease;
                    font-size: 16px;
                }
                .password-toggle-icon:hover {
                    color: var(--neon-color);
                    filter: drop-shadow(0 0 5px var(--neon-color));
                }

                .input-group input {
                    font-size: 17px;
                    background: transparent;
                    color: var(--light-text);
                    caret-color: var(--neon-color);
                    padding: 0;
                    border: none;
                    outline: none;
                    flex: 1;
                }
                .input-group input::placeholder {
                    color: rgba(224, 247, 250, 0.6);
                }

                /* Password Strength */
                .password-strength-container {
                    margin-bottom: 20px;
                }

                .password-strength-bar {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
                }

                .password-strength-fill {
                    height: 100%;
                    transition: width 0.4s ease, background-color 0.4s ease, box-shadow 0.4s ease;
                    border-radius: 4px;
                }

                .password-strength-text {
                    font-size: 13px;
                    font-weight: 600;
                    text-align: right;
                    transition: color 0.4s ease, text-shadow 0.4s ease;
                }

                /* Button - NEON BLOCK */
                .btn-primary {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    width: 100%;
                    padding: 16px;
                    background: var(--neon-color);
                    color: var(--dark-bg);
                    border: none;
                    border-radius: 15px;
                    font-size: 19px;
                    font-weight: 700;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    box-shadow: 0 0 20px var(--neon-color);
                    animation: neonPulse 2.5s infinite alternate;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 10px;
                }

                .btn-primary:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    animation: none;
                    box-shadow: 0 0 8px var(--neon-color);
                    background: #008080;
                }

                .btn-primary:hover:not(:disabled) {
                    background: #33ffff;
                    transform: translateY(-5px) scale(1.02);
                    box-shadow:
                        0 0 10px var(--neon-color),
                        0 0 45px var(--neon-color),
                        0 0 90px var(--neon-color);
                }

                .spinner {
                    animation: spin 1s linear infinite;
                    font-size: 20px;
                    color: var(--dark-bg);
                }

                /* Resend Button */
                .resend-container {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .btn-link {
                    background: none;
                    border: none;
                    color: rgba(224, 247, 250, 0.7);
                    cursor: pointer;
                    font-size: 15px;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    padding: 8px 12px;
                    border-radius: 8px;
                }

                .btn-link:hover:not(:disabled) {
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                    background: rgba(0,255,255,0.1);
                }

                .btn-link:disabled {
                    color: rgba(255, 255, 255, 0.3);
                    cursor: not-allowed;
                }

                /* Message */
                .auth-message {
                    margin-bottom: 20px;
                    padding: 12px;
                    border-radius: 10px;
                    font-weight: 600;
                    background: rgba(0, 0, 0, 0.4);
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border: 1px solid;
                }
                .auth-message.success {
                    color: var(--success-color);
                    border-color: var(--success-color);
                    text-shadow: 0 0 7px var(--success-color);
                }
                .auth-message.error {
                    color: var(--error-color);
                    border-color: var(--error-color);
                    text-shadow: 0 0 7px var(--error-color);
                    animation: glitchText 0.5s linear infinite alternate;
                }

                /* Neon Divider */
                .neon-divider {
                    height: 2px;
                    background: linear-gradient(to right, transparent, var(--neon-color), var(--neon-alt-color), var(--neon-color), transparent);
                    box-shadow: var(--neon-shadow-small);
                    margin: 30px 0 25px 0;
                    position: relative;
                    overflow: hidden;
                }
                .glitch-divider::before, .glitch-divider::after {
                    content: '';
                    position: absolute;
                    height: 100%;
                    width: 50%;
                    top: 0;
                    background: var(--dark-bg);
                    animation: dividerGlitch 5s infinite;
                }
                .glitch-divider::before { left: 0; animation-delay: 0s; }
                .glitch-divider::after { right: 0; animation-delay: 2.5s; }

                /* Links */
                .links { 
                    font-size: 15px;
                    text-align: center;
                }
                .links a { 
                    color: #90CAF9; 
                    text-decoration: none;
                    transition: 0.3s ease-in-out;
                    display: inline-block;
                    position: relative;
                }

                .link-separator { 
                    color: #4A4A4A; 
                    margin: 0 8px;
                    user-select: none;
                }

                .links a:hover,
                .links a:focus {
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                    transform: translateY(-2px) scale(1.05);
                    animation: linkGlow 1.5s infinite alternate;
                }

                .links a::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -4px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: var(--neon-color);
                    box-shadow: var(--neon-shadow-small);
                    transition: width 0.3s ease-in-out;
                }

                .links a:hover::after,
                .links a:focus::after {
                    width: 100%;
                }

                .links a:active {
                    color: #FF6E40;
                    transform: translateY(0) scale(0.95);
                    box-shadow: 0 0 2px #FF6E40 inset;
                    transition: 0.1s;
                    animation: none;
                }

                /* --- ANIMATIONS --- */
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(30px) scale(0.9); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes neonPulse {
                    0% { box-shadow: 0 0 20px var(--neon-color); }
                    100% { box-shadow: 0 0 10px var(--neon-color), 0 0 35px var(--neon-color); }
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes floatLogo {
                    0% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0); }
                }
                @keyframes rotateGlow {
                    0% { transform: rotate(0deg); box-shadow: 0 0 20px rgba(0,255,255, 0.6); }
                    50% { box-shadow: 0 0 30px rgba(0,255,255, 0.8), 0 0 10px rgba(255,255,255,0.4); }
                    100% { transform: rotate(360deg); box-shadow: 0 0 20px rgba(0,255,255, 0.6); }
                }
                @keyframes textPulse {
                    0% { color: var(--light-text); }
                    50% { color: #ffffff; }
                    100% { color: var(--light-text); }
                }
                @keyframes auroraPulse {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 0.08; }
                    50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.12; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.08; }
                }
                @keyframes subtleGlitch {
                    0% { transform: translate(0, 0); opacity: 0.8; }
                    20% { transform: translate(-2px, 2px); opacity: 0.9; }
                    40% { transform: translate(2px, -2px); opacity: 0.8; }
                    60% { transform: translate(-1px, 1px); opacity: 0.9; }
                    80% { transform: translate(1px, -1px); opacity: 0.8; }
                    100% { transform: translate(0, 0); opacity: 0.8; }
                }
                @keyframes glitchText {
                    0% { transform: translateX(0px); text-shadow: 0 0 5px var(--error-color); }
                    25% { transform: translateX(2px); text-shadow: 0 0 7px var(--error-color); }
                    50% { transform: translateX(-2px); text-shadow: 0 0 5px var(--error-color); }
                    75% { transform: translateX(1px); text-shadow: 0 0 7px var(--error-color); }
                    100% { transform: translateX(0px); text-shadow: 0 0 5px var(--error-color); }
                }
                @keyframes dividerGlitch {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10%); }
                    40% { transform: translateX(5%); }
                    60% { transform: translateX(-7%); }
                    80% { transform: translateX(3%); }
                }
                @keyframes linkGlow {
                    0% { text-shadow: var(--neon-shadow-small); }
                    100% { text-shadow: 0 0 5px var(--neon-color), 0 0 15px var(--neon-color); }
                }
                @keyframes formBorderGlow {
                    0% { opacity: 0.4; }
                    50% { opacity: 0.6; filter: blur(10px); }
                    100% { opacity: 0.4; }
                }
                @keyframes neonFlicker {
                    0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { background-position: 0% 50%; }
                    20%, 24%, 55% { background-position: 50% 50%; }
                }
                @keyframes dataFlow {
                    0% { background-position: 0 0; }
                    100% { background-position: 100% 0; }
                }
                @keyframes pulseGlow {
                    0% { transform: scale(1); opacity: 0.15; }
                    100% { transform: scale(1.2); opacity: 0.25; }
                }

                /* Responsive */
                @media (max-width: 992px) {
                    .login-left { padding: 60px 30px; }
                    .login-left h1 { font-size: 40px; }
                    .login-left .subtitle { font-size: 16px; }
                    .company-logo img { width: 180px; height: 180px; }
                    .login-form { max-width: 380px; padding: 35px; }
                    .mode-title { font-size: 34px; }
                    .input-group { padding: 12px 15px; }
                    .input-group input { font-size: 16px; }
                    .btn-primary { padding: 14px; font-size: 17px; }
                    .neon-aurora-spotlight { width: 300px; height: 300px; filter: blur(100px); }
                }

                @media (max-width: 768px) {
                    .login-container { flex-direction: column; }
                    .login-left {
                        min-height: 35vh;
                        padding: 40px 20px;
                        border-right: none;
                        border-bottom: 2px solid rgba(0,255,255,0.1);
                        transform: none !important;
                    }
                    .login-left h1 { font-size: 36px; gap: 10px;}
                    .login-left .subtitle { font-size: 15px; }
                    .company-logo { margin-bottom: 20px; text-align: center; }
                    .company-logo img { width: 150px; height: 150px; }
                    .abstract-visual { display: none; }

                    .login-right {
                        min-height: 65vh;
                        padding: 30px 20px;
                        align-items: flex-start;
                    }
                    .login-form {
                        max-width: 100%;
                        padding: 25px;
                        margin-top: 30px;
                    }
                    .neon-aurora-spotlight { display: none; }
                    .glitch-overlay { display: none; }
                    .login-form::before { display: none; }
                    .mode-title { font-size: 30px; margin-bottom: 30px; }
                    .input-group { margin-bottom: 20px; }
                    .neon-divider { margin: 20px 0; }
                }
            `}</style>
        </>
    );
};

export default ForgotPassword;