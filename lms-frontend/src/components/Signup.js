import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaSpinner, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaUsers, FaKey } from "react-icons/fa";

// --- Reusable Neon Input Component (Same as Login) ---
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

// --- Custom Password Strength Meter Component ---
const PasswordStrengthMeter = ({ strength }) => {
    let color = 'rgba(236, 253, 245, 0.4)';
    let width = '33.3%';
    if (strength.text === 'Medium') {
        color = 'orange';
        width = '66.6%';
    } else if (strength.text === 'Strong') {
        color = '#10b981'; // A strong green for the "Strong" status
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


const Signup = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [step, setStep] = useState("signup"); // "signup" or "otp"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [otpTimer, setOtpTimer] = useState(null);

// Effect to handle the countdown timer
    useEffect(() => {
        if (countdown > 0) {
            if (otpTimer) clearInterval(otpTimer);
            const timer = setInterval(() => {
                setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            setOtpTimer(timer);
            return () => clearInterval(timer);
        } else if (countdown === 0 && otpTimer) {
            clearInterval(otpTimer);
            setOtpTimer(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countdown, step]); // Rerun effect when countdown or step changes
    
    const startCountdown = () => {
        setCountdown(60);
    };

    // Password strength logic
    const getPasswordStrength = () => {
        if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[\W_]/.test(password)) {
            return { text: "Strong", color: "#10b981" }; // Green
        } else if (password.length >= 6 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
            return { text: "Medium", color: "orange" };
        }
        return { text: "Weak", color: "red" };
    };

    // Signup form submission
    const handleSignup = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "OTP sent to your email.");
                setStep("otp");
                startCountdown();
            } else {
                setMessage(data.message || "Signup failed.");
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
            setMessage("Server error. Try again later.");
        }
    };

    // OTP verification - MODIFIED
    const handleOTP = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            setLoading(false);

            if (res.ok) {
                setMessage(data.message || "Verification successful! Redirecting...");
                
                // Clear timer if verification succeeds
                if (otpTimer) clearInterval(otpTimer); 
                
                // Auto log in
                login(data.token, data.user); 

                // --- ROLE-BASED REDIRECTION LOGIC ---
                if (data.user.role === "Teacher") {
                    navigate("/Teacher");
                } else if (data.user.role === "Student") {
                    navigate("/Student");
                } else {
                    navigate("/dashboard"); // fallback
                }
                // --- END ROLE-BASED REDIRECTION LOGIC ---

            } else {
                setMessage(data.message || "OTP verification failed.");
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
            <div className="signup-container">
                {/* Left Panel - Consistent vibrant gradient */}
                <div className="signup-left">
                    <div className="company-logo">
                        <img src="/logo.png" alt="Company Logo" />
                    </div>
                    <h1>Join the Future of Learning.</h1>
                    <p>Register today to unlock courses, track your progress, and connect with peers.</p>
                </div>

                {/* Right Panel - Form Container */}
                <div className="signup-right">
                    <div className="signup-form">
                        
                        {/* -------------------- STEP 1: SIGNUP FORM -------------------- */}
                        {step === "signup" && (
                            <>
                                <h2><FaCheckCircle className="step-icon" /> Account Details</h2>
                                <form onSubmit={handleSignup}>
                                    <NeonInput
                                        type="text"
                                        placeholder="Full Name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        Icon={FaUser}
                                    />
                                    <NeonInput
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        Icon={FaEnvelope}
                                    />
                                    <NeonInput
                                        type="password"
                                        placeholder="Choose Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        Icon={FaLock}
                                    />
                                    <PasswordStrengthMeter strength={getPasswordStrength()} />
                                    
                                    <div className="input-group">
                                        <FaUsers className="input-icon" />
                                        <select 
                                            className="role-select" 
                                            value={role} 
                                            onChange={(e) => setRole(e.target.value)} 
                                            required
                                        >
                                            <option value="" disabled>Select Role (Student/Teacher)</option>
                                            <option value="Student">Student</option>
                                            <option value="Teacher">Teacher</option>
                                        </select>
                                    </div>

                                    <button className="btn-primary" type="submit" disabled={loading || !role}>
                                        {loading ? <FaSpinner className="spinner" /> : "Sign Up & Verify"}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* -------------------- STEP 2: OTP VERIFICATION -------------------- */}
                        {step === "otp" && (
                            <>
                                <h2><FaKey className="step-icon" /> OTP Verification</h2>
                                <p className="otp-info-text">A one-time password has been sent to **{email}**</p>
                                <form onSubmit={handleOTP}>
                                    <NeonInput 
                                        type="text"
                                        placeholder="OTP sent to your email"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        Icon={FaKey}
                                    />
                                    
                                    <button className="btn-primary" type="submit" disabled={loading}>
                                        {loading ? <FaSpinner className="spinner" /> : "Verify & Complete"}
                                    </button>
                                    
                                    <div className="resend-container">
                                        <button 
                                            type="button" 
                                            className="btn-link"
                                            disabled={countdown > 0 || loading} 
                                            onClick={handleResendOTP}
                                        >
                                            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}

                        {/* Message and Links */}
                        {message && (
                            <p className="message-box" style={{ 
                                color: message.toLowerCase().includes("success") || message.toLowerCase().includes("sent") || message.toLowerCase().includes("redirecting") ? "var(--neon-color)" : "red" 
                            }}>
                                {message}
                            </p>
                        )}
                        
                        <div className="neon-divider"></div>

                        <div className="links">
                            <Link to="/login">Already have an account? Login</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Styles */}
            <style>{`
                /* NEON COLOR DEFINITIONS */
                :root {
                    --neon-color: #00FFFF; /* Electric Blue */
                    --dark-bg: #022c22;
                    --light-text: #ecfdf5;
                    --neon-shadow: 0 0 5px var(--neon-color), 0 0 10px var(--neon-color), 0 0 20px var(--neon-color);
                    --neon-shadow-small: 0 0 3px var(--neon-color), 0 0 6px var(--neon-color);
                    --accent-green: #10b981;
                }

                /* Container */
                .signup-container {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Poppins', sans-serif;
                    background: radial-gradient(circle at 80% 80%, #064e3b, var(--dark-bg));
                }

                /* Left Panel - Consistent with Login */
                .signup-left {
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

                .signup-left h1 {
                    font-size: 36px;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                }
                
                .company-logo {
                    margin-bottom: 30px;
                    filter: drop-shadow(0 0 8px rgba(255,255,255,0.5));
                }

                .company-logo img {
                    width: 200px;
                    max-height: 200px;
                    object-fit: contain;
                }

                /* Right Panel */
                .signup-right {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    position: relative;
                }

                /* Form Card - Frosted Glass with Darker Base */
                .signup-form {
                    width: 100%;
                    max-width: 400px;
                    padding: 35px; 
                    background: rgba(0, 0, 0, 0.5); 
                    backdrop-filter: blur(20px); 
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 20px; 
                    box-shadow: 0 0 25px rgba(0, 255, 255, 0.2); 
                    border: 1px solid rgba(0, 255, 255, 0.1);
                    z-index: 1; 
                    animation: fadeIn 0.8s ease forwards;
                }

                /* Heading */
                .signup-form h2 {
                    text-align: center;
                    font-size: 28px;
                    color: var(--neon-color);
                    text-shadow: var(--neon-shadow-small);
                    margin-bottom: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .step-icon {
                    margin-right: 10px;
                    font-size: 24px;
                }
                
                /* OTP Info Text */
                .otp-info-text {
                    color: var(--light-text);
                    text-align: center;
                    margin-bottom: 20px;
                    font-size: 14px;
                    padding: 0 10px;
                }
                .otp-info-text strong {
                    color: var(--neon-color);
                    font-weight: 600;
                }

                /* Input Groups (Reused from Login) */
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
                
                /* Select Role Styling */
                .role-select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 16px; 
                    background: transparent;
                    color: var(--light-text);
                    padding-right: 10px;
                    cursor: pointer;
                }
                .role-select option {
                    color: var(--dark-bg); /* Dark background text */
                    background: var(--light-text); /* Light option background */
                }
                .role-select option[value=""] {
                    color: rgba(2, 44, 34, 0.7);
                }

                /* Password Strength Meter */
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
                    .signup-container {
                        flex-direction: column;
                    }
                    .signup-left {
                        min-height: 35vh;
                        padding: 40px 20px;
                    }
                    .signup-right {
                        flex: unset;
                        width: 100%;
                        min-height: 65vh;
                    }
                    .signup-form {
                        max-width: 90%;
                        padding: 25px;
                    }
                }
            `}</style>
        </>
    );
};

export default Signup;