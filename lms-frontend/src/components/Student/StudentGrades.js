import React, { useState, useEffect } from 'react';
import {
  FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
  FaListAlt, FaStar, FaArrowRight, FaSpinner, FaCalendarAlt
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
// import './StudentDashboard.css'; // REMOVED: Styles are now injected
import { useAuth } from "../../context/AuthContext";

// API Base
const API_BASE_URL = 'https://lms-portal-backend-h5k8.onrender.com/api';

// --- CSS String to be injected ---
const GRADES_CSS = `
/* --- Neon Color Variables --- */
:root {
    --neon-blue: #00d0ff;
    --neon-purple: #ff00c8;
    --bg-dark: #121212;
    --card-dark: #1e1e1e;
    --text-light: #f0f0f0;

    /* Grade Colors */
    --grade-a: #00ff00;
    --grade-b: #00ffff;
    --grade-c: #ffff00;
    --grade-fail: #ff5555;
}

/* --- Main Content Area Background (Basic) --- */
.main-content-area {
    background-color: var(--bg-dark);
    color: var(--text-light);
    padding: 20px;
}

/* --- Header Styles (My Course Grades) --- */
.welcome-banner.dashboard-section {
    margin-bottom: 30px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(0, 208, 255, 0.3);
}

.section-title-neon {
    font-size: 2.5em;
    font-weight: 700;
    color: var(--neon-blue);
    text-shadow: 0 0 5px var(--neon-blue), 0 0 10px var(--neon-blue);
    margin: 0;
}

.section-subtitle-neon {
    color: var(--text-light);
    opacity: 0.8;
    margin-top: 5px;
}

/* --- Grades List Container --- */
.grades-list-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
}

/* --- Course Card (Interactive Grade Item) --- */
.widget-card {
    background-color: var(--card-dark);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
    transition: transform 0.2s ease-in-out, box-shadow 0.3s ease-in-out;
}

.grade-item-neon {
    border: 1px solid var(--neon-blue);
    box-shadow: 0 0 10px rgba(0, 208, 255, 0.3);
}

.grade-item-neon:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 20px var(--neon-blue), 0 0 10px var(--neon-purple); 
}

.card-title {
    color: var(--neon-purple);
    border-bottom: 2px solid var(--neon-blue);
    padding-bottom: 10px;
    margin-bottom: 15px;
    font-size: 1.5em;
    text-shadow: 0 0 3px var(--neon-purple);
}

/* --- Grades Table Styling --- */
.grades-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
}

.grades-table th, .grades-table td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--card-dark);
}

.grades-table th {
    background-color: rgba(0, 208, 255, 0.15);
    color: var(--neon-blue);
    font-weight: bold;
    text-transform: uppercase;
}

.grades-table tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
}

/* --- Grade Color Coding (Feedback) --- */
.grade-a { color: var(--grade-a); font-weight: bold; text-shadow: 0 0 2px rgba(0, 255, 0, 0.5); }
.grade-b { color: var(--grade-b); font-weight: bold; text-shadow: 0 0 2px rgba(0, 255, 255, 0.5); }
.grade-c { color: var(--grade-c); font-weight: bold; }
.grade-fail { color: var(--grade-fail); font-weight: bold; }

/* --- Overall Grade Section --- */
.overall-grade {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 1.2em;
    padding-top: 10px;
    border-top: 1px dashed rgba(0, 208, 255, 0.3);
    color: var(--text-light);
}

.overall-grade strong {
    margin-left: 10px;
}

/* --- No Assignments Message --- */
.no-assignments-message {
    text-align: center;
    color: var(--neon-purple);
    font-style: italic;
    padding: 20px 0;
    font-weight: 500;
}
`;
// --- End of CSS String ---


const DashboardNavbar = ({ studentName, onLogout, onProfileToggle, onSidebarToggle, isSidebarOpen }) => (
  <nav className="dashboard-navbar-neon">
    <button className="sidebar-toggle-btn" onClick={onSidebarToggle}>
      {isSidebarOpen ? <FaTimes /> : <FaBars />}
    </button>
    <div className="logo"><FaUniversity className="logo-icon" /> The Matrix Academy</div>
    <div className="nav-profile-group">
      <span className="student-name" onClick={onProfileToggle}><FaUserCircle /> {studentName}</span>
      <button className="btn-logout-neon" onClick={onLogout}><FaSignOutAlt /> Logout</button>
    </div>
  </nav>
);

const DashboardSidebar = ({ isOpen }) => (
  <aside className={`dashboard-sidebar-neon ${!isOpen ? 'sidebar-closed' : ''}`}>
    <div className="sidebar-header">MENU</div>
    <nav className="sidebar-nav">
      <Link to="/student" className="nav-link"><FaListAlt /> Dashboard</Link>
      <Link to="/student/my-courses" className="nav-link"><FaBookOpen /> My Courses</Link>
      <Link to="/student/courses" className="nav-link"><FaUniversity /> Enroll Courses</Link>
      <Link to="/student/grades" className="nav-link active"><FaStar /> Grades</Link>
      <Link to="/student/disucusion" className="nav-link"><FaStar /> <span className="link-text">Discusion Forum</span></Link>
      <Link to="/student/profile" className="nav-link"><FaUserCircle /> Profile</Link>
    </nav>
  </aside>
);

// ---------------------------
// Main Component
// ---------------------------
const StudentGrades = () => {
  const { userId, name, token, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [gradesData, setGradesData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentName = name || 'Student';
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // EFFECT TO INJECT CSS
  useEffect(() => {
    // Check if the style tag already exists to prevent duplicates
    if (!document.getElementById('grades-styles')) {
        const style = document.createElement('style');
        style.id = 'grades-styles';
        style.innerHTML = GRADES_CSS;
        document.head.appendChild(style);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/student-grades/my-grades`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error('Failed to fetch grades.');
        }

        const data = await res.json();
        setGradesData(data);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchGrades();
    else navigate('/login');
  }, [token, navigate]);

  const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

  return (
    <div className="app-container">
      <DashboardNavbar
        studentName={studentName}
        onLogout={handleLogout}
        onSidebarToggle={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />
      <DashboardSidebar isOpen={isSidebarOpen} />

      <main className={mainContentClass}>
        <div className="welcome-banner dashboard-section">
          <h1 className="section-title-neon">📊 My Course Grades</h1>
          <p className="section-subtitle-neon">View your assignment performance and course averages.</p>
        </div>

        {isLoading && (
          <div className="loading-state">
            <FaSpinner className="spinner" /> Loading grades...
          </div>
        )}

        {error && <div className="error-state">❌ {error}</div>}

        {!isLoading && !error && gradesData.length > 0 && (
          <div className="grades-list-container">
            {gradesData.map((course) => (
              <div key={course.courseTitle} className="widget-card grade-item-neon">
                <h2 className="card-title">{course.courseTitle}</h2>
                <table className="grades-table">
                  <thead>
                    <tr>
                      <th>Assignment</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Check if there are any assignments */}
                    {Object.entries(course.grades).length > 0 ? (
                      // Map existing assignments
                      Object.entries(course.grades).map(([assignment, grade], i) => (
                        <tr key={i}>
                          <td>{assignment}</td>
                          {/* Apply dynamic class based on grade for visual feedback */}
                          <td className={grade >= 90 ? 'grade-a' : grade >= 80 ? 'grade-b' : grade >= 70 ? 'grade-c' : grade !== null ? 'grade-fail' : ''}>
                            {grade !== null ? `${grade}%` : 'Not graded yet'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Display message if no assignments are found
                      <tr>
                        <td colSpan="2" className="no-assignments-message">
                          No assignments given yet for this course.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Overall Grade is only displayed if overallGrade is NOT null */}
                {course.overallGrade !== null && (
                  <div className="overall-grade">
                    <FaStar /> Overall Average:{" "}
                    {/* Apply dynamic class to the strong tag */}
                    <strong className={course.overallGrade >= 90 ? 'grade-a' : course.overallGrade >= 80 ? 'grade-b' : course.overallGrade >= 70 ? 'grade-c' : 'grade-fail'}>
                        {`${course.overallGrade}%`}
                    </strong>
                  </div>
                )}
                
              </div>
            ))}
          </div>
        )}

        {/* This block handles the case where the whole gradesData array is empty */}
        {!isLoading && !error && gradesData.length === 0 && (
          <div className="widget-card widget-empty-state">
            <p>No grades available yet.</p>
            <Link to="/student/my-courses" className="btn-action-neon">
              <FaBookOpen /> View My Courses
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentGrades;