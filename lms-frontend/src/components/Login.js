import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// FaUserCircle is used for the generic identifier (Email or Phone)
import { FaSpinner, FaLock, FaUserCircle } from "react-icons/fa"; 

// --- Reusable Neon Input Component ---
const NeonInput = ({ type, placeholder, value, onChange, Icon }) => {
  return (
    <div className="input-group">
      <Icon className="input-icon" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
};
// ------------------------------------

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // STATE CHANGE: Renamed 'email' to 'identifier' to allow login via email or phone
  const [identifier, setIdentifier] = useState(""); 
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); 

  // Mouse move handler for the aurora effect
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("https://lms-portal-backend-h5k8.onrender.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // LOGIC CHANGE: Send 'identifier' instead of 'email'
        body: JSON.stringify({ identifier, password }), 
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
        setMessage(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error. Try again later.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        {/* Left Panel */}
        <div className="login-left">
          <div className="company-logo">
            <img src="/logo.png" alt="Company Logo" />
          </div>
          <h1>Welcome Back!</h1>
          <p>
            Access your account and continue your learning journey seamlessly.
          </p>
          <div className="left-panel-glow"></div> {/* Extra glow element */}
        </div>

        {/* Right Panel */}
        <div className="login-right" onMouseMove={handleMouseMove}>
          {/* Mouse-following Aurora Light */}
          <div
            className="neon-aurora-spotlight"
            style={{
              left: mousePosition.x + "px",
              top: mousePosition.y + "px",
            }}
          ></div>
          
          <div className="login-form">
            <h2>LMS Login</h2>
            <form onSubmit={handleSubmit}>
              <NeonInput
                // Input type changed to 'text' to accommodate phone number
                type="text" 
                placeholder="Email or Phone Number"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)} 
                // Icon changed to a generic user icon
                Icon={FaUserCircle} 
              />
              <NeonInput
                type="password"
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                Icon={FaLock}
              />

              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : "Secure Login"}
              </button>
            </form>

            {message && (
              <p
                style={{
                  color: "var(--neon-color)",
                  marginTop: "15px",
                  textShadow: "0 0 5px var(--neon-color)",
                  textAlign: "center"
                }}
              >
                {message}
              </p>
            )}

            {/* Neon Divider */}
            <div className="neon-divider"></div>

            <div className="links">
              <Link to="/signup">Create Account</Link>
              <span className="link-separator"> | </span>
              <Link to="/forgot-password">Forgot Password?</Link>
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
        }

        /* Container */
        .login-container {
          display: flex;
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
          background: radial-gradient(circle at 20% 20%, #064e3b, var(--dark-bg));
        }

        /* Left Panel */
        .login-left {
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

        .login-left h1 {
          font-size: 36px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        /* Left Panel Decorative Glow */
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
        
        @keyframes pulseGlow {
            0% { transform: scale(1); opacity: 0.2; }
            100% { transform: scale(1.2); opacity: 0.4; }
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

        /* Right Panel */
        .login-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
          position: relative;
          overflow: hidden; /* Crucial for containing the spotlight */
        }
        
        /* Mouse-following Aurora Spotlight */
        .neon-aurora-spotlight {
            position: absolute;
            width: 300px;
            height: 300px;
            background: var(--neon-color);
            border-radius: 50%;
            opacity: 0.05;
            filter: blur(80px);
            pointer-events: none; /* Allows clicks to pass through */
            transform: translate(-50%, -50%);
            transition: width 0.3s ease, height 0.3s ease;
            z-index: 0;
        }


        /* Form Card */
        .login-form {
          width: 100%;
          max-width: 380px;
          padding: 35px; /* Slightly more padding */
          background: rgba(0, 0, 0, 0.5); 
          backdrop-filter: blur(20px); /* Increased blur */
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px; /* Slightly more rounded */
          box-shadow: 0 0 25px rgba(0, 255, 255, 0.2); 
          border: 1px solid rgba(0, 255, 255, 0.1);
          z-index: 1; /* Keep form above spotlight */
          animation: fadeIn 0.8s ease forwards;
        }

        /* Heading - NEON GLOW */
        .login-form h2 {
          text-align: center;
          font-size: 32px; /* Bigger heading */
          color: var(--neon-color);
          text-shadow: var(--neon-shadow);
          margin-bottom: 30px;
        }

        /* Input Groups */
        .input-group {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 15px; /* Increased padding */
          margin-bottom: 20px;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.6);
          transition: all 0.3s ease;
          border: 1px solid rgba(0, 255, 255, 0.1);
        }

        /* Input Icon */
        .input-icon {
            color: var(--neon-color);
            font-size: 16px;
            margin-right: 12px;
            filter: drop-shadow(0 0 2px var(--neon-color));
        }

        /* Input Focus - INTENSE NEON GLOW */
        .input-group:focus-within {
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 
            0 0 10px var(--neon-color), 
            0 0 25px var(--neon-color), 
            inset 0 0 10px rgba(0, 255, 255, 0.5); /* Inner glow */
          border: 1px solid var(--neon-color);
        }

        .input-group input {
          border: none;
          outline: none;
          flex: 1;
          padding-left: 0;
          font-size: 16px; /* Bigger font */
          background: transparent;
          color: var(--light-text);
          caret-color: var(--neon-color);
        }
        .input-group input::placeholder {
            color: rgba(236, 253, 245, 0.5);
        }

        /* Button - NEON BLOCK (with Pulse) */
        .btn-primary {
          width: 100%;
          padding: 14px; /* Bigger button */
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
          animation: neonPulse 2s infinite alternate; /* New pulse animation */
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

        /* --- Existing Animations (Kept) --- */
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
          .login-container {
            flex-direction: column;
          }
          .login-left {
            min-height: 35vh;
            padding: 40px 20px;
          }
          .login-right {
            flex: unset;
            width: 100%;
            min-height: 65vh;
          }
          .login-form {
            max-width: 90%;
            padding: 25px;
          }
          .neon-aurora-spotlight {
              display: none; /* Hide for performance on small devices */
          }
        }
      `}</style>
    </>
  );
};

export default Login;