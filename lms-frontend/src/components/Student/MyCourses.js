import React, { useState, useEffect } from 'react';
import {
    FaUniversity, FaBookOpen, FaUserCircle, FaSignOutAlt, FaBars, FaTimes,
    FaListAlt, FaStar, FaArrowRight, FaClock, FaSpinner, FaCalendarAlt
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import './StudentDashboard.css'; // Assuming shared styles
import { useAuth } from "../../context/AuthContext";

// --- Configuration ---
const API_BASE_URL = 'https://lms-portal-backend-h5k8.onrender.com/api';

// ---------------------------------------------------------------------
// --- REUSED COMPONENTS (Copy/Paste from EnrollCourses for consistency) ---
// ---------------------------------------------------------------------

// Placeholder for Profile Modal
const ProfileModal = ({ authData, onClose }) => {
    const { name, logout } = authData;
    return (
        <div className="profile-modal-backdrop" onClick={onClose}>
            <div className="profile-card-neon" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}><FaTimes /></button>
                <h2 className="title-neon">Welcome, {name.split(' ')[0]}!</h2>
                <button onClick={logout} className="btn-logout-neon full-width-btn">
                    <FaSignOutAlt /> Secure Logout
                </button>
            </div>
        </div>
    );
};

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
            <Link to="/student" className="nav-link"><FaListAlt /> <span className="link-text">Dashboard</span></Link>
            {/* Set active class for My Courses link */}
            <Link to="/student/my-courses" className="nav-link active"><FaBookOpen /> <span className="link-text">My Courses</span></Link>
            <Link to="/student/courses" className="nav-link"><FaUniversity /> <span className="link-text">Enroll Courses</span></Link>
            <Link to="/student/grades" className="nav-link"><FaStar /> <span className="link-text">Grades</span></Link>
            <Link to="/student/disucusion" className="nav-link"><FaStar /> <span className="link-text">Discusion Forum</span></Link>
            <Link to="/student/profile" className="nav-link"><FaUserCircle /> <span className="link-text">Profile</span></Link>
        </nav>
    </aside>
);

// New CourseCard for Enrolled Courses - includes enrollment date and teacher info
const EnrolledCourseCard = ({ course }) => {
    // Assuming the enrollment date is available through the 'Enrollment' object in the course data
    const enrollmentDate = course.Enrollment?.enrollmentDate
        ? new Date(course.Enrollment.enrollmentDate).toLocaleDateString()
        : 'N/A';
    
    const teacherName = course.Teacher?.name || 'Instructor N/A';

    return (
        <div className="course-card-neon enrolled">
            <h4 className="card-title">{course.title}</h4>
            <p className="card-description">{course.description.substring(0, 100)}...</p>
            <div className="card-meta">
                <span><FaClock /> Duration: {course.duration || 'N/A'}</span>
                <span><FaUserCircle /> Teacher: {teacherName}</span>
            </div>
            <div className="card-meta-bottom">
                   <span className="enrollment-date"><FaCalendarAlt /> Enrolled: {enrollmentDate}</span>
            </div>
            {/* 💡 CHANGE: Use Link to navigate to the course details page */}
            <Link to={`/student/my-courses/${course.id}`} className="btn-action-neon btn-view">
                <FaArrowRight /> Go to Course
            </Link>
        </div>
    );
};
// ---------------------------------------------------------------------

/**
 * MyCourses Component
 * Fetches and displays a list of courses the student is currently enrolled in.
 */
const MyCourses = () => {
    const auth = useAuth();
    const navigate = useNavigate();
    
    const { user, logout, token } = auth;
    const studentName = user?.name || 'Student';

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
    const toggleProfile = () => setIsProfileOpen(prev => !prev);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- API Fetch Logic: Get My Enrolled Courses ---
    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                if (!token) {
                    setError("Authentication required. Please log in.");
                    setIsLoading(false);
                    navigate('/login');
                    return;
                }

                // TARGET ENDPOINT: /api/enrollments/my-courses
                const response = await fetch(`${API_BASE_URL}/enrollments/my-courses`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`, // Include JWT token
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch enrolled courses.');
                }

                const data = await response.json();
                
                // The backend response structure: { data: { courses: [...] } }
                setEnrolledCourses(data.data.courses || []);

            } catch (err) {
                console.error("Enrolled course fetch error:", err);
                setError(err.message || 'An unexpected error occurred while loading your courses.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchEnrolledCourses();
    }, [token, navigate]);


    const mainContentClass = `main-content-area ${!isSidebarOpen ? 'sidebar-closed-content' : ''}`;

    return (
        <>
            {/* Profile Modal */}
            {isProfileOpen && (
                <ProfileModal 
                    authData={{ name: studentName, email: user?.email, userId: user?.id, role: user?.role, logout: handleLogout }} 
                    onClose={toggleProfile} 
                />
            )}

            <div className="app-container">
                {/* Navbar */}
                <DashboardNavbar 
                    studentName={studentName} 
                    onLogout={handleLogout}
                    onProfileToggle={toggleProfile}
                    onSidebarToggle={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                />
                
                {/* Sidebar */}
                <DashboardSidebar isOpen={isSidebarOpen} />

                {/* Main Content */}
                <main className={mainContentClass}>
                    <div className="welcome-banner dashboard-section">
                        <h1 className="section-title-neon">🎓 My Enrolled Courses</h1>
                        <p className="section-subtitle-neon">Continue your learning journey where you left off!</p>
                    </div>

                    <section className="dashboard-section core-section">
                        <h2 className="section-title-neon">Your Active Enrollments</h2>
                        
                        {isLoading && (
                            <div className="loading-state">
                                <FaSpinner className="spinner" /> 
                                <p>Loading your courses...</p>
                            </div>
                        )}

                        {error && (
                            <div className="error-state">
                                <p>Error: {error}</p>
                                <p>Please try again or check your network connection.</p>
                            </div>
                        )}

                        {!isLoading && !error && enrolledCourses.length > 0 ? (
                            <div className="courses-grid">
                                {enrolledCourses.map(course => (
                                    <EnrolledCourseCard 
                                        key={course.id}
                                        course={course}
                                    />
                                ))}
                            </div>
                        ) : (!isLoading && !error && (
                            <div className="widget-card widget-empty-state">
                                <p>You are not currently enrolled in any courses.</p>
                                <Link to="/student/courses" className="btn-action-neon">
                                    <FaUniversity /> Enroll in a New Course
                                </Link>
                            </div>
                        ))}
                    </section>
                </main>
            </div>
        </>
    );
};

export default MyCourses;