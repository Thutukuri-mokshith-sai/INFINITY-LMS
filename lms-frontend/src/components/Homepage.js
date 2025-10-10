import { BookOpen, GraduationCap, Users, Award, TrendingUp, ArrowRight, Menu, X, UserCircle, Sparkles, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming this context provides name, role, isLoggedIn, etc.
import { useNavigate } from 'react-router-dom';

// Profile Dropdown Component
// Note: This component is only rendered if isLoggedIn is true, as per HomePage logic.
const ProfileDropdown = ({ toggleDropdown, navigateToProfile, logout }) => {
  // Destructure from useAuth directly, as the parent component ensures isLoggedIn is true.
  const { name, email, userId, role } = useAuth();

  return (
    <div className="profile-dropdown-container">
      <div className="dropdown-content">
        <div className="dropdown-header">
          <div className="profile-avatar-large">
            <UserCircle size={64} />
            <div className="avatar-glow"></div>
          </div>
          {/* Use optional chaining or a default value for name if useAuth can return null/undefined properties */}
          <h2 className="welcome-text">Welcome, {name ? name.split(' ')[0] : 'User'}!</h2>
          <p className="access-panel-text">Your LMS Access Panel</p>
        </div>

        <div className="profile-info">
          <div className="info-item">
            <span className="info-icon">🆔</span>
            <div className="info-content">
              <span className="info-label">ID:</span>
              <span className="info-value">{userId}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">✉️</span>
            <div className="info-content">
              <span className="info-label">Email:</span>
              <span className="info-value">{email}</span>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🛠️</span>
            <div className="info-content">
              <span className="info-label">Role:</span>
              <span className="role-badge">{role}</span>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        <button
          onClick={() => {
            // Since this component is only mounted when logged in, we navigate directly.
            navigateToProfile(); 
            toggleDropdown(false);
          }}
          className="profile-btn"
        >
          <UserCircle size={20} />
          <span>Go to Profile Dashboard</span>
          <ArrowRight size={16} className="arrow-icon" />
        </button>

        <button onClick={logout} className="logout-btn">
          <span className="logout-icon">🚪</span>
          Secure Logout
        </button>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { name, role, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  // --- MODIFIED FUNCTION ---
  // Checks if the user is logged in before navigating to '/profile'. 
  // If not logged in, redirects to '/login'.
  const navigateToProfile = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      // Logic for "user details not found redirect to /login"
      // This handles cases where a non-logged-in user somehow tries to trigger a profile nav.
      navigate('/login'); 
      setMobileMenuOpen(false); // Close menu if we navigate away
    }
  };

  const toggleProfileDropdown = () => setProfileDropdownOpen(prev => !prev);

  // --- No changes to the styles block for brevity, it remains as in the original code ---
  const styles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .page-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: radial-gradient(circle at 50% 50%, #064e3b, #022c22);
      color: #ecfdf5;
    }

    /* Navbar Styles */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(15px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-container {
      max-width: 80rem;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .nav-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 4rem;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .logo-icon-wrapper {
      padding: 0.5rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(0, 255, 255, 0.3);
    }

    .logo-icon {
      color: #00FFFF;
      filter: drop-shadow(0 0 5px #00FFFF) drop-shadow(0 0 10px #00FFFF);
      animation: pulse 2s ease-in-out infinite;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #00FFFF;
      text-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF;
    }

    .desktop-nav {
      display: none;
      align-items: center;
      gap: 2rem;
    }

    .nav-link {
      color: #d1d5db;
      font-weight: 500;
      text-decoration: none;
      transition: color 0.3s;
    }

    .nav-link:hover {
      color: #fff;
    }

    .auth-section {
      display: none;
      align-items: center;
      gap: 1rem;
      position: relative;
    }

    .profile-trigger {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: opacity 0.3s;
    }

    .profile-trigger:hover {
      opacity: 0.8;
    }

    .profile-info {
      text-align: right;
    }

    .profile-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #ecfdf5;
    }

    .profile-role {
      font-size: 0.75rem;
      color: #a7f3d0;
    }

    .profile-avatar {
      color: #00FFFF;
      filter: drop-shadow(0 0 5px #00FFFF) drop-shadow(0 0 10px #00FFFF);
    }

    .btn-outline {
      background: transparent;
      color: #00FFFF;
      border: 2px solid #00FFFF;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-outline:hover {
      background: rgba(0, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .btn-primary {
      background: #00FFFF;
      color: #022c22;
      border: none;
      padding: 0.5rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF;
      transition: all 0.3s;
    }

    .btn-primary:hover {
      box-shadow: 0 0 20px #00FFFF, 0 0 40px #00FFFF;
      transform: translateY(-2px);
    }

    .logout-btn-nav {
      background: transparent;
      color: #FF6347;
      border: 2px solid #FF6347;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      box-shadow: 0 0 5px #FF6347;
    }

    .logout-btn-nav:hover {
      background: rgba(255, 99, 71, 0.1);
      box-shadow: 0 0 10px #FF6347;
      transform: translateY(-2px);
    }

    .mobile-menu-btn {
      display: block;
      padding: 0.5rem;
      color: #d1d5db;
      background: none;
      border: none;
      cursor: pointer;
    }

    .mobile-menu {
      padding: 1rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .mobile-menu-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mobile-nav-link {
      color: #d1d5db;
      text-decoration: none;
      padding: 0.5rem 0;
      transition: color 0.3s;
    }

    .mobile-nav-link:hover {
      color: #fff;
    }

    .mobile-profile {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 0.75rem;
      padding-top: 0.75rem;
    }

    .mobile-profile-info {
      font-size: 0.875rem;
    }

    .mobile-btn {
      width: 100%;
      text-align: center;
    }

    .mobile-logout-btn {
      background: #FF6347 !important;
      color: #022c22 !important;
      box-shadow: 0 0 5px #FF6347;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    /* Profile Dropdown */
    .profile-dropdown-container {
      position: absolute;
      right: 0;
      top: 3rem;
      width: 18rem;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(0, 255, 255, 0.3);
      border-radius: 0.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      z-index: 60;
    }

    .dropdown-content {
      padding: 1rem;
    }

    .dropdown-header {
      text-align: center;
      margin-bottom: 1rem;
    }

    .profile-icon {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 0.5rem;
      color: #00FFFF;
      filter: drop-shadow(0 0 5px #00FFFF) drop-shadow(0 0 10px #00FFFF);
      animation: pulse 2s ease-in-out infinite;
    }

    .welcome-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ecfdf5;
      margin-bottom: 0.25rem;
    }

    .access-panel-text {
      font-size: 0.875rem;
      color: #a7f3d0;
    }

    .profile-info {
      margin: 1rem 0;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #a7f3d0;
      margin-bottom: 0.5rem;
    }

    .info-icon {
      font-size: 1rem;
    }

    .info-value {
      color: #ecfdf5;
    }

    .role-badge {
      color: #a7f3d0;
      font-weight: 600;
    }

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #00FFFF, transparent);
      box-shadow: 0 0 3px #00FFFF, 0 0 6px #00FFFF;
      margin: 1rem 0;
    }

    .profile-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: transparent;
      color: #ecfdf5;
      border: 1px solid rgba(0, 255, 255, 0.1);
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.3s;
      margin-bottom: 0.5rem;
    }

    .profile-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .arrow-icon {
      margin-left: auto;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: transparent;
      color: #FF6347;
      border: 2px solid #FF6347;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 0 5px #FF6347;
    }

    .logout-btn:hover {
      background: rgba(255, 99, 71, 0.1);
      box-shadow: 0 0 10px #FF6347;
    }

    .logout-icon {
      font-size: 1rem;
    }

    /* Main Content */
    .main-content {
      flex: 1;
    }

    .section {
      padding: 5rem 0;
    }

    .container {
      max-width: 80rem;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .hero-grid {
      display: grid;
      gap: 3rem;
      align-items: center;
    }

    .hero-content {
      animation: fadeIn 0.8s ease forwards;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      line-height: 1.2;
      color: #ecfdf5;
    }

    .neon-text {
      color: #00FFFF;
      text-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF;
      display: block;
      margin-top: 0.5rem;
    }

    .hero-description {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      color: #a7f3d0;
    }

    .cta-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .btn-large {
      padding: 1rem 2rem;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stats-card {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 2rem;
      animation: fadeIn 0.8s ease forwards;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .stat-item:last-child {
      margin-bottom: 0;
    }

    .stat-icon-wrapper {
      padding: 0.75rem;
      border-radius: 0.5rem;
      border: 1px solid rgba(0, 255, 255, 0.3);
    }

    .stat-icon {
      color: #00FFFF;
    }

    .stat-text-title {
      font-weight: 600;
      color: #00FFFF;
      margin-bottom: 0.25rem;
    }

    .stat-text-desc {
      font-size: 0.875rem;
      color: #a7f3d0;
    }

    /* Features Section */
    .section-header {
      text-align: center;
      margin-bottom: 4rem;
      animation: fadeIn 0.8s ease forwards;
    }

    .section-title {
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #00FFFF;
      text-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF;
    }

    .section-subtitle {
      font-size: 1.25rem;
      color: #a7f3d0;
    }

    .features-grid {
      display: grid;
      gap: 2rem;
    }

    .feature-card {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 2rem;
      text-align: center;
      transition: all 0.3s;
      animation: fadeIn 0.8s ease forwards;
    }

    .feature-card:hover {
      border-color: rgba(0, 255, 255, 0.3);
      transform: translateY(-5px);
    }

    .feature-icon-wrapper {
      width: 4rem;
      height: 4rem;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(0, 255, 255, 0.1);
      border: 1px solid rgba(0, 255, 255, 0.3);
    }

    .feature-icon {
      color: #00FFFF;
    }

    .feature-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: #00FFFF;
    }

    .feature-description {
      color: #a7f3d0;
    }

    /* CTA Section */
    .cta-card {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(15px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
      padding: 3rem;
      text-align: center;
      animation: fadeIn 0.8s ease forwards;
    }

    .cta-title {
      font-size: 2.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #00FFFF;
      text-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF;
    }

    .cta-description {
      font-size: 1.25rem;
      margin-bottom: 2rem;
      color: #a7f3d0;
    }

    /* Footer */
    .footer {
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(15px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: auto;
    }

    .footer-container {
      max-width: 80rem;
      margin: 0 auto;
      padding: 3rem 1rem;
    }

    .footer-grid {
      display: grid;
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .footer-description {
      font-size: 0.875rem;
      color: #a7f3d0;
    }

    .footer-title {
      font-weight: 600;
      margin-bottom: 1rem;
      color: #00FFFF;
    }

    .footer-links {
      list-style: none;
    }

    .footer-links li {
      margin-bottom: 0.5rem;
    }

    .footer-link {
      color: #d1d5db;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.3s;
    }

    .footer-link:hover {
      color: #fff;
    }

    .footer-contact {
      color: #a7f3d0;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .footer-divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #00FFFF, transparent);
      box-shadow: 0 0 3px #00FFFF, 0 0 6px #00FFFF;
      margin: 3rem 0 2rem;
    }

    .footer-copyright {
      text-align: center;
      font-size: 0.875rem;
      color: #a7f3d0;
    }

    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    /* Responsive Design */
    @media (min-width: 768px) {
      .desktop-nav {
        display: flex;
      }

      .auth-section {
        display: flex;
      }

      .mobile-menu-btn {
        display: none;
      }

      .hero-title {
        font-size: 3.75rem;
      }

      .hero-grid {
        grid-template-columns: 1fr 1fr;
      }

      .features-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .footer-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .stats-card {
        display: block;
      }
    }

    @media (max-width: 767px) {
      .stats-card {
        display: none;
      }
    }
  `;
  
  return (
    <div className="page-container">
      <style>{styles}</style>

      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-content">
            <div className="logo-section">
              <div className="logo-icon-wrapper">
                <GraduationCap size={24} className="logo-icon" />
              </div>
              <span className="logo-text">LearnHub</span>
            </div>

            <div className="desktop-nav">
              <a href="#" className="nav-link">Home</a>
              <a href="#" className="nav-link">Courses</a>
              <a href="#" className="nav-link">About</a>
              <a href="#" className="nav-link">Contact</a>
            </div>

            <div className="auth-section">
              {/* Only show profile/logout if logged in */}
              {isLoggedIn ? (
                <>
                  <div className="profile-trigger" onClick={toggleProfileDropdown}>
                    <div className="profile-info">
                      {/* Use optional chaining or a check for name */}
                      <p className="profile-name">{name ? name.split(' ')[0] : 'User'}</p>
                      <p className="profile-role">{role}</p>
                    </div>
                    <UserCircle size={40} className="profile-avatar" />
                  </div>
                  {profileDropdownOpen && (
                    <ProfileDropdown
                      toggleDropdown={setProfileDropdownOpen}
                      navigateToProfile={navigateToProfile}
                      logout={logout}
                    />
                  )}
                  <button onClick={logout} className="logout-btn-nav">
                    <span>🚪</span>
                    Logout
                  </button>
                </>
              ) : (
                // --- MODIFIED SECTION: Only display login/signup when NOT logged in ---
                <>
                  <button onClick={() => navigate('/login')} className="btn-outline">Login</button>
                  <button onClick={() => navigate('/signup')} className="btn-primary">Sign Up</button>
                </>
              )}
            </div>

            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="mobile-menu">
              <div className="mobile-menu-content">
                <a href="#" className="mobile-nav-link">Home</a>
                <a href="#" className="mobile-nav-link">Courses</a>
                <a href="#" className="mobile-nav-link">About</a>
                <a href="#" className="mobile-nav-link">Contact</a>

                {isLoggedIn ? (
                  <>
                    <div className="mobile-profile">
                      <UserCircle size={40} className="profile-avatar" />
                      <div>
                        <p className="profile-name">{name}</p>
                        <p className="profile-role">{role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        navigateToProfile();
                        setMobileMenuOpen(false);
                      }}
                      className="btn-outline mobile-btn"
                    >
                      <UserCircle size={20} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                      Profile Dashboard
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="btn-primary mobile-btn mobile-logout-btn"
                    >
                      <span>🚪</span>
                      Secure Logout
                    </button>
                  </>
                ) : (
                  // --- MODIFIED SECTION: Only display login/signup when NOT logged in ---
                  <>
                    <button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} className="btn-outline mobile-btn">Login</button>
                    <button onClick={() => { navigate('/signup'); setMobileMenuOpen(false); }} className="btn-primary mobile-btn">Sign Up</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content (No functional changes) */}
      <main className="main-content">
        {/* Hero Section */}
        <section className="section">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-content">
                <h1 className="hero-title">
                  Learn Without
                  <span className="neon-text">Limits</span>
                </h1>
                <p className="hero-description">
                  Access world-class courses, connect with expert teachers, and achieve your learning goals with our comprehensive Learning Management System.
                </p>
                <div className="cta-buttons">
                  {/* Updated CTA to use the navigation logic */}
                  <button onClick={isLoggedIn ? () => navigate('/dashboard') : () => navigate('/signup')} className="btn-primary btn-large">
                    {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
                    <ArrowRight size={20} />
                  </button>
                  <button className="btn-outline btn-large">
                    Explore Courses
                  </button>
                </div>
              </div>

              <div className="stats-card">
                <div className="stat-item">
                  <div className="stat-icon-wrapper">
                    <BookOpen size={24} className="stat-icon" />
                  </div>
                  <div>
                    <p className="stat-text-title">500+ Courses</p>
                    <p className="stat-text-desc">Learn anything you want</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon-wrapper">
                    <Users size={24} className="stat-icon" />
                  </div>
                  <div>
                    <p className="stat-text-title">10,000+ Students</p>
                    <p className="stat-text-desc">Join our community</p>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon-wrapper">
                    <Award size={24} className="stat-icon" />
                  </div>
                  <div>
                    <p className="stat-text-title">Expert Teachers</p>
                    <p className="stat-text-desc">Learn from the best</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Why Choose LearnHub?</h2>
              <p className="section-subtitle">Everything you need for an amazing learning experience</p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <BookOpen size={32} className="feature-icon" />
                </div>
                <h3 className="feature-title">Interactive Courses</h3>
                <p className="feature-description">
                  Engage with high-quality video content, assignments, and interactive materials designed for effective learning.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <Users size={32} className="feature-icon" />
                </div>
                <h3 className="feature-title">Expert Instructors</h3>
                <p className="feature-description">
                  Learn from industry professionals and experienced educators who are passionate about teaching.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <TrendingUp size={32} className="feature-icon" />
                </div>
                <h3 className="feature-title">Track Progress</h3>
                <p className="feature-description">
                  Monitor your learning journey with detailed analytics, grades, and personalized feedback.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section">
          <div className="container" style={{ maxWidth: '56rem' }}>
            <div className="cta-card">
              <h2 className="cta-title">Ready to Start Learning?</h2>
              <p className="cta-description">
                Join thousands of students already learning on LearnHub. Start your journey today!
              </p>
              {/* Updated CTA to use the navigation logic */}
              <button onClick={() => navigate('/signup')} className="btn-primary btn-large">
                Create Free Account
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (No functional changes) */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <div className="logo-icon-wrapper">
                  <GraduationCap size={24} className="logo-icon" />
                </div>
                <span className="logo-text">LearnHub</span>
              </div>
              <p className="footer-description">
                Empowering learners worldwide with quality education and innovative learning solutions.
              </p>
            </div>

            <div>
              <h3 className="footer-title">Quick Links</h3>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">About Us</a></li>
                <li><a href="#" className="footer-link">Courses</a></li>
                <li><a href="#" className="footer-link">Pricing</a></li>
                <li><a href="#" className="footer-link">Blog</a></li>
              </ul>
            </div>

            <div>
              <h3 className="footer-title">Support</h3>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">Help Center</a></li>
                <li><a href="#" className="footer-link">Contact Us</a></li>
                <li><a href="#" className="footer-link">FAQs</a></li>
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h3 className="footer-title">Contact</h3>
              <div className="footer-contact">
                <p>Email: support@learnhub.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Learning St, Education City</p>
              </div>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-copyright">
            <p>&copy; 2025 LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}