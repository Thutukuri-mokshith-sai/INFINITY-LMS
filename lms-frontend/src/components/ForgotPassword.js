import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaSpinner, FaEnvelope, FaLock, FaKey, FaQuestionCircle } from "react-icons/fa";

// --- Reusable Neon Input Component (Consistent across all forms) ---
const NeonInput = ({ type, placeholder, value, onChange, Icon, readOnly = false }) => {
    return (
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
};
// ----------------------------------------------------

// --- Custom Password Strength Meter Component (Consistent with Signup) ---
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
// ----------------------------------------------------

const ForgotPassword = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState("request"); // "request" | "otp"
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    
    // 💡 FIX: Replaced useState for otpTimer with useRef to avoid the ESLint warning 
    // and prevent potential infinite loops, since the timer ID is not used for rendering.
    const otpTimerRef = useRef(null);

    // Effect to handle the countdown timer
    useEffect(() => {
        if (countdown > 0) {
            // Clear any existing interval
            if (otpTimerRef.current) clearInterval(otpTimerRef.current);

            const timer = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            
            // Save the new timer ID to the ref
            otpTimerRef.current = timer;

            // Cleanup function runs on component unmount or before next effect run
            return () => clearInterval(timer); 

        } else if (countdown === 0 && otpTimerRef.current) {
            // Timer has finished, clear and reset ref
            clearInterval(otpTimerRef.current);
            otpTimerRef.current = null;
        }
    }, [countdown, step]); // Clean dependency array!

    const startCountdown = () => {
        setCountdown(60);
    };

    // Password strength logic
    const getPasswordStrength = () => {
        if (newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[\W_]/.test(newPassword)) {
            return { text: "Strong", color: "#10b981" }; 
        } else if (newPassword.length >= 6 && (/[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword))) {
            return { text: "Medium", color: "orange" };
        }
        return { text: "Weak", color: "red" };
    };

    // Request OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "OTP sent to your email.");
                setStep("otp");
                startCountdown();
            } else {
                setMessage(data.message || "Error requesting OTP.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Server error. Try again later.");
        }
    };

    // Verify OTP and reset password
    const handleOTPVerification = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "Password successfully reset! Redirecting to login...");
                // 💡 FIX: Clear interval using the ref
                if (otpTimerRef.current) clearInterval(otpTimerRef.current); 
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setMessage(data.message || "Password reset failed.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Server error. Try again later.");
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setLoading(true);
        setMessage("Requesting new OTP...");
        try {
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "New OTP sent!");
                startCountdown();
            } else {
                setMessage(data.message || "Failed to resend OTP.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Error resending OTP");
        }
    };

    return (
        <>
            <div className="forgot-container">
                {/* Left Panel - Information and Branding */}
                <div className="forgot-left">
                    <div className="company-logo">
                        <img src="/logo.png" alt="Company Logo" />
                    </div>
                    <h1>Account Recovery</h1>
                    <p>
                        We understand things happen. Use this secure, multi-step process to safely regain access to your learning portal.
                    </p>
                    <div className="left-panel-glow"></div> 
                </div>

                {/* Right Panel - Form Container */}
                <div className="forgot-right">
                    <div className="forgot-form">
                        
                        {/* -------------------- STEP 1: REQUEST OTP -------------------- */}
                        {step === "request" && (
                            <>
                                <h2><FaQuestionCircle className="step-icon" /> Account Recovery</h2>
                                <p className="info-text">
                                    Enter your **registered email** to receive a One-Time Password (OTP) for account verification.
                                </p>
                                <form onSubmit={handleRequestOTP}>
                                    <NeonInput
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        Icon={FaEnvelope}
                                    />
                                    
                                    <button className="btn-primary" type="submit" disabled={loading}>
                                        {loading ? <FaSpinner className="spinner" /> : "Send Recovery Code"}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* -------------------- STEP 2: VERIFY & RESET -------------------- */}
                        {step === "otp" && (
                            <>
                                <h2><FaKey className="step-icon" /> Reset Password</h2>
                                <p className="info-text">
                                    Code sent to **{email}**. Enter the code and your new password below.
                                </p>
                                <form onSubmit={handleOTPVerification}>
                                    <NeonInput 
                                        type="email" 
                                        value={email} 
                                        Icon={FaEnvelope} 
                                        readOnly 
                                    />
                                    <NeonInput
                                        type="text"
                                        placeholder="Enter the 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        Icon={FaKey}
                                    />
                                    <NeonInput
                                        type="password"
                                        placeholder="Set New Secure Password"
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

                        {/* Message and Links */}
                        {message && (
                            <p className="message-box" style={{ 
                                color: message.toLowerCase().includes("success") || message.toLowerCase().includes("sent") || message.toLowerCase().includes("reset") ? "var(--neon-color)" : "red" 
                            }}>
                                {message}
                            </p>
                        )}
                        
                        <div className="neon-divider"></div>

                        <div className="links">
                            <Link to="/login">Back to Login</Link>
                            <span className="link-separator"> | </span>
                            <Link to="/signup">Create a New Account</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style>{`
                /* NEON COLOR DEFINITIONS (Consistent) */
                :root {
                    --neon-color: #00FFFF; /* Electric Blue */
                    --dark-bg: #022c22;
                    --light-text: #ecfdf5;
                    --neon-shadow: 0 0 5px var(--neon-color), 0 0 10px var(--neon-color), 0 0 20px var(--neon-color);
                    --neon-shadow-small: 0 0 3px var(--neon-color), 0 0 6px var(--neon-color);
                    --accent-green: #10b981;
                }

                /* Container */
                .forgot-container {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Poppins', sans-serif;
                    background: radial-gradient(circle at 20% 20%, #064e3b, var(--dark-bg)); 
                }

                /* Left Panel - Consistent vibrant gradient */
                .forgot-left {
                    flex: 1;
                    background: linear-gradient(135deg, #064e3b, #065f46, var(--accent-green), #34d399);
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
                
                .company-logo {
                    margin-bottom: 30px;
                    filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
                }

                .company-logo img {
                    width: 200px;
                    height: 200px;
                    object-fit: contain;
                }

                /* Right Panel */
                .forgot-right {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    position: relative;
                }

                /* Form Card - Frosted Glass with Darker Base */
                .forgot-form {
                    width: 100%;
                    max-width: 400px;
                    padding: 35px; 
                    background: rgba(0, 0, 0, 0.5); 
                    backdrop-filter: blur(20px); 
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px; 
                    box-shadow: 0 0 25px rgba(0, 255, 255, 0.2); 
                    border: 1px solid rgba(0, 255, 255, 0.1);
                    animation: fadeIn 0.8s ease forwards;
                    z-index: 1; 
                }

                /* Heading */
                .forgot-form h2 {
                    text-align: center;
                    font-size: 28px;
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .step-icon {
                    margin-right: 10px;
                    font-size: 24px;
                }
                
                /* Info Text */
                .info-text {
                    color: #a7f3d0;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 14px;
                    padding: 0 10px;
                }
                .info-text strong {
                    color: var(--neon-color);
                    font-weight: 600;
                }

                /* Input Groups (Consistent) */
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
                    background: rgba(0, 0, 0, 0.4);
                }

                .input-icon {
                    color: var(--neon-color);
                    font-size: 16px;
                    margin-right: 12px;
                    filter: drop-shadow(0 0 2px var(--neon-color));
                }

                .input-group:focus-within {
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
                
                /* Password Strength Meter Styles (Consistent) */
                .password-strength-container {
                    margin-top: -10px;
                    margin-bottom: 25px;
                    text-align: left;
                    padding: 0 5px;
                }
                .password-strength-bar {
                    height: 5px;
                    background: rgba(236, 253, 245, 0.1);
                    border-radius: 5px;
                    overflow: hidden;
                    margin-bottom: 5px;
                }
                .password-strength-fill {
                    height: 100%;
                    transition: width 0.3s ease, background-color 0.3s ease;
                    box-shadow: 0 0 3px currentColor;
                }
                .password-strength-text {
                    font-size: 12px;
                    font-weight: 500;
                    transition: color 0.3s ease;
                }

                /* Button - NEON BLOCK (with Pulse) */
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
                    margin-top: 10px;
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
                
                /* Link Button for Resend OTP */
                .resend-container {
                    margin-top: 15px;
                    text-align: center;
                }
                .btn-link {
                    background: none;
                    border: none;
                    color: #d1fae5;
                    font-size: 14px;
                    cursor: pointer;
                    transition: color 0.3s, text-shadow 0.3s;
                    padding: 5px 10px;
                }
                .btn-link:hover:not(:disabled) {
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                }
                .btn-link:disabled {
                    color: #4b5563;
                    cursor: not-allowed;
                }


                @keyframes neonPulse {
                    0% { box-shadow: 0 0 15px var(--neon-color); }
                    100% { box-shadow: 0 0 5px var(--neon-color), 0 0 25px var(--neon-color); }
                }

                /* Spinner */
                .spinner {
                    animation: spin 1s linear infinite;
                    font-size: 18px;
                    color: var(--dark-bg);
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                /* Message Box */
                .message-box {
                    margin-top: 15px;
                    text-align: center;
                    font-weight: 500;
                    text-shadow: 0 0 5px currentColor;
                }

                /* Neon Divider */
                .neon-divider {
                    height: 1px;
                    background: linear-gradient(to right, transparent, var(--neon-color), transparent);
                    box-shadow: var(--neon-shadow-small);
                    margin: 25px 0 20px 0;
                }

                /* Links - NEON HOVER GLOW */
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

                /* --- Animations --- */
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes fadeIn {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .forgot-container {
                        flex-direction: column;
                    }
                    .forgot-left {
                        min-height: 30vh;
                        padding: 40px 20px;
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
        </>
    );
};

export default ForgotPassword;