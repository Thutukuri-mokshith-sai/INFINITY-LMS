import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaSpinner,
  FaLock,
  FaUserCircle,
  FaEnvelope,
  FaPhoneAlt,
  FaCheckCircle,
  FaAngleRight,
  FaRobot,
  FaKey,
  FaEye, FaEyeSlash,
  FaSignInAlt
} from "react-icons/fa";

// --- Reusable Neon Input Component (Simplified) ---
// Note: Removed validationStatus logic as it's less critical for the Login component
const NeonInput = ({ type, placeholder, value, onChange, Icon, isTyping, showPasswordToggle = false }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic Icon logic remains the same (Email/Phone for identifier)
  let ActiveIcon = Icon;
  if (Icon === FaUserCircle) {
    ActiveIcon = value.includes('@') ? FaEnvelope : (value && !isNaN(value.replace(/[^0-9]/g, '')) ? FaPhoneAlt : FaUserCircle);
  }

  const inputType = showPasswordToggle && showPassword ? "text" : type;

  return (
    <div
      className={`input-group ${isFocused ? 'focused' : ''}`}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      <ActiveIcon
        className="input-icon"
        style={{ animation: isTyping ? 'iconPulse 0.5s infinite alternate' : 'none' }}
      />
      <input
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
      {showPasswordToggle && (
        <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      )}
    </div>
  );
};
// ------------------------------------

const AuthScreen = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Enhanced Interactivity States
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [leftPanelTilt, setLeftPanelTilt] = useState({ x: 0, y: 0 });

  // --- Typing Indicator Effect ---
  useEffect(() => {
    const timeout = setTimeout(() => setIsTyping(false), 800);
    setIsTyping(true);
    return () => clearTimeout(timeout);
  }, [identifier, password]);


  // --- Consolidated Login Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = "https://lms-backend-foaq.onrender.com/api/auth/login";

      const payload = { identifier, password };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        login(data.token, data.user);
        // Redirect based on role
        if (data.user.role === "Teacher") {
          navigate("/Teacher");
        } else if (data.user.role === "Student") {
          navigate("/Student");
        } else {
          navigate("/dashboard"); // fallback
        }
      } else {
        setMessage(data.message || "Login failed. Invalid Digital ID or Encrypted Key.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error. The matrix is unstable. Try again later.");
      setLoading(false);
    }
  };

  // --- Aurora & Glitch Effects ---
  const handleRightMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // --- Left Panel 3D Tilt Effect ---
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
    setLeftPanelTilt({ x: 0, y: 0 }); // Reset tilt
  };

  // --- Navigation to Signup ---
  const handleNavigateToSignup = (e) => {
      e.preventDefault();
      // Apply a quick visual effect before navigation
      document.querySelector('.login-form').classList.add('mode-switch-glitch');
      setTimeout(() => {
          navigate('/signup'); // Direct navigation to the dedicated /signup route
      }, 300);
  };
  
  // --- Left Panel Content (Login specific) ---
  const getLeftPanelContent = () => (
    <>
      <h1>Welcome Back to the Grid! <FaRobot className="title-icon"/></h1>
      <p className="subtitle">
        Re-enter the learning matrix. Your knowledge awaits.
      </p>
      <div className="abstract-visual data-lines"></div>
    </>
  );

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
          {getLeftPanelContent()}
          <div className="left-panel-glow"></div>
          <div className="geometric-pattern"></div>
        </div>

        {/* Right Panel - Login Form */}
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
            <h2 className="mode-title">Access Portal</h2>
            
            <form onSubmit={handleSubmit}>
              <NeonInput
                type="text"
                placeholder="Digital ID (Email or Phone)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                Icon={FaUserCircle}
                isTyping={isTyping}
              />
              <NeonInput
                type="password"
                placeholder="Encrypted Key (Password)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                Icon={FaLock}
                isTyping={isTyping}
                showPasswordToggle={true}
              />

              <button className="btn-primary" type="submit" disabled={loading || !identifier || !password}>
                {loading
                  ? <FaSpinner className="spinner" />
                  : <><FaSignInAlt className="btn-icon-left" /> Login</>}
                {loading || <FaAngleRight className="btn-icon-right" />}
              </button>
            </form>

            {message && (
              <p className={`auth-message ${message.includes('Success') ? 'success' : 'error'}`}>
                {message.includes('Success') && <FaCheckCircle style={{marginRight: '8px'}} />}
                {message}
              </p>
            )}

            <div className="neon-divider glitch-divider"></div>

            <div className="links">
              {/* Use handleNavigateToSignup for external routing */}
              <Link to="/signup" onClick={handleNavigateToSignup}> Create Account</Link>
              <span className="link-separator"> | </span>
              <Link to="/forgot-password">Forgot Password</Link>
            </div>
          </div>
        </div>
      </div>

      {/* STYLES (Kept identical to preserve look and feel) */}
      <style>{`
        /* NEON COLOR DEFINITIONS */
        :root {
          --neon-color: #00FFFF; /* Electric Blue */
          --neon-alt-color: #FF00FF; /* Magenta for contrast/glitch */
          --dark-bg: #020C18; /* Deeper, more futuristic dark blue */
          --light-text: #E0F7FA; /* Lighter, subtle cyan text */
          --neon-shadow: 0 0 8px var(--neon-color), 0 0 25px var(--neon-color), 0 0 60px rgba(0,255,255,0.7); /* Even stronger glow */
          --neon-shadow-small: 0 0 4px var(--neon-color), 0 0 12px var(--neon-color);
          --success-color: #39FF14; /* Cyber green */
          --error-color: #FF3366; /* Neon red */
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

        /* Headings (Neon Removed) */
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
        .connection-nodes { /* Kept but unused in Login-only mode */
            width: 100%;
            height: 100%;
            background-image:
                radial-gradient(circle at 10% 20%, rgba(var(--neon-color), 0.3) 1px, transparent 1px),
                radial-gradient(circle at 80% 60%, rgba(var(--neon-color), 0.3) 1px, transparent 1px),
                radial-gradient(circle at 40% 90%, rgba(var(--neon-color), 0.3) 1px, transparent 1px);
            background-size: 20px 20px;
            animation: nodeConnect 15s linear infinite;
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
        
        /* Mode Switch Glitch Effect (used for navigation now) */
        .login-form.mode-switch-glitch {
             animation: formGlitchOut 0.3s forwards;
        }
        @keyframes formGlitchOut {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(0.98) skewX(2deg) translateY(5px); opacity: 0.5; filter: hue-rotate(90deg); }
            100% { transform: scale(1); opacity: 1; filter: hue-rotate(0deg); }
        }

        /* Mode Title (Neon Removed) */
        .mode-title {
          font-size: 38px;
          color: var(--light-text);
          text-shadow: none;
          margin-bottom: 40px;
          letter-spacing: 2px;
          text-align: center;
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
        
        .input-icon {
            font-size: 18px;
            margin-right: 15px;
            filter: drop-shadow(0 0 5px var(--neon-color));
            color: var(--neon-color);
            animation: none !important; /* Managed by React state */
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
        .glitch-divider::before { left: 0; animation-delay: 0s; }
        .glitch-divider::after { right: 0; animation-delay: 2.5s; }
/* Base Link Styles */
.links { 
  font-size: 15px; 
}
.links a { 
  /* Initial state */
  color: #90CAF9; 
  text-decoration: none; /* Good practice for modern links */
  transition: 0.3s ease-in-out; /* Smoother transition curve */
  display: inline-block; /* Required for transform to work well */
  position: relative; /* Needed for the ::after element for the underline effect */
}

/* Link Separator */
.link-separator { 
  color: #4A4A4A; 
  margin: 0 8px; 
  /* Add user-select: none to prevent accidental selection of the separator */
  user-select: none;
}

/* --- */

/* Hover & Focus Effects */

/* Styles for when the link is hovered over or focused (e.g., via keyboard navigation) */
.links a:hover,
.links a:focus {
  /* Existing transform and color/shadow */
  color: var(--neon-color);
  text-shadow: var(--neon-shadow-small);
  transform: translateY(-2px) scale(1.05); /* Added a slight scale-up */
  animation: linkGlow 1.5s infinite alternate;

  /* **NEW: Underline effect** */
  /* This creates a glowy line that appears/expands from the center */
}

/* Underline creation with ::after (Initial state) */
.links a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px; /* Position below the text */
  left: 50%; /* Start in the middle */
  transform: translateX(-50%);
  background: var(--neon-color);
  box-shadow: var(--neon-shadow-small);
  transition: width 0.3s ease-in-out;
}

/* Underline effect on Hover/Focus (Final state) */
.links a:hover::after,
.links a:focus::after {
  width: 100%; /* Expands to full width */
}

/* --- */

/* Active State Effect (When the link is being clicked/held down) */
.links a:active {
  color: #FF6E40; /* A distinct, warm color for a 'click' feedback */
  transform: translateY(0) scale(0.95); /* A slight 'press down' effect */
  box-shadow: 0 0 2px #FF6E40 inset; /* Subtle inner shadow */
  transition: 0.1s; /* Faster transition for an immediate feedback */
  animation: none; /* Stop the glow animation briefly */
}

/* --- */

/* Keyframe for the Neon Glow (Needed for the existing animation to work) */
@keyframes linkGlow {
  from {
    text-shadow: var(--neon-shadow-small);
  }
  to {
    text-shadow: var(--neon-shadow-large);
  }
}
        /* --- ANIMATIONS (Kept identical) --- */
        @keyframes horizontalShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        @keyframes popIn {
            0% { transform: scale(0.5) rotate(-45deg); opacity: 0; }
            80% { transform: scale(1.1) rotate(5deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); }
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
            0% { text-shadow: none; }
            100% { text-shadow: 0 0 5px var(--neon-color); }
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
        @keyframes nodeConnect {
            0% { background-position: 0 0; }
            100% { background-position: 200px 200px; }
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

export default AuthScreen;