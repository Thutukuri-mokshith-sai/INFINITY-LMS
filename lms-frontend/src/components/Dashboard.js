import React from "react";
import { useAuth } from "../context/AuthContext";
import { FaUserCircle, FaIdCard, FaEnvelope, FaToolbox, FaSignOutAlt } from "react-icons/fa";

const Dashboard = () => {
  const { name, email, userId, role, logout } = useAuth();

  return (
    <>
      <div className="dashboard-container-neon">
        <div className="profile-card-neon">
          <FaUserCircle className="profile-icon-neon" />
          
          <h2 className="title-neon">Welcome, {name.split(' ')[0]}!</h2>
          <p className="subtitle-neon">Your LMS Access Panel</p>

          <div className="info-group-neon">
            <p className="info-line-neon">
              <FaIdCard className="info-icon-neon" />
              <strong>ID:</strong> {userId}
            </p>
            <p className="info-line-neon">
              <FaEnvelope className="info-icon-neon" />
              <strong>Email:</strong> {email}
            </p>
            <p className="info-line-neon">
              <FaToolbox className="info-icon-neon" />
              <strong>Role:</strong> {role}
            </p>
          </div>
          
          {/* Neon Divider */}
          <div className="neon-divider-dashboard"></div>

          <button
            onClick={logout}
            className="btn-logout-neon"
          >
            <FaSignOutAlt className="logout-icon-neon" />
            Secure Logout
          </button>
        </div>
      </div>

      {/* Embedded Neon Styles */}
      <style>{`
        /* NEON COLOR DEFINITIONS (Matching Login) */
        :root {
          --neon-color: #00FFFF; /* Electric Blue */
          --dark-bg: #022c22;
          --light-text: #ecfdf5;
          --red-neon: #ff6347; /* For the logout button */
          --neon-shadow-blue: 0 0 5px var(--neon-color), 0 0 10px var(--neon-color);
          --neon-shadow-red: 0 0 5px var(--red-neon), 0 0 10px var(--red-neon);
        }

        /* Full Page Container */
        .dashboard-container-neon {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: radial-gradient(circle at 50% 50%, #064e3b, var(--dark-bg));
          padding: 40px;
          font-family: 'Poppins', sans-serif;
        }

        /* Card Styling */
        .profile-card-neon {
          width: 100%;
          max-width: 450px;
          padding: 40px;
          background: rgba(0, 0, 0, 0.5); 
          backdrop-filter: blur(15px);
          border-radius: 20px;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.2); 
          border: 1px solid rgba(0, 255, 255, 0.1);
          color: var(--light-text);
          text-align: center;
          animation: fadeIn 0.8s ease forwards;
        }

        /* Title */
        .title-neon {
          font-size: 28px;
          color: var(--neon-color);
          text-shadow: var(--neon-shadow-blue);
          margin-bottom: 5px;
        }
        
        .subtitle-neon {
            color: #10b981;
            font-size: 16px;
            margin-bottom: 30px;
        }

        /* Profile Icon */
        .profile-icon-neon {
            font-size: 60px;
            color: var(--neon-color);
            margin-bottom: 20px;
            filter: drop-shadow(var(--neon-shadow-blue));
        }

        /* Info Group */
        .info-group-neon {
            text-align: left;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }

        .info-line-neon {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .info-line-neon:last-child {
            margin-bottom: 0;
        }
        
        .info-line-neon strong {
            display: inline-block;
            min-width: 80px;
            font-weight: 600;
            color: #a7f3d0;
            margin-right: 10px;
        }

        .info-icon-neon {
            color: #10b981;
            margin-right: 10px;
            font-size: 18px;
        }

        /* Divider */
        .neon-divider-dashboard {
          height: 1px;
          background: linear-gradient(to right, transparent, var(--neon-color), transparent);
          box-shadow: 0 0 3px var(--neon-color), 0 0 6px var(--neon-color);
          margin: 30px 0;
        }

        /* Logout Button - Red Neon Theme */
        .btn-logout-neon {
          width: 100%;
          padding: 12px;
          background-color: var(--red-neon);
          color: var(--dark-bg);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--neon-shadow-red);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-logout-neon:hover {
          background-color: #ff8c69;
          transform: translateY(-2px);
          box-shadow: 0 0 15px var(--red-neon), 0 0 30px var(--red-neon);
        }
        
        .logout-icon-neon {
            font-size: 18px;
        }

        /* Animation */
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

      `}</style>
    </>
  );
};

export default Dashboard;