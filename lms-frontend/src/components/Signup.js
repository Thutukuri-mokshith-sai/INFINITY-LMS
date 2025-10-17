import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaSpinner, 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaCheckCircle, 
  FaUsers, 
  FaKey, 
  FaMobileAlt, 
  FaGlobe,
  FaAngleRight,
  FaRobot,
  FaEye,
  FaEyeSlash,
  FaUserPlus
} from "react-icons/fa";

const BASE_URL = "https://lms-backend-foaq.onrender.com";

// --- Enhanced Neon Input Component ---
const NeonInput = ({ type, placeholder, value, onChange, Icon, readOnly = false, maxLength, showPasswordToggle = false, isTyping }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputType = showPasswordToggle && showPassword ? "text" : type;

  return (
    <div
      className={`input-group ${isFocused ? 'focused' : ''} ${readOnly ? 'input-group-readonly' : ''}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <Icon
        className="input-icon"
        style={{ animation: isTyping ? 'iconPulse 0.5s infinite alternate' : 'none' }}
      />
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={!readOnly}
        readOnly={readOnly}
        maxLength={maxLength}
      />
      {showPasswordToggle && (
        <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      )}
    </div>
  );
};

// --- Country Dropdown Component ---
const CountryCodeDropdown = ({ value, onChange, Icon, isTyping }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2')
      .then(response => response.json())
      .then(data => {
        const sorted = data
          .filter(country => country.idd.root)
          .sort((a, b) => a.name.common.localeCompare(b.name.common))
          .map(country => ({
            code: country.cca2,
            name: country.name.common,
            dialCode: `${country.idd.root}${country.idd.suffixes ? country.idd.suffixes[0] : ''}`
          }));
        setCountries(sorted);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching countries:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div
      className={`input-group ${isFocused ? 'focused' : ''}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <Icon
        className="input-icon"
        style={{ animation: isTyping ? 'iconPulse 0.5s infinite alternate' : 'none' }}
      />
      <select
        className="country-select"
        value={value}
        onChange={onChange}
        required
        disabled={loading}
      >
        <option value="">{loading ? 'Loading...' : 'Country Code'}</option>
        {countries.map(country => (
          <option key={country.code} value={country.dialCode}>
            {country.name} ({country.dialCode})
          </option>
        ))}
      </select>
    </div>
  );
};

// --- Password Strength Meter ---
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

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [tempUserIdentifier, setTempUserIdentifier] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpTimer, setOtpTimer] = useState(null);
  
  // Enhanced Interactivity States
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [leftPanelTilt, setLeftPanelTilt] = useState({ x: 0, y: 0 });

  // Typing Indicator Effect
  useEffect(() => {
    const timeout = setTimeout(() => setIsTyping(false), 800);
    setIsTyping(true);
    return () => clearTimeout(timeout);
  }, [name, email, password, countryCode, phoneNumber, otp]);

  // Countdown Timer
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
  }, [countdown, step]);

  const startCountdown = () => setCountdown(60);

  const getPasswordStrength = () => {
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[\W_]/.test(password)) {
      return { text: "Strong", color: "#10b981" };
    } else if (password.length >= 6 && (/[A-Z]/.test(password) || /[0-9]/.test(password))) {
      return { text: "Medium", color: "orange" };
    }
    return { text: "Weak", color: "red" };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!countryCode || !phoneNumber) {
      setMessage("Please enter both country code and phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, countryCode, phoneNumber }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage(data.message || "OTP sent to your email for verification.");
        setTempUserIdentifier(email);
        setStep("otp");
        startCountdown();
      } else {
        setMessage(data.message || "Signup failed.");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessage("Network error. The matrix is unstable. Try again later.");
    }
  };

  const handleOTP = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!tempUserIdentifier) {
      setMessage("Error: Registration state lost. Please try signing up again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: tempUserIdentifier, otp }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage(data.message || "Verification successful! Redirecting...");
        if (otpTimer) clearInterval(otpTimer);
        login(data.token, data.user);

        if (data.user.role === "Teacher") {
          navigate("/Teacher");
        } else if (data.user.role === "Student") {
          navigate("/Student");
        } else {
          navigate("/dashboard");
        }
      } else {
        setMessage(data.message || "OTP verification failed.");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      setMessage("Network error. Try again later.");
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setMessage("Requesting new OTP...");

    if (!tempUserIdentifier) {
      setMessage("Cannot resend. User email state is missing. Please return to signup.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: tempUserIdentifier, purpose: 'Account Verification' }),
      });
      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        setMessage(data.message || "New OTP sent to your email!");
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

  // Aurora & Glitch Effects
  const handleRightMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Left Panel 3D Tilt Effect
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

  const handleNavigateToLogin = (e) => {
    e.preventDefault();
    document.querySelector('.signup-form').classList.add('mode-switch-glitch');
    setTimeout(() => {
      navigate('/login');
    }, 300);
  };

  return (
    <>
      <div className="signup-container">
        {/* Left Panel - 3D Parallax Effect */}
        <div
          className="signup-left"
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
          <h1>Join the Future Grid! <FaRobot className="title-icon" /></h1>
          <p className="subtitle">
            Register today to unlock courses, track your progress, and connect with peers.
          </p>
          <div className="abstract-visual data-lines"></div>
          <div className="left-panel-glow"></div>
          <div className="geometric-pattern"></div>
        </div>

        {/* Right Panel - Form */}
        <div className="signup-right" onMouseMove={handleRightMouseMove}>
          <div
            className="neon-aurora-spotlight"
            style={{
              left: mousePosition.x + "px",
              top: mousePosition.y + "px",
            }}
          ></div>
          <div className="glitch-overlay"></div>

          <div className="signup-form">
            {step === "signup" && (
              <>
                <h2 className="mode-title">Create Portal Access</h2>
                <form onSubmit={handleSignup}>
                  <NeonInput
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    Icon={FaUser}
                    isTyping={isTyping}
                  />
                  <NeonInput
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    Icon={FaEnvelope}
                    isTyping={isTyping}
                  />
                  
                    <CountryCodeDropdown
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      Icon={FaGlobe}
                      isTyping={isTyping}
                    />
                    <NeonInput
                      type="tel"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      Icon={FaMobileAlt}
                      isTyping={isTyping}
                    />

                  <NeonInput
                    type="password"
                    placeholder="Choose Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    Icon={FaLock}
                    showPasswordToggle={true}
                    isTyping={isTyping}
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
                    {loading ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      <><FaUserPlus className="btn-icon-left" /> Sign Up & Verify</>
                    )}
                    {loading || <FaAngleRight className="btn-icon-right" />}
                  </button>
                </form>
              </>
            )}

            {step === "otp" && (
              <>
                <h2 className="mode-title">OTP Verification</h2>
                <p className="otp-info-text">
                  A one-time password has been sent to <strong>{tempUserIdentifier}</strong>
                </p>
                <form onSubmit={handleOTP}>
                  <NeonInput
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    Icon={FaKey}
                    maxLength={6}
                    isTyping={isTyping}
                  />

                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? (
                      <FaSpinner className="spinner" />
                    ) : (
                      <><FaCheckCircle className="btn-icon-left" /> Verify & Complete</>
                    )}
                    {loading || <FaAngleRight className="btn-icon-right" />}
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

            {message && (
              <p className={`auth-message ${message.includes('Success') || message.includes('sent') || message.includes('Redirecting') ? 'success' : 'error'}`}>
                {(message.includes('Success') || message.includes('sent') || message.includes('Redirecting')) && <FaCheckCircle style={{ marginRight: '8px' }} />}
                {message}
              </p>
            )}

            <div className="neon-divider glitch-divider"></div>

            <div className="links">
              <Link to="/login" onClick={handleNavigateToLogin}>Already have an account? Login</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ENHANCED STYLES */}
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
        .signup-container {
          display: flex;
          min-height: 100vh;
          font-family: 'Share Tech Mono', monospace;
          background: radial-gradient(circle at 15% 15%, #001f3f, var(--dark-bg));
          overflow: hidden;
          position: relative;
        }

        /* Left Panel - 3D Parallax Effect */
        .signup-left {
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

        .signup-left h1 {
          font-size: 48px;
          margin-bottom: 20px;
          color: var(--light-text);
          text-shadow: 2px 2px 5px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          gap: 15px;
          animation: textPulse 3s infinite;
        }

        .signup-left .title-icon {
          font-size: 40px;
          filter: drop-shadow(0 0 10px var(--neon-color));
          color: var(--neon-color);
        }

        .signup-left .subtitle {
          font-size: 20px;
          color: rgba(var(--light-text), 0.8);
          line-height: 1.6;
        }

        .company-logo {
          margin-bottom: 40px;
          filter: drop-shadow(0 0 15px rgba(var(--neon-color), 0.6));
          animation: floatLogo 6s ease-in-out infinite;
        }

        .company-logo img {
          width: 220px;
          height: 220px;
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(var(--neon-color), 0.6);
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
            linear-gradient(90deg, transparent 0%, rgba(var(--neon-color), 0.2) 50%, transparent 100%),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 10px,
              rgba(var(--neon-color), 0.1) 10px,
              rgba(var(--neon-color), 0.1) 12px
            );
          transform: rotate(-5deg) translateX(-20%);
          animation: dataFlow 20s linear infinite;
        }

        /* Right Panel - Interactive & Glitch */
        .signup-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at 80% 80%, rgba(var(--dark-bg), 0.8), var(--dark-bg));
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
        .signup-form {
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

        .signup-form::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, var(--neon-color), var(--neon-alt-color));
          z-index: -1;
          filter: blur(8px);
          opacity: 0.4;
          animation: formBorderGlow 3s infinite alternate;
          border-radius: 30px;
        }

        .signup-form.mode-switch-glitch {
          animation: formGlitchOut 0.3s forwards;
        }

        .mode-title {
          font-size: 38px;
          color: var(--light-text);
          text-shadow: none;
          margin-bottom: 40px;
          letter-spacing: 2px;
          text-align: center;
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

        .input-group.focused {
          background: rgba(0, 255, 255, 0.2);
          box-shadow:
            0 0 15px var(--neon-color),
            0 0 40px var(--neon-color),
            inset 0 0 12px rgba(0, 255, 255, 0.6);
          border: 2px solid var(--neon-color);
          transform: translateY(-2px);
        }

        .input-group-readonly {
          opacity: 0.7;
          background: rgba(0, 0, 0, 0.4);
        }

        .input-icon {
          font-size: 18px;
          margin-right: 15px;
          filter: drop-shadow(0 0 5px var(--neon-color));
          color: var(--neon-color);
          animation: none !important;
        }

        .password-toggle-icon {
          position: absolute;
          right: 18px;
          color: rgba(var(--neon-color), 0.7);
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
          color: rgba(var(--light-text), 0.6);
        }

        /* Phone Input Group */
        .phone-input-group {
          display: grid;
          grid-template-columns: 1.2fr 1.8fr;
          gap: 15px;
          margin-bottom: 25px;
        }

        .phone-input-group .input-group {
          margin-bottom: 0;
        }

        /* Select Styling */
        .role-select, .country-select {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          border: none;
          outline: none;
          flex: 1;
          font-size: 17px;
          background: transparent;
          color: var(--light-text);
          padding-right: 10px;
          cursor: pointer;
          line-height: 1.5;
        }

        .role-select option, .country-select option {
          color: var(--dark-bg);
          background: var(--light-text);
        }

        .role-select option[value=""], .country-select option[value=""] {
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
        }

        .btn-icon-left {
          font-size: 18px;
          margin-right: -4px;
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

        .btn-icon-right {
          font-size: 18px;
          margin-left: 8px;
          animation: floatRight 1.5s infinite ease-in-out;
        }

        .spinner {
          animation: spin 1s linear infinite;
          font-size: 20px;
          color: var(--dark-bg);
        }

        /* Resend Button */
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

        /* Message */
        .auth-message {
          margin-top: 20px;
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

        .glitch-divider::before {
          left: 0;
          animation-delay: 0s;
        }

        .glitch-divider::after {
          right: 0;
          animation-delay: 2.5s;
        }

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
        @keyframes formGlitchOut {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.98) skewX(2deg) translateY(5px); opacity: 0.5; filter: hue-rotate(90deg); }
          100% { transform: scale(1); opacity: 1; filter: hue-rotate(0deg); }
        }

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

        @keyframes iconPulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.15); opacity: 0.8; filter: drop-shadow(0 0 8px var(--neon-color)); }
        }

        @keyframes floatRight {
          0% { transform: translateX(0); }
          50% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }

        @keyframes floatLogo {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }

        @keyframes rotateGlow {
          0% { transform: rotate(0deg); box-shadow: 0 0 20px rgba(var(--neon-color), 0.6); }
          50% { box-shadow: 0 0 30px rgba(var(--neon-color), 0.8), 0 0 10px rgba(255,255,255,0.4); }
          100% { transform: rotate(360deg); box-shadow: 0 0 20px rgba(var(--neon-color), 0.6); }
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
          100% { text-shadow: var(--neon-shadow); }
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

        /* Responsive */
        @media (max-width: 992px) {
          .signup-left { padding: 60px 30px; }
          .signup-left h1 { font-size: 40px; }
          .signup-left .subtitle { font-size: 16px; }
          .company-logo img { width: 180px; height: 180px; }
          .signup-form { max-width: 380px; padding: 35px; }
          .mode-title { font-size: 34px; }
          .input-group { padding: 12px 15px; }
          .input-group input { font-size: 16px; }
          .btn-primary { padding: 14px; font-size: 17px; }
          .neon-aurora-spotlight { width: 300px; height: 300px; filter: blur(100px); }
        }

        @media (max-width: 768px) {
          .signup-container { flex-direction: column; }
          .signup-left {
            min-height: 35vh;
            padding: 40px 20px;
            border-right: none;
            border-bottom: 2px solid rgba(0,255,255,0.1);
            transform: none !important;
          }
          .signup-left h1 { font-size: 36px; gap: 10px; }
          .signup-left .subtitle { font-size: 15px; }
          .company-logo { margin-bottom: 20px; text-align: center; }
          .company-logo img { width: 150px; height: 150px; }
          .abstract-visual { display: none; }

          .signup-right {
            min-height: 65vh;
            padding: 30px 20px;
            align-items: flex-start;
          }
          .signup-form {
            max-width: 100%;
            padding: 25px;
            margin-top: 30px;
          }
          .neon-aurora-spotlight { display: none; }
          .glitch-overlay { display: none; }
          .signup-form::before { display: none; }
          .mode-title { font-size: 30px; margin-bottom: 30px; }
          .input-group { margin-bottom: 20px; }
          .phone-input-group {
            grid-template-columns: 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }
          .phone-input-group .input-group {
            margin-bottom: 0;
          }
          .neon-divider { margin: 20px 0; }
        }
      `}</style>
    </>
  );
};

export default Signup;